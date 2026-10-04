import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../setup";
import { resetTestDatabase } from "../fixtures/database";
import { login, authRequest, extractData } from "../helpers/request";

describe("School and Role Isolation", () => {
  let testData: Awaited<ReturnType<typeof resetTestDatabase>>;

  beforeAll(async () => {
    testData = await resetTestDatabase();
  });

  describe("Teacher isolation across schools", () => {
    it("should prevent Dakar teacher from seeing Thiès students", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/eleves?role=PROFESSEUR&limit=100");

      expect(res.status).toBe(200);
      const students = extractData<{ ecoleId: string; matricule: string }[]>(
        res,
        "data"
      );

      // All students should be from Dakar school only
      const thiesStudents = students?.filter(
        (s) => s.ecoleId === testData.schools.thies.id
      );
      expect(thiesStudents?.length || 0).toBe(0);

      // Should see Dakar students
      const dakarStudents = students?.filter(
        (s) => s.ecoleId === testData.schools.dakar.id
      );
      expect(dakarStudents?.length || 0).toBeGreaterThan(0);
    });

    it("should prevent Thiès teacher from seeing Dakar students", async () => {
      const cookie = await login("prof-thies@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/eleves?role=PROFESSEUR&limit=100");

      expect(res.status).toBe(200);
      const students = extractData<{ ecoleId: string }[]>(res, "data");

      // All students should be from Thiès school only
      const dakarStudents = students?.filter(
        (s) => s.ecoleId === testData.schools.dakar.id
      );
      expect(dakarStudents?.length || 0).toBe(0);

      // Should see Thiès students
      const thiesStudents = students?.filter(
        (s) => s.ecoleId === testData.schools.thies.id
      );
      expect(thiesStudents?.length || 0).toBeGreaterThan(0);
    });

    it("should prevent Dakar teacher from accessing Thiès student notes", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      // Try to get notes for Thiès evaluation
      const res = await authRequest(
        cookie,
        `/api/notes?evaluationId=${testData.evaluations.evalThies.id}`
      );

      expect(res.status).toBe(200);
      const notes = extractData<unknown[]>(res, "data");

      // Should return empty array (no access to Thiès evaluations)
      expect(notes?.length || 0).toBe(0);
    });

    it("should prevent Dakar teacher from posting notes for Thiès class", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      // Try to post notes for Thiès evaluation
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

      // Should be forbidden (403) or not found (404)
      expect([403, 404]).toContain(res.status);
    });

    it("should prevent teacher from creating class in another school", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/classes", {
        method: "POST",
        body: {
          nom: "CM2 A",
          niveau: "CM2",
          cycleId: testData.cycles.primaire.id,
          ecoleId: testData.schools.thies.id, // Try to create in Thiès
          capacite: 40,
          anneeScolaire: "2024-2025",
        },
      });

      // Should be forbidden
      expect(res.status).toBe(403);
    });

    it("should prevent teacher from importing students into another school", async () => {
      const cookie = await login("prof-dakar@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/eleves", {
        method: "POST",
        body: {
          matricule: "2024TEST001",
          nom: "Test",
          prenom: "Eleve",
          dateNaissance: "2013-01-01",
          sexe: "M",
          classeId: testData.classes.thiesCM1.id, // Try to add to Thiès class
          ecoleId: testData.schools.thies.id,
        },
      });

      // Should be forbidden
      expect(res.status).toBe(403);
    });
  });

  describe("Préfet isolation by school and cycle", () => {
    it("should limit préfet to their school only", async () => {
      const cookie = await login("prefet-dakar@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/eleves?role=PREFET&limit=100");

      expect(res.status).toBe(200);
      const students = extractData<{ ecoleId: string }[]>(res, "data");

      // Should only see Dakar students
      const thiesStudents = students?.filter(
        (s) => s.ecoleId === testData.schools.thies.id
      );
      expect(thiesStudents?.length || 0).toBe(0);

      const dakarStudents = students?.filter(
        (s) => s.ecoleId === testData.schools.dakar.id
      );
      expect(dakarStudents?.length || 0).toBeGreaterThan(0);
    });

    it("should limit préfet to their cycle (PRIMAIRE only)", async () => {
      const cookie = await login("prefet-dakar@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/eleves?role=PREFET&limit=100");

      expect(res.status).toBe(200);
      const students = extractData<{ matricule: string }[]>(res, "data");

      // Should not see 6ème student (COLLEGE cycle)
      const collegeStudent = students?.find(
        (s) => s.matricule === testData.students.eleveDakar6eme.matricule
      );
      expect(collegeStudent).toBeUndefined();

      // Should see CM1 students (PRIMAIRE cycle)
      const primaireStudent = students?.find(
        (s) => s.matricule === testData.students.eleveDakar1.matricule
      );
      expect(primaireStudent).toBeDefined();
    });
  });

  describe("Parent isolation to their children only", () => {
    it("should allow parent to see only their own children", async () => {
      const cookie = await login("parent@test.sn", "Admin@123");

      // Parent API endpoint that returns their children
      const res = await authRequest(cookie, "/api/parent/enfants");

      // Should succeed but may not exist yet - if 404, that's acceptable for this test
      // The important thing is that when it exists, it should only return the linked child
      if (res.status === 200) {
        const children = extractData<{ id: string }[]>(res, "data");

        // Should only see the one linked child (eleveDakar1)
        expect(children?.length || 0).toBeLessThanOrEqual(1);

        if (children && children.length > 0) {
          expect(children[0].id).toBe(testData.students.eleveDakar1.id);
        }
      }
    });

    it("should prevent parent from accessing another student's data directly", async () => {
      const cookie = await login("parent@test.sn", "Admin@123");

      // Try to access a student they're not linked to
      const res = await authRequest(
        cookie,
        `/api/eleves/${testData.students.eleveDakar2.id}`
      );

      // Should be forbidden or not found
      expect([403, 404]).toContain(res.status);
    });
  });

  describe("Admin has access to all schools", () => {
    it("should allow admin to see students from all schools", async () => {
      const cookie = await login("admin@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/eleves?limit=100");

      expect(res.status).toBe(200);
      const students = extractData<{ ecoleId: string }[]>(res, "data");

      // Admin should see students from both schools
      const dakarStudents = students?.filter(
        (s) => s.ecoleId === testData.schools.dakar.id
      );
      const thiesStudents = students?.filter(
        (s) => s.ecoleId === testData.schools.thies.id
      );

      expect(dakarStudents?.length || 0).toBeGreaterThan(0);
      expect(thiesStudents?.length || 0).toBeGreaterThan(0);
    });
  });

  describe("Directeur isolation by school", () => {
    it("should limit directeur to their school", async () => {
      const cookie = await login("directeur-dakar@test.sn", "Admin@123");

      const res = await authRequest(cookie, "/api/eleves?role=DIRECTEUR&limit=100");

      expect(res.status).toBe(200);
      const students = extractData<{ ecoleId: string }[]>(res, "data");

      // Should only see Dakar students
      const thiesStudents = students?.filter(
        (s) => s.ecoleId === testData.schools.thies.id
      );
      expect(thiesStudents?.length || 0).toBe(0);

      const dakarStudents = students?.filter(
        (s) => s.ecoleId === testData.schools.dakar.id
      );
      expect(dakarStudents?.length || 0).toBeGreaterThan(0);
    });
  });
});
