import Anthropic from '@anthropic-ai/sdk'
import { buildStoryPrompt } from './prompts'
import type { ReadingLength } from '@/types'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

interface GenerateStoryParams {
  childName: string
  childAge: number | null
  childGender: 'boy' | 'girl' | 'neutral'
  genre: string
  genreName: string
  readingLength: ReadingLength
  friends?: string[]
  parents?: string[]
  language?: 'cs' | 'en'
}

export async function generateStory(params: GenerateStoryParams): Promise<string> {
  const prompt = buildStoryPrompt(params)

  const message = await getClient().messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    system: `Jsi nejlepší autor pohádek pro děti v Česku. Píšeš originální, poutavé a vzdělávací pohádky, které rodiče čtou svým dětem před spaním. Tvoje pohádky jsou:
- Gramaticky správné v češtině
- Věkově vhodné (3-10 let)
- Plné fantazie a dobrodružství
- S jasným poučením
- Bezpečné a pozitivní
- Přizpůsobené konkrétnímu dítěti

NIKDY nezahrnej násilí, strachy, démony nebo nevhodný obsah pro děti.`,
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  return content.text
}
