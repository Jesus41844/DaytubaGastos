import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { periodLabel, type Period } from "./periods";
import type { AgrupacionRecap, PersonalRecap } from "./recap";
import { formatCurrency } from "./money";

export type PdfTransaction = {
  date: string;
  concept: string;
  category: string;
  type: string;
  amountCents: number;
  notes: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, marginBottom: 16, color: "#555" },
  sectionTitle: { fontSize: 12, marginTop: 16, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  recapRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  recapLabel: { color: "#555" },
  recapValue: { fontFamily: "Helvetica-Bold" },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 4,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingVertical: 3,
  },
  colDate: { width: "14%" },
  colConcept: { width: "36%" },
  colCategory: { width: "18%" },
  colType: { width: "14%" },
  colAmount: { width: "18%", textAlign: "right" },
  empty: { color: "#777", marginTop: 8 },
});

function categoryLabel(category: string) {
  return category === "personal" ? "Personal" : "GREB";
}

function typeLabel(type: string) {
  return type === "income" ? "Ingreso" : "Gasto";
}

function PeriodPdfDocument({
  period,
  transactions,
  personalRecap,
  agrupacionRecap,
}: {
  period: Period;
  transactions: PdfTransaction[];
  personalRecap: PersonalRecap;
  agrupacionRecap: AgrupacionRecap;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Quincena {periodLabel(period)}</Text>
        <Text style={styles.subtitle}>{transactions.length} movimiento(s) en este periodo</Text>

        <Text style={styles.sectionTitle}>Recap — Personal</Text>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>Límite quincenal</Text>
          <Text style={styles.recapValue}>{formatCurrency(personalRecap.limitCents)}</Text>
        </View>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>Gastado</Text>
          <Text style={styles.recapValue}>{formatCurrency(personalRecap.spentCents)}</Text>
        </View>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>
            {personalRecap.remainingCents < 0 ? "Excedido" : "Restante"}
          </Text>
          <Text style={styles.recapValue}>
            {formatCurrency(Math.abs(personalRecap.remainingCents))}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recap — GREB</Text>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>Ingresos</Text>
          <Text style={styles.recapValue}>{formatCurrency(agrupacionRecap.incomeCents)}</Text>
        </View>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>Gastos</Text>
          <Text style={styles.recapValue}>{formatCurrency(agrupacionRecap.expensesCents)}</Text>
        </View>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>Balance</Text>
          <Text style={styles.recapValue}>{formatCurrency(agrupacionRecap.balanceCents)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Movimientos</Text>
        {transactions.length === 0 ? (
          <Text style={styles.empty}>Sin movimientos registrados en este periodo.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDate}>Fecha</Text>
              <Text style={styles.colConcept}>Concepto</Text>
              <Text style={styles.colCategory}>Categoría</Text>
              <Text style={styles.colType}>Tipo</Text>
              <Text style={styles.colAmount}>Monto</Text>
            </View>
            {transactions.map((t, i) => (
              <View style={styles.tableRow} key={i}>
                <Text style={styles.colDate}>{t.date}</Text>
                <Text style={styles.colConcept}>{t.concept}</Text>
                <Text style={styles.colCategory}>{categoryLabel(t.category)}</Text>
                <Text style={styles.colType}>{typeLabel(t.type)}</Text>
                <Text style={styles.colAmount}>{formatCurrency(t.amountCents)}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function generatePeriodPdf(params: {
  period: Period;
  transactions: PdfTransaction[];
  personalRecap: PersonalRecap;
  agrupacionRecap: AgrupacionRecap;
}): Promise<Buffer> {
  return renderToBuffer(<PeriodPdfDocument {...params} />);
}
