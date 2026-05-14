// ============================================
// InspectionReportPDF - Documento principal del informe
// REDISEÑO: Banner de decisión dominante + Key Findings + Cards
// Estructura: Veredicto > Hallazgos Clave > Detalles por Categoría
// ============================================

import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import { colors } from './styles/pdfStyles';
import PDFHeader from './components/PDFHeader';
import PDFVehicleInfo from './components/PDFVehicleInfo';
import PDFVerdict from './components/PDFVerdict';
import PDFKeyFindings from './components/PDFKeyFindings';
import PDFChecklist, {
  transformChecklistResults,
  calculateCategorySummary,
  extractCriticalFindings,
} from './components/PDFChecklist';
import PDFSummary from './components/PDFSummary';
import PDFFooter from './components/PDFFooter';

// Tipos para los datos del PDF
export interface PDFReportData {
  // Identificación
  reportId: number;
  bookingId: number;
  reportCode: string;
  date: string;
  completedAt: string;

  // Cliente
  client: {
    name: string;
    email: string;
    phone: string | null;
  };

  // Vehículo
  vehicle: {
    brand: string;
    model: string;
    year: number;
    plate: string | null;
    mileage: number | null;
  };

  // Scores
  overallScore: number;
  overallStatus: string;
  categories: Array<{
    name: string;
    score: number;
    status: string;
  }>;

  // Checklist
  checklistResults: Record<string, { status: string; comment?: string }>;

  // Documentos
  soatValid: boolean;
  soatStatus?: 'valid' | 'invalid' | 'na';
  soatExpiryDate: string | null;
  technicalReviewValid: boolean;
  technicalReviewStatus?: 'valid' | 'invalid' | 'na';
  technicalReviewExpiryDate: string | null;

  // Resumen
  executiveSummary: string | null;
  estimatedRepairCost: number | null;

  // Veredicto del mecánico
  mechanicalVerdict?: string;
  hasSiniestro?: boolean;
  hasKilometrajeAdulterado?: boolean;

  // Inspector
  inspectorName: string;
  inspectorSignature: string | null;

  // Fotos agrupadas por item del checklist
  photosByItem?: Record<string, string[]>;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    padding: 30,
    paddingBottom: 70,
    fontFamily: 'Helvetica',
  },
  content: {
    flex: 1,
  },
});

interface InspectionReportPDFProps {
  data: PDFReportData;
}

export default function InspectionReportPDF({ data }: InspectionReportPDFProps) {
  // Procesar datos del checklist
  const checklistCategories = transformChecklistResults(data.checklistResults || {});
  const categorySummary = calculateCategorySummary(data.checklistResults || {});
  const criticalFindings = extractCriticalFindings(data.checklistResults || {});

  // Calcular totales para Key Findings
  const totalDefects = categorySummary.reduce((sum, cat) => sum + cat.defectos, 0);
  const totalObservations = categorySummary.reduce((sum, cat) => sum + cat.observaciones, 0);
  const totalOk = categorySummary.reduce((sum, cat) => sum + cat.ok, 0);
  const hasChecklistData = checklistCategories.length > 0;

  // Determinar si necesitamos página 2 (solo si hay datos de checklist)
  const needsSecondPage = hasChecklistData;

  return (
    <Document>
      {/* ============================================ */}
      {/* PÁGINA 1 - DECISIÓN CLARA */}
      {/* Banner dominante + Key Findings + Observaciones */}
      {/* ============================================ */}
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.content}>
          {/* Header con logo y código */}
          <PDFHeader reportCode={data.reportCode} date={data.date} />

          {/* Datos del vehículo */}
          <PDFVehicleInfo
            brand={data.vehicle.brand}
            model={data.vehicle.model}
            year={data.vehicle.year}
            plate={data.vehicle.plate}
            mileage={data.vehicle.mileage}
          />

          {/* BANNER DE DECISIÓN - Grande y dominante */}
          <PDFVerdict
            status={data.overallStatus}
            estimatedCost={data.estimatedRepairCost}
            mechanicalVerdict={data.mechanicalVerdict}
            hasSiniestro={data.hasSiniestro}
            hasKilometrajeAdulterado={data.hasKilometrajeAdulterado}
          />

          {/* KEY FINDINGS - Métricas clave */}
          {hasChecklistData && (
            <PDFKeyFindings
              defectCount={totalDefects}
              observationCount={totalObservations}
              okCount={totalOk}
              soatValid={data.soatValid}
              soatStatus={data.soatStatus}
              technicalReviewValid={data.technicalReviewValid}
              technicalReviewStatus={data.technicalReviewStatus}
              criticalFindings={criticalFindings}
              estimatedCost={data.estimatedRepairCost}
            />
          )}

          {/* Observaciones del inspector */}
          {data.executiveSummary && (
            <PDFSummary
              executiveSummary={data.executiveSummary}
            />
          )}
        </View>

        <PDFFooter
          inspectorName={data.inspectorName}
          completedAt={data.completedAt}
          showSignature={!needsSecondPage}
        />
      </Page>

      {/* ============================================ */}
      {/* PÁGINA 2+ - DETALLE POR CATEGORÍA */}
      {/* Cards por categoría con defectos, observaciones, OK */}
      {/* ============================================ */}
      {needsSecondPage && (
        <Page size="A4" style={styles.page}>
          <View style={styles.content}>
            {/* Header mínimo */}
            <PDFHeader reportCode={data.reportCode} date={data.date} />

            {/* Detalle con cards por categoría */}
            <PDFChecklist categories={checklistCategories} photosByItem={data.photosByItem} />
          </View>

          <PDFFooter
            inspectorName={data.inspectorName}
            completedAt={data.completedAt}
            showSignature={true}
          />
        </Page>
      )}
    </Document>
  );
}
