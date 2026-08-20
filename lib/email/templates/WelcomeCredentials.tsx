import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeCredentialsEmailProps {
  name: string;
  email: string;
  password: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Cliente',
  INSPECTOR: 'Inspector',
  ADMIN: 'Administrador',
};

export function WelcomeCredentialsEmail({
  name = 'Usuario',
  email = '',
  password = '',
  role = 'CLIENT',
}: WelcomeCredentialsEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu cuenta en VerifiCARLO ha sido creada</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>VerifiCARLO</Heading>
            <Text style={logoSubtext}>Bienvenido a la plataforma</Text>
          </Section>

          <Hr style={hr} />

          <Section style={content}>
            <Heading style={heading}>Hola {name}</Heading>
            <Text style={paragraph}>
              Se ha creado tu cuenta como <strong>{ROLE_LABELS[role] || role}</strong> en VerifiCARLO.
              Usa las siguientes credenciales para ingresar:
            </Text>

            <Section style={credentialsBox}>
              <Text style={credentialLabel}>Correo electrónico</Text>
              <Text style={credentialValue}>{email}</Text>
              <Text style={credentialLabel}>Contraseña</Text>
              <Text style={credentialValue}>{password}</Text>
            </Section>

            <Text style={paragraph}>
              Ingresa a <strong>verificarlo.com</strong> con estas credenciales. Te recomendamos cambiar tu contraseña después de iniciar sesión.
            </Text>

            <Text style={hint}>
              Si no esperabas esta cuenta, puedes ignorar este mensaje.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>© VerifiCARLO — verificarlo.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeCredentialsEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '480px',
};
const header = { padding: '24px 32px', textAlign: 'center' as const };
const logoText = { color: '#1F2937', fontSize: '26px', fontWeight: '700', margin: '0' };
const logoSubtext = { color: '#6B7280', fontSize: '12px', margin: '4px 0 0', textTransform: 'uppercase' as const, letterSpacing: '1px' };
const hr = { borderColor: '#e6ebf1', margin: '0' };
const content = { padding: '32px' };
const heading = { color: '#1F2937', fontSize: '22px', fontWeight: '600', margin: '0 0 12px' };
const paragraph = { color: '#4B5563', fontSize: '15px', lineHeight: '24px', margin: '0 0 20px' };
const credentialsBox = {
  backgroundColor: '#F3F4F6',
  borderRadius: '12px',
  padding: '20px 24px',
  marginBottom: '24px',
};
const credentialLabel = {
  color: '#6B7280',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};
const credentialValue = {
  color: '#1F2937',
  fontSize: '16px',
  fontWeight: '600',
  fontFamily: 'monospace',
  margin: '0 0 16px',
};
const hint = { color: '#9CA3AF', fontSize: '13px', textAlign: 'center' as const, margin: '0' };
const footer = { padding: '16px 32px', textAlign: 'center' as const };
const footerText = { color: '#9CA3AF', fontSize: '12px', margin: '0' };
