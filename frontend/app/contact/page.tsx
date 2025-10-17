// app/contact/page.tsx
import ContactSection from '../components/ContactSection'

export default function ContactPage() {
  const bg =
    'https://player.vimeo.com/video/1126625562?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479'
  const previewPoster = 'https://cdn.sanity.io/images/xerhtqd5/production/99945ce01a04899a2742da8865740039d7513b57-3024x1964.png' // example poster URL
  return <ContactSection previewUrl={bg} previewPoster={previewPoster} />
}
