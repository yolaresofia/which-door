// app/contact/page.tsx
import ContactSection from '../components/ContactSection'

export default function ContactPage() {
  const bg = 'https://cdn.sanity.io/files/xerhtqd5/production/5068305fa81bd755e7c0dd4f119c8e2b995a8813.mp4'
  const previewPoster = 'https://cdn.sanity.io/images/xerhtqd5/production/99945ce01a04899a2742da8865740039d7513b57-3024x1964.png' // example poster URL
  return <ContactSection previewUrl={bg} previewPoster={previewPoster} />
}
