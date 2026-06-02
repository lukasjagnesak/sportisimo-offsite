'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'
import type { Story } from '@/types'

Font.register({
  family: 'Crimson',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/crimsontext/v19/wlp2gwHKFkZgtmSR3NB0oRJfbwhT.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/crimsontext/v19/wlp0gwHKFkZgtmSR3NB0oRJX1C1GDNNQ9rJPpg.woff2', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/crimsontext/v19/wlppgwHKFkZgtmSR3NB0oRJfajhRK_YejA.woff2', fontStyle: 'italic' },
  ],
})

const GENRE_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  superheroes: { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560' },
  princesses: { primary: '#6b2fa0', secondary: '#9b59b6', accent: '#f8c8d4' },
  dragons: { primary: '#7b2d00', secondary: '#c0392b', accent: '#f39c12' },
  space: { primary: '#0a0a1a', secondary: '#1a1a3e', accent: '#7ec8e3' },
  dinosaurs: { primary: '#1a4731', secondary: '#27ae60', accent: '#f9ca24' },
  cars: { primary: '#1a1a2e', secondary: '#c0392b', accent: '#f39c12' },
  ninjas: { primary: '#1a1a1a', secondary: '#2c2c2c', accent: '#e74c3c' },
  pirates: { primary: '#1a3a5c', secondary: '#2980b9', accent: '#f39c12' },
  unicorns: { primary: '#4a0080', secondary: '#9b59b6', accent: '#fd79a8' },
  mermaids: { primary: '#006994', secondary: '#0abde3', accent: '#48dbfb' },
  fairies: { primary: '#2d6a4f', secondary: '#52b788', accent: '#ffd6e7' },
  knights: { primary: '#4a3728', secondary: '#795548', accent: '#d4af37' },
  forest: { primary: '#1b4332', secondary: '#2d6a4f', accent: '#95d5b2' },
  ocean: { primary: '#023e8a', secondary: '#0077b6', accent: '#90e0ef' },
  wizards: { primary: '#240046', secondary: '#3c096c', accent: '#c77dff' },
  robots: { primary: '#1a1a2e', secondary: '#16213e', accent: '#00d2ff' },
  czech_folklore: { primary: '#4a1f00', secondary: '#8b3a00', accent: '#d4af37' },
  default: { primary: '#2c3e50', secondary: '#34495e', accent: '#f39c12' },
}

function parseStoryContent(content: string): { title: string; paragraphs: string[] } {
  const lines = content.split('\n').filter(line => line.trim())
  let title = 'Pohádka na dobrou noc'
  const paragraphs: string[] = []

  for (const line of lines) {
    if (line.startsWith('#')) {
      title = line.replace(/^#+\s*/, '').trim()
    } else if (line.startsWith('---') || line.startsWith('*Konec') || line.startsWith('*The End')) {
      break
    } else if (line.trim()) {
      paragraphs.push(line.trim())
    }
  }

  return { title, paragraphs }
}

interface StoryDocumentProps {
  story: Story
  genre: string
}

function StoryDocument({ story, genre }: StoryDocumentProps) {
  const colors = GENRE_COLORS[genre] || GENRE_COLORS.default
  const { title, paragraphs } = parseStoryContent(story.content)

  const styles = StyleSheet.create({
    page: {
      backgroundColor: '#fdfcf8',
      paddingTop: 60,
      paddingBottom: 80,
      paddingHorizontal: 60,
      fontFamily: 'Crimson',
    },
    decorativeBorder: {
      position: 'absolute',
      top: 15,
      left: 15,
      right: 15,
      bottom: 15,
      borderWidth: 3,
      borderColor: colors.accent,
      borderStyle: 'solid',
    },
    innerBorder: {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 20,
      bottom: 20,
      borderWidth: 1,
      borderColor: colors.accent,
      borderStyle: 'dashed',
    },
    header: {
      backgroundColor: colors.primary,
      marginHorizontal: -60,
      marginTop: -60,
      paddingHorizontal: 60,
      paddingTop: 40,
      paddingBottom: 30,
      marginBottom: 30,
    },
    logo: {
      fontSize: 11,
      color: colors.accent,
      fontFamily: 'Crimson',
      fontStyle: 'italic',
      marginBottom: 12,
      opacity: 0.8,
    },
    title: {
      fontSize: 28,
      fontWeight: 700,
      color: '#ffffff',
      fontFamily: 'Crimson',
      lineHeight: 1.3,
      marginBottom: 8,
    },
    titleAccent: {
      width: 60,
      height: 3,
      backgroundColor: colors.accent,
      marginTop: 10,
    },
    metaRow: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 20,
    },
    metaBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    metaText: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: 700,
    },
    body: {
      paddingTop: 10,
    },
    paragraph: {
      fontSize: 13,
      lineHeight: 1.8,
      color: '#2c2c2c',
      marginBottom: 14,
      textAlign: 'justify',
      fontFamily: 'Crimson',
    },
    boldText: {
      fontWeight: 700,
      color: colors.primary,
    },
    chapterDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.accent,
      opacity: 0.4,
    },
    dividerSymbol: {
      fontSize: 16,
      color: colors.accent,
      marginHorizontal: 12,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 60,
      right: 60,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.accent,
      borderTopStyle: 'solid',
      paddingTop: 10,
    },
    footerText: {
      fontSize: 9,
      color: '#999',
      fontStyle: 'italic',
    },
    pageNumber: {
      fontSize: 9,
      color: colors.primary,
    },
    dropCap: {
      fontSize: 42,
      fontWeight: 700,
      color: colors.primary,
      lineHeight: 1,
      float: 'left',
      marginRight: 4,
      marginTop: 2,
    },
  })

  const renderParagraph = (text: string, index: number) => {
    const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1')

    if (index === 0 && cleanText.length > 0) {
      return (
        <View key={index} style={{ marginBottom: 14 }}>
          <Text style={styles.paragraph}>{cleanText}</Text>
        </View>
      )
    }

    if (index > 0 && index % 8 === 0) {
      return (
        <View key={index}>
          <View style={styles.chapterDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerSymbol}>✦</Text>
            <View style={styles.dividerLine} />
          </View>
          <Text style={styles.paragraph}>{cleanText}</Text>
        </View>
      )
    }

    return <Text key={index} style={styles.paragraph}>{cleanText}</Text>
  }

  return (
    <Document
      title={title}
      author="DreamTales.eu"
      subject={`Pohádka pro ${story.child_name}`}
      creator="DreamTales AI"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.decorativeBorder} />
        <View style={styles.header}>
          <Text style={styles.logo}>✨ DreamTales.eu — pohádky na dobrou noc</Text>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.titleAccent} />
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>Pro: {story.child_name}</Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={[styles.metaText, { color: '#fff' }]}>{story.reading_length} min čtení</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {paragraphs.map((para, i) => renderParagraph(para, i))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DreamTales.eu — každou noc pohádka jen pro vaše dítě</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  )
}

export async function generateStoryPDF(story: Story, genre: string): Promise<Buffer> {
  const doc = <StoryDocument story={story} genre={genre} />
  const instance = pdf(doc)
  const blob = await instance.toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
