import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Button, Img, Hr, Preview,
} from '@react-email/components'
import type { Story } from '@/types'

interface StoryEmailProps {
  parentName: string
  childName: string
  storyTitle: string
  storyExcerpt: string
  genre: string
  genreEmoji: string
  pdfFileName: string
  unsubscribeUrl: string
  dashboardUrl: string
}

export function StoryEmailTemplate({
  parentName,
  childName,
  storyTitle,
  storyExcerpt,
  genre,
  genreEmoji,
  dashboardUrl,
  unsubscribeUrl,
}: StoryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>🌙 Dnešní pohádka pro {childName}: {storyTitle}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>✨ DreamTales</Text>
            <Text style={headerTagline}>Pohádky na dobrou noc</Text>
          </Section>

          {/* Moon decoration */}
          <Section style={moonSection}>
            <Text style={moonText}>🌙</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={greeting}>Dobrý večer, {parentName}! 👋</Text>
            <Heading style={mainHeading}>
              Dnešní pohádka pro {childName} je připravena
            </Heading>

            <Section style={storyCard}>
              <Text style={genreTag}>{genreEmoji} {genre}</Text>
              <Heading as="h2" style={storyTitle_}>
                „{storyTitle}"
              </Heading>
              <Text style={excerpt}>
                {storyExcerpt.slice(0, 300)}...
              </Text>
            </Section>

            <Text style={instruction}>
              📄 Pohádka je přiložena jako PDF — vytiskněte ji nebo čtěte přímo z telefonu/tabletu.
            </Text>

            <Section style={ctaSection}>
              <Button href={dashboardUrl} style={ctaButton}>
                Otevřít v aplikaci →
              </Button>
            </Section>
          </Section>

          {/* Tips section */}
          <Section style={tipsSection}>
            <Text style={tipsTitle}>💡 Tip pro klidný spánek</Text>
            <Text style={tipsText}>
              Čtěte pohádku pomalým, klidným hlasem. Ztlumte světla a nechte dítě pohodlně lehnout.
              Přestávky mezi odstavci pomáhají mozku se uvolnit.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Pohádka vygenerována umělou inteligencí speciálně pro {childName} ❤️
            </Text>
            <Text style={footerLinks}>
              <a href={dashboardUrl} style={footerLink}>Správa účtu</a>
              {' · '}
              <a href={unsubscribeUrl} style={footerLink}>Odhlásit odběr</a>
            </Text>
            <Text style={footerLegal}>
              DreamTales s.r.o. · Praha, Česká republika · dreamtales.eu
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

interface WelcomeEmailProps {
  parentName: string
  dashboardUrl: string
  firstChildName?: string
}

export function WelcomeEmailTemplate({ parentName, dashboardUrl, firstChildName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Vítejte v DreamTales — pohádky na dobrou noc pro vaše děti</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>✨ DreamTales</Text>
            <Text style={headerTagline}>Pohádky na dobrou noc</Text>
          </Section>

          <Section style={content}>
            <Text style={moonText}>🎉</Text>
            <Heading style={mainHeading}>
              Vítejte, {parentName}!
            </Heading>
            <Text style={paragraph}>
              Jsme rádi, že jste součástí DreamTales — místa, kde každý večer vzniká
              originální pohádka speciálně pro vaše dítě.
            </Text>

            <Section style={stepsSection}>
              <Text style={stepTitle}>Jak začít za 3 minuty:</Text>
              <Text style={step}>
                <strong>1.</strong> Přidejte profil vašeho dítěte (jméno, věk, pohlaví)
              </Text>
              <Text style={step}>
                <strong>2.</strong> Vyberte oblíbené žánry pohádek
              </Text>
              <Text style={step}>
                <strong>3.</strong> Nastavte čas doručení každodenní pohádky
              </Text>
              <Text style={step}>
                <strong>4.</strong> Každý večer dostanete pohádku v PDF na e-mail
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Button href={dashboardUrl} style={ctaButton}>
                Začít teď →
              </Button>
            </Section>

            {firstChildName && (
              <Text style={paragraph}>
                Těšíme se, že brzy vygenerujeme první pohádku pro {firstChildName}! ✨
              </Text>
            )}
          </Section>

          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerLegal}>
              DreamTales s.r.o. · Praha, Česká republika · dreamtales.eu
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const body = {
  backgroundColor: '#f4f0eb',
  fontFamily: 'Georgia, serif',
}

const container = {
  margin: '0 auto',
  maxWidth: '600px',
  backgroundColor: '#fdfcf8',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
}

const header = {
  backgroundColor: '#1a1a3e',
  padding: '24px 40px',
  textAlign: 'center' as const,
}

const logo = {
  fontSize: '24px',
  color: '#f9ca24',
  margin: '0 0 4px',
  fontWeight: 'bold',
}

const headerTagline = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.7)',
  margin: '0',
  fontStyle: 'italic',
}

const moonSection = {
  textAlign: 'center' as const,
  padding: '20px',
  backgroundColor: '#1a1a3e',
}

const moonText = {
  fontSize: '48px',
  margin: '0',
}

const content = {
  padding: '32px 40px',
}

const greeting = {
  fontSize: '16px',
  color: '#666',
  margin: '0 0 8px',
}

const mainHeading = {
  fontSize: '24px',
  color: '#1a1a3e',
  margin: '0 0 24px',
  lineHeight: '1.3',
}

const storyCard = {
  backgroundColor: '#f8f4ff',
  border: '2px solid #6b2fa0',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
}

const genreTag = {
  fontSize: '12px',
  color: '#6b2fa0',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px',
  letterSpacing: '1px',
}

const storyTitle_ = {
  fontSize: '20px',
  color: '#1a1a3e',
  margin: '0 0 12px',
  fontStyle: 'italic',
}

const excerpt = {
  fontSize: '14px',
  color: '#444',
  lineHeight: '1.7',
  margin: '0',
}

const instruction = {
  fontSize: '14px',
  color: '#555',
  backgroundColor: '#fff8e1',
  padding: '12px 16px',
  borderRadius: '8px',
  margin: '0 0 24px',
  borderLeft: '4px solid #f9ca24',
}

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const ctaButton = {
  backgroundColor: '#6b2fa0',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
}

const tipsSection = {
  backgroundColor: '#e8f5e9',
  borderRadius: '8px',
  padding: '20px 24px',
  marginTop: '8px',
}

const tipsTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#2e7d32',
  margin: '0 0 8px',
}

const tipsText = {
  fontSize: '13px',
  color: '#444',
  lineHeight: '1.6',
  margin: '0',
}

const divider = {
  borderColor: '#e0d9ce',
  margin: '24px 0 16px',
}

const footer = {
  padding: '0 40px 32px',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '13px',
  color: '#666',
  margin: '0 0 8px',
}

const footerLinks = {
  fontSize: '12px',
  color: '#999',
  margin: '0 0 8px',
}

const footerLink = {
  color: '#6b2fa0',
  textDecoration: 'none',
}

const footerLegal = {
  fontSize: '11px',
  color: '#bbb',
  margin: '0',
}

const paragraph = {
  fontSize: '15px',
  color: '#333',
  lineHeight: '1.7',
  margin: '0 0 16px',
}

const stepsSection = {
  backgroundColor: '#f8f4ff',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '16px 0 24px',
}

const stepTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1a1a3e',
  margin: '0 0 12px',
}

const step = {
  fontSize: '14px',
  color: '#444',
  margin: '0 0 8px',
  lineHeight: '1.5',
}
