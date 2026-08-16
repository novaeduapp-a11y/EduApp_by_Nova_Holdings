import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "2px solid #1e40af",
    paddingBottom: 15,
  },
  headerLeft: {
    width: "60%",
  },
  headerRight: {
    width: "35%",
    alignItems: "flex-end",
  },
  schoolName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 5,
  },
  schoolInfo: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#1e40af",
    textTransform: "uppercase",
  },
  studentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f0f9ff",
    borderRadius: 5,
  },
  studentInfoCol: {
    width: "48%",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: "bold",
    width: 80,
    color: "#374151",
  },
  infoValue: {
    flex: 1,
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e40af",
    color: "white",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    padding: 6,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    padding: 6,
    backgroundColor: "#f9fafb",
  },
  colMatiere: { width: "35%" },
  colNote: { width: "13%", textAlign: "center" },
  colCoef: { width: "13%", textAlign: "center" },
  colMoyenne: { width: "13%", textAlign: "center" },
  colAppreciation: { width: "26%" },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryCard: {
    width: "30%",
    padding: 10,
    backgroundColor: "#f0f9ff",
    borderRadius: 5,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e40af",
  },
  mentionBadge: {
    padding: "4 8",
    borderRadius: 3,
    marginTop: 5,
  },
  mentionText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  appreciationBox: {
    marginBottom: 15,
    padding: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 5,
  },
  appreciationTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#374151",
  },
  appreciationText: {
    fontStyle: "italic",
    color: "#666",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 15,
    borderTop: "1px solid #e5e7eb",
  },
  signatureBox: {
    width: "30%",
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 30,
  },
  signatureLine: {
    width: "100%",
    borderBottom: "1px solid #374151",
  },
  qrCodeBox: {
    alignItems: "center",
    marginTop: 10,
  },
  qrCode: {
    width: 60,
    height: 60,
  },
  qrCodeText: {
    fontSize: 6,
    color: "#666",
    marginTop: 3,
  },
});

interface BulletinNote {
  matiere: string;
  note: number;
  noteSur: number;
  coefficient: number;
  moyenne: number;
  appreciation: string;
}

interface BulletinData {
  ecole: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
  };
  eleve: {
    nom: string;
    prenom: string;
    matricule: string;
    dateNaissance: string;
    classe: string;
    effectif: number;
  };
  periode: {
    nom: string;
    anneeScolaire: string;
  };
  notes: BulletinNote[];
  moyenneGenerale: number;
  rang: number;
  mention: string;
  appreciationGenerale: string;
  qrCodeUrl?: string;
  dateGeneration: string;
}

const getMentionColor = (mention: string) => {
  switch (mention) {
    case "Très Bien": return "#16a34a";
    case "Bien": return "#2563eb";
    case "Assez Bien": return "#0891b2";
    case "Passable": return "#ca8a04";
    default: return "#dc2626";
  }
};

const getAppreciation = (note: number, noteSur: number) => {
  const ratio = (note / noteSur) * 20;
  if (ratio >= 16) return "Excellent";
  if (ratio >= 14) return "Très bien";
  if (ratio >= 12) return "Bien";
  if (ratio >= 10) return "Assez bien";
  if (ratio >= 8) return "Passable";
  return "Insuffisant";
};

export function BulletinPDF({ data }: { data: BulletinData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.schoolName}>{data.ecole.nom}</Text>
            <Text style={styles.schoolInfo}>{data.ecole.adresse}</Text>
            <Text style={styles.schoolInfo}>Tél: {data.ecole.telephone}</Text>
            <Text style={styles.schoolInfo}>Email: {data.ecole.email}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>Année Scolaire</Text>
            <Text style={{ fontSize: 14, color: "#1e40af" }}>{data.periode.anneeScolaire}</Text>
            <Text style={{ fontSize: 10, marginTop: 5 }}>{data.periode.nom}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Bulletin de Notes</Text>

        {/* Student Info */}
        <View style={styles.studentInfo}>
          <View style={styles.studentInfoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nom:</Text>
              <Text style={styles.infoValue}>{data.eleve.nom}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Prénom:</Text>
              <Text style={styles.infoValue}>{data.eleve.prenom}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Matricule:</Text>
              <Text style={styles.infoValue}>{data.eleve.matricule}</Text>
            </View>
          </View>
          <View style={styles.studentInfoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Né(e) le:</Text>
              <Text style={styles.infoValue}>{data.eleve.dateNaissance}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Classe:</Text>
              <Text style={styles.infoValue}>{data.eleve.classe}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Effectif:</Text>
              <Text style={styles.infoValue}>{data.eleve.effectif} élèves</Text>
            </View>
          </View>
        </View>

        {/* Notes Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colMatiere}>Matière</Text>
            <Text style={styles.colNote}>Note</Text>
            <Text style={styles.colCoef}>Coef.</Text>
            <Text style={styles.colMoyenne}>Moyenne</Text>
            <Text style={styles.colAppreciation}>Appréciation</Text>
          </View>
          {data.notes.map((note, index) => (
            <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colMatiere}>{note.matiere}</Text>
              <Text style={styles.colNote}>{note.note}/{note.noteSur}</Text>
              <Text style={styles.colCoef}>{note.coefficient}</Text>
              <Text style={styles.colMoyenne}>{note.moyenne.toFixed(2)}</Text>
              <Text style={styles.colAppreciation}>{note.appreciation || getAppreciation(note.note, note.noteSur)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Moyenne Générale</Text>
            <Text style={styles.summaryValue}>{data.moyenneGenerale.toFixed(2)}/20</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Rang</Text>
            <Text style={styles.summaryValue}>{data.rang}e / {data.eleve.effectif}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Mention</Text>
            <View style={[styles.mentionBadge, { backgroundColor: getMentionColor(data.mention) }]}>
              <Text style={styles.mentionText}>{data.mention}</Text>
            </View>
          </View>
        </View>

        {/* Appreciation */}
        <View style={styles.appreciationBox}>
          <Text style={styles.appreciationTitle}>Appréciation générale du conseil de classe:</Text>
          <Text style={styles.appreciationText}>{data.appreciationGenerale || "Élève sérieux et appliqué. Continuez ainsi."}</Text>
        </View>

        {/* Footer with signatures */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Directeur</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Maître/La Maîtresse</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Parent</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* QR Code */}
        {data.qrCodeUrl && (
          <View style={styles.qrCodeBox}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.qrCode} src={data.qrCodeUrl} />
            <Text style={styles.qrCodeText}>Scanner pour vérifier l&apos;authenticité</Text>
          </View>
        )}

        {/* Generation date */}
        <Text style={{ fontSize: 7, color: "#999", textAlign: "center", marginTop: 10 }}>
          Bulletin généré le {data.dateGeneration}
        </Text>
      </Page>
    </Document>
  );
}

export type { BulletinData, BulletinNote };
