import StoryGenerator from '@/components/story/story-generator'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function GenerateStoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: children } = await supabase
    .from('children')
    .select('id, name, age, gender, story_preferences(genres, reading_length, delivery_time)')
    .eq('user_id', user.id)
    .eq('active', true)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-soft-white">Vytvořit pohádku</h1>
        <p className="text-muted text-sm mt-1">Personalizovaná pohádka vygenerovaná AI speciálně pro vaše dítě</p>
      </div>
      <StoryGenerator children={children ?? []} />
    </div>
  )
}
