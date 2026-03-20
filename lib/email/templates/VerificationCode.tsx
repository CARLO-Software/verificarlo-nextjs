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

interface VerificationCodeEmailProps {
  clientName: string;
  code: string;
}

export function VerificationCodeEmail({
  clientName = 'Usuario',
  code = '000000',
}: VerificationCodeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu código de verificación de VerifiCARLO es {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>VerifiCARLO</Heading>
            <Text style={logoSubtext}>Verificación de cuenta</Text>
          </Section>

          <Hr style={hr} />

          <Section style={content}>
            <Heading style={heading}>Verifica tu correo</Heading>
            <Text style={paragraph}>
              Hola <strong>{clientName}</strong>, usa el siguiente código para verificar tu cuenta.
              Expira en <strong>15 minutos</strong>.
            </Text>

            <Section style={codeWrapper}>
              <Text style={codeText}>{code}</Text>
            </Section>

            <Text style={hint}>
              Si no creaste una cuenta en VerifiCARLO, puedes ignorar este mensaje.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>© VerifiCARLO — verificarlo.pe</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default VerificationCodeEmail;

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
const paragraph = { color: '#4B5563', fontSize: '15px', lineHeight: '24px', margin: '0 0 28px' };
const codeWrapper = {
  backgroundColor: '#FEF3C7',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '24px',
};
const codeText = {
  color: '#1F2937',
  fontSize: '40px',
  fontWeight: '700',
  letterSpacing: '12px',
  margin: '0',
  fontFamily: 'monospace',
};
const hint = { color: '#9CA3AF', fontSize: '13px', textAlign: 'center' as const, margin: '0' };
const footer = { padding: '16px 32px', textAlign: 'center' as const };
const footerText = { color: '#9CA3AF', fontSize: '12px', margin: '0' };
