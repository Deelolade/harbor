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

interface InviteEmailProps {
  inviterName: string;
  workspaceName: string;
  url: string;
}

export default function InviteEmail({ inviterName, workspaceName, url }: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} invited you to {workspaceName} on Harbor</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You've been invited</Heading>
          <Text style={text}>
            <strong style={{ color: "#fff" }}>{inviterName}</strong> has invited you
            to join <strong style={{ color: "#fff" }}>{workspaceName}</strong> on
            Harbor.
          </Text>
          <Section style={buttonWrapper}>
            <Button style={button} href={url}>
              Accept invitation
            </Button>
          </Section>
          <Text style={muted}>
            This invitation was sent from Harbor. If you weren't expecting this,
            you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#050505",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  color: "#000",
  padding: "14px 32px",
  borderRadius: "12px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};

const muted: React.CSSProperties = {
  color: "#52525B",
  fontSize: "13px",
  marginTop: "24px",
};
