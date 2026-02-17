// ============================================
// InspectionReportPDF - Documento principal del informe
// Nueva estructura: Veredicto claro + Hallazgos críticos prominentes
// ============================================

import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import { colors } from './styles/pdfStyles';
import PDFHeader from './components/PDFHeader';
import PDFVehicleInfo from './components/PDFVehicleInfo';
import PDFClientInfo from './components/PDFClientInfo';
import PDFVerdict from './components/PDFVerdict';
import PDFCriticalFindings from './components/PDFCriticalFindings';
import PDFCategoryResults from './components/PDFCategoryResults';
import PDFChecklist, { transformChecklistResults, extractCriticalFindings } from './components/PDFChecklist';
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
    padding: 40,
    paddingBottom: 100,
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
  const checklistCategories = transformChecklistResults(data.checklistResults || {});
  const criticalFindings = extractCriticalFindings(data.checklistResults || {});
  const hasCriticalFindings = criticalFindings.length > 0;
  const totalPages = checklistCategories.length > 0 ? 2 : 1;

  return (
    <Document>
      {/* ============================================ */}
      {/* PÁGINA 1 - VEREDICTO Y RESUMEN */}
      {/* ============================================ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          {/* Header con logo y código */}
          <PDFHeader reportCode={data.reportCode} date={data.date} />

          {/* Datos del vehículo (prominente) */}
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

          {/* VEREDICTO PRINCIPAL - El elemento más importante */}
          <PDFVerdict status={data.overallStatus} />

          {/* Hallazgos críticos (solo si existen) */}
          {hasCriticalFindings && (
            <PDFCriticalFindings
              findings={criticalFindings}
              estimatedCost={data.estimatedRepairCost}
            />
          )}

          {/* Resumen por categoría (semáforo visual) */}
          <PDFCategoryResults categories={data.categories} />

          {/* Documentación y observaciones */}
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
      {/* PÁGINA 2 - DETALLE TÉCNICO (solo si hay items) */}
      {/* ============================================ */}
      {checklistCategories.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.content}>
            <PDFHeader reportCode={data.reportCode} date={data.date} />

            {/* Info del cliente (en página 2 para no saturar pág 1) */}
            <PDFClientInfo
              name={data.client.name}
              email={data.client.email}
              phone={data.client.phone}
            />

            {/* Checklist detallado */}
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
