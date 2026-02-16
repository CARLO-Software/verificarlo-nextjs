// ============================================
// InspectionReportPDF - Documento principal del informe
// ============================================

import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import { colors } from './styles/pdfStyles';
import PDFHeader from './components/PDFHeader';
import PDFVehicleInfo from './components/PDFVehicleInfo';
import PDFClientInfo from './components/PDFClientInfo';
import PDFScoreCard from './components/PDFScoreCard';
import PDFCategoryResults from './components/PDFCategoryResults';
import PDFChecklist, { transformChecklistResults } from './components/PDFChecklist';
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
    paddingBottom: 100, // Espacio para el footer
    fontFamily: 'Helvetica',
  },
  content: {
    flex: 1,
  },
  pageBreak: {
    marginTop: 'auto',
  },
});

interface InspectionReportPDFProps {
  data: PDFReportData;
}

export default function InspectionReportPDF({ data }: InspectionReportPDFProps) {
  const checklistCategories = transformChecklistResults(data.checklistResults || {});

  return (
    <Document>
      {/* Página 1 - Resumen General */}
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          <PDFHeader reportCode={data.reportCode} date={data.date} />

          <PDFClientInfo
            name={data.client.name}
            email={data.client.email}
            phone={data.client.phone}
          />

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

          <PDFScoreCard score={data.overallScore} status={data.overallStatus} />

          <PDFCategoryResults categories={data.categories} />

          <PDFSummary
            executiveSummary={data.executiveSummary}
            recommendations={data.recommendations}
            estimatedRepairCost={data.estimatedRepairCost}
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
          totalPages={checklistCategories.length > 0 ? 2 : 1}
        />
      </Page>

      {/* Página 2 - Checklist Detallado (solo si hay items) */}
      {checklistCategories.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.content}>
            <PDFHeader reportCode={data.reportCode} date={data.date} />

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
