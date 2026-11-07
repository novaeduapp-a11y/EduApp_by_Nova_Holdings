import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import {
  DEFAULT_BULLETIN_THEME,
  type BulletinThemeData,
} from "@/lib/bulletins/theme";

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
    sigle?: string | null;
  };
  eleve: {
    nom: string;
    prenom: string;
    matricule: string;
    dateNaissance: string;
    classe: string;
    effectif: number;
    photoUrl?: string | null;
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
  absences?: {
    total: number;
    justifiees: number;
    nonJustifiees: number;
  };
  theme?: BulletinThemeData;
  qrCodeUrl?: string;
  dateGeneration: string;
}

function buildStyles(theme: BulletinThemeData) {
  const primary = theme.couleurPrimaire;
  const secondary = theme.couleurSecondaire;

  return StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 10,
      fontFamily: "Helvetica",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      borderBottom: `2px solid ${primary}`,
      paddingBottom: 12,
    },
    headerLeft: {
      width: "62%",
      flexDirection: "row",
      gap: 10,
    },
    logo: {
      width: 48,
      height: 48,
      objectFit: "contain",
    },
    headerText: {
      flex: 1,
    },
    enteteLigne: {
      fontSize: 7,
      color: "#6b7280",
      textTransform: "uppercase",
      marginBottom: 1,
    },
    headerRight: {
      width: "35%",
      alignItems: "flex-end",
    },
    schoolName: {
      fontSize: 15,
      fontWeight: "bold",
      color: primary,
      marginBottom: 3,
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
      marginBottom: 16,
      color: primary,
      textTransform: "uppercase",
    },
    studentInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 15,
      padding: 10,
      backgroundColor: secondary,
      borderRadius: 5,
    },
    studentInfoCol: {
      width: "42%",
    },
    photoBox: {
      width: 56,
      height: 70,
      border: `1px solid ${primary}`,
      borderRadius: 3,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fff",
    },
    photo: {
      width: 56,
      height: 70,
      objectFit: "cover",
    },
    photoPlaceholder: {
      fontSize: 7,
      color: "#9ca3af",
      textAlign: "center",
      padding: 4,
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
      backgroundColor: primary,
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
      backgroundColor: secondary,
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
      color: primary,
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
    absencesBox: {
      marginBottom: 12,
      padding: 8,
      border: `1px solid ${primary}`,
      borderRadius: 4,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    absencesLabel: {
      fontSize: 9,
      color: "#374151",
      fontWeight: "bold",
    },
    absencesValue: {
      fontSize: 9,
      color: "#4b5563",
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
      textAlign: "center",
    },
    signatureLine: {
      width: "100%",
      borderBottom: "1px solid #374151",
    },
    piedLigne: {
      fontSize: 7,
      color: "#9ca3af",
      textAlign: "center",
      marginTop: 2,
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
}

const getMentionColor = (mention: string) => {
  switch (mention) {
    case "Très Bien":
      return "#16a34a";
    case "Bien":
      return "#2563eb";
    case "Assez Bien":
      return "#0891b2";
    case "Passable":
      return "#ca8a04";
    default:
      return "#dc2626";
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
  const theme = data.theme ?? DEFAULT_BULLETIN_THEME;
  const styles = buildStyles(theme);
  const schoolTitle = data.ecole.sigle
    ? `${data.ecole.nom} (${data.ecole.sigle})`
    : data.ecole.nom;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {theme.logoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image style={styles.logo} src={theme.logoUrl} />
            ) : null}
            <View style={styles.headerText}>
              {theme.lignesEntete.map((ligne, index) => (
                <Text key={`entete-${index}`} style={styles.enteteLigne}>
                  {ligne}
                </Text>
              ))}
              <Text style={styles.schoolName}>{schoolTitle}</Text>
              {data.ecole.adresse ? (
                <Text style={styles.schoolInfo}>{data.ecole.adresse}</Text>
              ) : null}
              {data.ecole.telephone ? (
                <Text style={styles.schoolInfo}>Tél: {data.ecole.telephone}</Text>
              ) : null}
              {data.ecole.email ? (
                <Text style={styles.schoolInfo}>Email: {data.ecole.email}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>Année Scolaire</Text>
            <Text style={{ fontSize: 14, color: theme.couleurPrimaire }}>
              {data.periode.anneeScolaire}
            </Text>
            <Text style={{ fontSize: 10, marginTop: 5 }}>{data.periode.nom}</Text>
          </View>
        </View>

        <Text style={styles.title}>Bulletin de Notes</Text>

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
          {theme.afficherPhoto ? (
            <View style={styles.photoBox}>
              {data.eleve.photoUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image style={styles.photo} src={data.eleve.photoUrl} />
              ) : (
                <Text style={styles.photoPlaceholder}>Photo</Text>
              )}
            </View>
          ) : null}
        </View>

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
              <Text style={styles.colNote}>
                {note.note}/{note.noteSur}
              </Text>
              <Text style={styles.colCoef}>{note.coefficient}</Text>
              <Text style={styles.colMoyenne}>{note.moyenne.toFixed(2)}</Text>
              <Text style={styles.colAppreciation}>
                {note.appreciation || getAppreciation(note.note, note.noteSur)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Moyenne Générale</Text>
            <Text style={styles.summaryValue}>{data.moyenneGenerale.toFixed(2)}/20</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Rang</Text>
            <Text style={styles.summaryValue}>
              {data.rang}e / {data.eleve.effectif}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Mention</Text>
            <View
              style={[styles.mentionBadge, { backgroundColor: getMentionColor(data.mention) }]}
            >
              <Text style={styles.mentionText}>{data.mention}</Text>
            </View>
          </View>
        </View>

        {theme.afficherAbsences && data.absences ? (
          <View style={styles.absencesBox}>
            <Text style={styles.absencesLabel}>Assiduité (période)</Text>
            <Text style={styles.absencesValue}>
              {data.absences.total} absence{data.absences.total > 1 ? "s" : ""} ·{" "}
              {data.absences.justifiees} justifiée{data.absences.justifiees > 1 ? "s" : ""} ·{" "}
              {data.absences.nonJustifiees} non justifiée
              {data.absences.nonJustifiees > 1 ? "s" : ""}
            </Text>
          </View>
        ) : null}

        {theme.afficherObservationConseil ? (
          <View style={styles.appreciationBox}>
            <Text style={styles.appreciationTitle}>
              Appréciation générale du conseil de classe:
            </Text>
            <Text style={styles.appreciationText}>
              {data.appreciationGenerale || "Élève sérieux et appliqué. Continuez ainsi."}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          {theme.labelsSignatures.map((label, index) => (
            <View key={`sig-${index}`} style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>{label}</Text>
              <View style={styles.signatureLine} />
            </View>
          ))}
        </View>

        {theme.lignesPied.map((ligne, index) => (
          <Text key={`pied-${index}`} style={styles.piedLigne}>
            {ligne}
          </Text>
        ))}

        {data.qrCodeUrl ? (
          <View style={styles.qrCodeBox}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.qrCode} src={data.qrCodeUrl} />
            <Text style={styles.qrCodeText}>Scanner pour vérifier l&apos;authenticité</Text>
          </View>
        ) : null}

        <Text style={{ fontSize: 7, color: "#999", textAlign: "center", marginTop: 10 }}>
          Bulletin généré le {data.dateGeneration}
        </Text>
      </Page>
    </Document>
  );
}

export type { BulletinData, BulletinNote };
