// ============================================
// InspectionReportPDF - Documento principal del informe
// Rediseño estratégico: Máximo 2 páginas, orientado a decisión
// Estructura: Veredicto > Costo > Cobertura > Detalle compacto
// ============================================

import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import { colors } from './styles/pdfStyles';
import PDFHeader from './components/PDFHeader';
import PDFVehicleInfo from './components/PDFVehicleInfo';
import PDFVerdict from './components/PDFVerdict';
import PDFEstimatedCost from './components/PDFEstimatedCost';
import PDFInspectionCoverage from './components/PDFInspectionCoverage';
import PDFChecklist, {
  transformChecklistResults,
  calculateCategorySummary,
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
    vin: string | null;
    mileage: number | null;
    color: string | null;
    engineNumber: string | null;
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
  soatExpiryDate: string | null;
  technicalReviewValid: boolean;
  technicalReviewExpiryDate: string | null;

  // Resumen
  executiveSummary: string | null;
  recommendations: string | null;
  estimatedRepairCost: number | null;

  // Inspector
  inspectorName: string;
  inspectorSignature: string | null;
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

  // Calcular totales
  const totalPoints = categorySummary.reduce((sum, cat) => sum + cat.total, 0);
  const totalNoAplica = categorySummary.reduce((sum, cat) => sum + cat.noAplica, 0);
  const hasChecklistData = checklistCategories.length > 0;
  const hasEstimatedCost =
    data.estimatedRepairCost !== null &&
    data.estimatedRepairCost !== undefined &&
    data.estimatedRepairCost > 0;

  // Determinar si necesitamos página 2 (solo si hay datos de checklist)
  const needsSecondPage = hasChecklistData;
  const totalPages = needsSecondPage ? 2 : 1;

  return (
    <Document>
      {/* ============================================ */}
      {/* PÁGINA 1 - DECISIÓN Y RESUMEN */}
      {/* Objetivo: El cliente debe poder decidir con solo esta página */}
      {/* ============================================ */}
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.content}>
          {/* Header con logo y código de reporte */}
          <PDFHeader reportCode={data.reportCode} date={data.date} />

          {/* Datos del vehículo (compacto) */}
          <PDFVehicleInfo
            brand={data.vehicle.brand}
            model={data.vehicle.model}
            year={data.vehicle.year}
            plate={data.vehicle.plate}
            vin={data.vehicle.vin}
            mileage={data.vehicle.mileage}
            color={data.vehicle.color}
            engineNumber={data.vehicle.engineNumber}
          />

          {/* VEREDICTO PRINCIPAL - Compacto y claro */}
          <PDFVerdict
            status={data.overallStatus}
            estimatedCost={data.estimatedRepairCost}
          />

          {/* Costo estimado (solo si hay costo > 0) */}
          {hasEstimatedCost && (
            <PDFEstimatedCost estimatedCost={data.estimatedRepairCost!} />
          )}

          {/* Cobertura de inspección - Muestra valor del servicio */}
          {categorySummary.length > 0 && (
            <PDFInspectionCoverage
              totalPoints={totalPoints}
              totalNoAplica={totalNoAplica}
              categories={categorySummary}
            />
          )}

          {/* Documentación y observaciones del inspector */}
          <PDFSummary
            executiveSummary={data.executiveSummary}
            recommendations={data.recommendations}
            soatValid={data.soatValid}
            soatExpiryDate={data.soatExpiryDate}
            technicalReviewValid={data.technicalReviewValid}
            technicalReviewExpiryDate={data.technicalReviewExpiryDate}
          />
        </View>

        <PDFFooter
          inspectorName={data.inspectorName}
          completedAt={data.completedAt}
          pageNumber={1}
          totalPages={totalPages}
        />
      </Page>

      {/* ============================================ */}
      {/* PÁGINA 2 - DETALLE TÉCNICO COMPACTO */}
      {/* Aquí se muestran los hallazgos con detalle */}
      {/* Formato: Problemas con comentarios, OK en texto corrido */}
      {/* ============================================ */}
      {needsSecondPage && (
        <Page size="A4" style={styles.page}>
          <View style={styles.content}>
            {/* Header mínimo */}
            <PDFHeader reportCode={data.reportCode} date={data.date} />

            {/* Checklist detallado con hallazgos y comentarios */}
            <PDFChecklist categories={checklistCategories} />
          </View>

          <PDFFooter
            inspectorName={data.inspectorName}
            completedAt={data.completedAt}
            pageNumber={2}
            totalPages={2}
          />
        </Page>
      )}
    </Document>
  );
}
