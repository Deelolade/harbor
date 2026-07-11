import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ResetPasswordProps {
  url: string;
}

export default function ResetPassword({ url }: ResetPasswordProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Atlas password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset your password. Click the button below
            to choose a new one.
          </Text>
          <Section style={buttonWrapper}>
            <Button style={button} href={url}>
              Reset password
            </Button>
          </Section>
          <Text style={text}>
            This link expires in 10 minutes. If you didn&apos;t request a reset,
            you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#050505",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: "40px 0",
};

const container: React.CSSProperties = {
  maxWidth: "480px",
  margin: "0 auto",
  backgroundColor: "#0D0D0D",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "16px",
  padding: "40px",
};

const h1: React.CSSProperties = {
  color: "#fff",
  fontSize: "22px",
  fontWeight: "700",
  marginTop: "0",
};

const text: React.CSSProperties = {
  color: "#A1A1AA",
  fontSize: "15px",
  lineHeight: "1.6",
  marginTop: "8px",
};

const buttonWrapper: React.CSSProperties = {
  textAlign: "center",
  marginTop: "28px",
  marginBottom: "28px",
};

const button: React.CSSProperties = {
  backgroundColor: "#EAB308",
  color: "#fff",
  padding: "14px 32px",
  borderRadius: "12px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};
