'use client'

import BackgroundMedia from '../components/BackgroundMedia/BackgroundMedia'

const bg =
  'https://player.vimeo.com/video/1126625562?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479'
const previewPoster =
  'https://cdn.sanity.io/images/xerhtqd5/production/99945ce01a04899a2742da8865740039d7513b57-3024x1964.png'

export default function AboutPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden text-white flex items-center justify-center md:block">
      <BackgroundMedia previewUrl={bg} previewPoster={previewPoster} />
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      <section className="relative z-10 mx-auto w-full px-6 md:px-12 pt-0 md:pt-32">
        <p className="text-lg md:text-2xl leading-5 md:leading-7 text-justify md:text-left">
          We are a group of documentary filmmakers, war photographers, disaster relief workers, and
          climate activists that have spent the past 15 years in over 150 countries disrupting the
          aid and development industry. Humpback whale mating season in Tonga, spoken word poets in
          off strip Las Vegas, bedouin kitesurfers in the Sinai Desert, hunting lava in Iceland,
          yoga in Mogadishu. We showed the world of aid and development something different. Now
          we’re here to do the same in the commercial industry. We’re bringing our lens, our
          stranger than fiction TRUE stories, to the world of commercial content. Creative
          non-fiction storytelling for the commercial and branded universe. Welcome to our world.
        </p>
      </section>
    </main>
  )
}
