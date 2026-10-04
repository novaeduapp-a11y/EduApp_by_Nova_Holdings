import { describe, it, expect, beforeAll } from "vitest";
import { resetTestDatabase } from "../fixtures/database";
import { login, authRequest, extractData } from "../helpers/request";

describe("Notes Authorization", () => {
  let testData: Awaited<ReturnType<typeof resetTestDatabase>>;

  beforeAll(async () => {
    testData = await resetTestDatabase();
  });

  describe("Teacher can only post notes for their assigned classes/subjects", () => {
    it("should allow teacher to post notes for their own class/subject", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      // Prof Dakar teaches Maths in CM1 A Dakar
      const res = await authRequest(cookie, "/api/notes", {
        method: "POST",
        body: {
          evaluationId: testData.evaluations.evalDakar.id,
          notes: [
            {
              eleveId: testData.students.eleveDakar1.id,
              note: 15,
              absent: false,
            },
            {
              eleveId: testData.students.eleveDakar2.id,
              note: 18,
              absent: false,
            },
          ],
        },
      });

      expect(res.status).toBe(200);
      const data = extractData<{ success?: boolean }>(res);
      expect(data.success).toBe(true);
    });

    it("should reject teacher posting notes for class they don't teach", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      // Try to post notes for Thiès class (not their school)
      const res = await authRequest(cookie, "/api/notes", {
        method: "POST",
        body: {
          evaluationId: testData.evaluations.evalThies.id,
          notes: [
            {
              eleveId: testData.students.eleveThies1.id,
              note: 15,
              absent: false,
            },
          ],
        },
      });

      // Should be forbidden (not their class/school)
      expect(res.status).toBe(403);
      const data = extractData<{ error?: { message?: string } }>(res);
      expect(data.error?.message).toBeTruthy();
    });

    it("should reject teacher posting notes without assignment to class/subject", async () => {
      const cookie = await login("prof-thies@test.sn", "Admin@123");

      // Thiès teacher should not be able to post for Dakar evaluation
      const res = await authRequest(cookie, "/api/notes", {
        method: "POST",
        body: {
          evaluationId: testData.evaluations.evalDakar.id,
          notes: [
            {
              eleveId: testData.students.eleveDakar1.id,
              note: 15,
              absent: false,
            },
          ],
        },
      });

      expect(res.status).toBe(403);
    });
  });

  describe("Note value validation", () => {
    it("should reject note value above noteSur", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      // Evaluation has noteSur of 20, try to post 25
      const res = await authRequest(cookie, "/api/notes", {
        method: "POST",
        body: {
          evaluationId: testData.evaluations.evalDakar.id,
          notes: [
            {
              eleveId: testData.students.eleveDakar1.id,
              note: 25, // Exceeds noteSur
              absent: false,
            },
          ],
        },
      });

      expect(res.status).toBe(400);
      const data = extractData<{ error?: { message?: string; code?: string } }>(
        res
      );
      expect(data.error?.code).toBe("VALIDATION_ERROR");
      expect(data.error?.message).toContain("note ne peut pas dépasser");
    });

    it("should reject negative note value", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/notes", {
        method: "POST",
        body: {
          evaluationId: testData.evaluations.evalDakar.id,
          notes: [
            {
              eleveId: testData.students.eleveDakar1.id,
              note: -5,
              absent: false,
            },
          ],
        },
      });

      expect(res.status).toBe(400);
      const data = extractData<{ error?: { code?: string } }>(res);
      expect(data.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should accept note at exact noteSur", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/notes", {
        method: "POST",
        body: {
          evaluationId: testData.evaluations.evalDakar.id,
          notes: [
            {
              eleveId: testData.students.eleveDakar1.id,
              note: 20, // Exactly noteSur
              absent: false,
            },
          ],
        },
      });

      expect(res.status).toBe(200);
    });

    it("should accept null note when student is absent", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/notes", {
        method: "POST",
        body: {
          evaluationId: testData.evaluations.evalDakar.id,
          notes: [
            {
              eleveId: testData.students.eleveDakar1.id,
              note: null,
              absent: true,
            },
          ],
        },
      });

      expect(res.status).toBe(200);
    });
  });

  describe("Teacher can only view notes for their classes", () => {
    it("should allow teacher to view notes for their evaluation", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      const res = await authRequest(
        cookie,
        `/api/notes?evaluationId=${testData.evaluations.evalDakar.id}`
      );

      expect(res.status).toBe(200);
      const notes = extractData<unknown[]>(res, "data");
      expect(Array.isArray(notes)).toBe(true);
    });

    it("should return empty array for notes of other school evaluations", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      // Try to view Thiès evaluation notes
      const res = await authRequest(
        cookie,
        `/api/notes?evaluationId=${testData.evaluations.evalThies.id}`
      );

      expect(res.status).toBe(200);
      const notes = extractData<unknown[]>(res, "data");
      
      // Should return empty array (no access to Thiès evaluations)
      expect(notes?.length || 0).toBe(0);
    });
  });

  describe("Admin can post and view notes for any class", () => {
    it("should allow admin to post notes for any evaluation", async () => {
      const cookie = await login("admin@test.sn", "Admin@123");

      // Admin can post for Dakar
      const res1 = await authRequest(cookie, "/api/notes", {
        method: "POST",
        body: {
          evaluationId: testData.evaluations.evalDakar.id,
          notes: [
            {
              eleveId: testData.students.eleveDakar1.id,
              note: 16,
              absent: false,
            },
          ],
        },
      });
      expect(res1.status).toBe(200);

      // Admin can post for Thiès
      const res2 = await authRequest(cookie, "/api/notes", {
        method: "POST",
        body: {
          evaluationId: testData.evaluations.evalThies.id,
          notes: [
            {
              eleveId: testData.students.eleveThies1.id,
              note: 17,
              absent: false,
            },
          ],
        },
      });
      expect(res2.status).toBe(200);
    });

    it("should allow admin to view notes from any school", async () => {
      const cookie = await login("admin@test.sn", "Admin@123");

      // View Dakar notes
      const res1 = await authRequest(
        cookie,
        `/api/notes?evaluationId=${testData.evaluations.evalDakar.id}`
      );
      expect(res1.status).toBe(200);

      // View Thiès notes
      const res2 = await authRequest(
        cookie,
        `/api/notes?evaluationId=${testData.evaluations.evalThies.id}`
      );
      expect(res2.status).toBe(200);
    });
  });

  describe("Bulk note posting validation", () => {
    it("should validate all notes in batch before saving any", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      // Submit batch with one invalid note
      const res = await authRequest(cookie, "/api/notes", {
        method: "POST",
        body: {
          evaluationId: testData.evaluations.evalDakar.id,
          notes: [
            {
              eleveId: testData.students.eleveDakar1.id,
              note: 15,
              absent: false,
            },
            {
              eleveId: testData.students.eleveDakar2.id,
              note: 25, // Invalid - exceeds noteSur
              absent: false,
            },
          ],
        },
      });

      // Should reject entire batch
      expect(res.status).toBe(400);

      // Verify no notes were saved
      const checkRes = await authRequest(
        cookie,
        `/api/notes?evaluationId=${testData.evaluations.evalDakar.id}`
      );
      const notes = extractData<{ eleveId: string; note: number }[]>(
        checkRes,
        "data"
      );

      // Neither note should have been saved
      const note1 = notes?.find(
        (n) => n.eleveId === testData.students.eleveDakar1.id && n.note === 15
      );
      const note2 = notes?.find(
        (n) => n.eleveId === testData.students.eleveDakar2.id && n.note === 25
      );
      expect(note1).toBeUndefined();
      expect(note2).toBeUndefined();
    });
  });
});
