/**
 * Template de email: Notificación de revisión legal pendiente
 * Se envía a los admins cuando un inspector completa una inspección
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface LegalReviewPendingEmailProps {
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate?: string;
  clientName: string;
  inspectorName: string;
  inspectionDate: string;
  reportId: number;
  reviewUrl: string;
}

export function LegalReviewPendingEmail({
  vehicleBrand = 'Toyota',
  vehicleModel = 'Corolla',
  vehicleYear = 2020,
  vehiclePlate = 'ABC-123',
  clientName = 'Juan Pérez',
  inspectorName = 'Carlos García',
  inspectionDate = '15/03/2024',
  reportId = 123,
  reviewUrl = 'https://verificarlo.com/admin/inspecciones/123/legal',
}: LegalReviewPendingEmailProps) {
  const previewText = `Nueva inspección completada: ${vehicleBrand} ${vehicleModel} - Revisión legal pendiente`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logoText}>VerifiCARLO</Heading>
            <Text style={logoSubtext}>Sistema de Inspecciones</Text>
          </Section>

          <Hr style={hr} />

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>Nueva Revisión Legal Pendiente</Heading>

            <Text style={paragraph}>
              El inspector <strong>{inspectorName}</strong> ha completado una inspección que requiere revisión legal.
            </Text>

            {/* Vehicle Info Card */}
            <Section style={vehicleCard}>
              <Text style={vehicleTitle}>Datos del Vehículo</Text>
              <Text style={vehicleInfo}>
                <strong>{vehicleBrand} {vehicleModel} ({vehicleYear})</strong>
              </Text>
              {vehiclePlate && (
                <Text style={vehiclePlateStyle}>Placa: {vehiclePlate}</Text>
              )}
            </Section>

            {/* Details */}
            <Section style={detailsSection}>
              <Text style={detailRow}>
                <span style={detailLabel}>Cliente:</span> {clientName}
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Fecha de inspección:</span> {inspectionDate}
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>ID del reporte:</span> #{reportId}
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Button style={button} href={reviewUrl}>
                Revisar Informe Legal
              </Button>
            </Section>

            <Text style={noteText}>
              El primer administrador en abrir el informe obtendrá el bloqueo exclusivo para completar la revisión legal.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este email fue enviado automáticamente por el sistema VerifiCARLO.
            </Text>
            <Text style={footerText}>
              <Link href="https://verificarlo.com" style={footerLink}>
                verificarlo.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '24px 32px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#1F2937',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '-0.5px',
};

const logoSubtext = {
  color: '#6B7280',
  fontSize: '12px',
  fontWeight: '500',
  margin: '4px 0 0 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '0',
};

const content = {
  padding: '32px',
};

const heading = {
  color: '#1F2937',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const paragraph = {
  color: '#4B5563',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px 0',
};

const vehicleCard = {
  backgroundColor: '#FEF3C7',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
};

const vehicleTitle = {
  color: '#92400E',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const vehicleInfo = {
  color: '#1F2937',
  fontSize: '20px',
  margin: '0 0 4px 0',
};

const vehiclePlateStyle = {
  color: '#6B7280',
  fontSize: '14px',
  margin: '0',
};

const detailsSection = {
  marginBottom: '24px',
};

const detailRow = {
  color: '#4B5563',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
};

const detailLabel = {
  color: '#6B7280',
};

const buttonSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#F5D849',
  borderRadius: '8px',
  color: '#1F2937',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const noteText = {
  color: '#9CA3AF',
  fontSize: '13px',
  fontStyle: 'italic' as const,
  textAlign: 'center' as const,
  margin: '0',
};

const footer = {
  padding: '24px 32px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0',
};

const footerLink = {
  color: '#6B7280',
  textDecoration: 'underline',
};

export default LegalReviewPendingEmail;
