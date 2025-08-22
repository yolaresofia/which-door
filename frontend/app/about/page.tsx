'use client'

export default function AboutPage() {
  const bg =
    'https://cdn.sanity.io/images/xerhtqd5/production/5441905f27813ad31022fd3b18e8cdd2436b20f5-692x450.gif'

  return (
    <main
      className="min-h-screen w-full bg-cover bg-center text-white"
      style={{backgroundImage: `url(${bg})`}}
    >
      <section className="w-full mx-auto px-6 pt-32">
        <p className="text-2xl leading-7">
          Our core team includes Directors, Producers, Cinematographers, Editors, Animators, UX
          Designers, Developers, Campaign and Social Media Managers. We also built a Circle of over
          100 creatives, across 50 countries, who write, direct, edit, animate, and everything in
          between. No matter how much we grow, no matter what new adventure we embark on, we will
          never lose our awe of the natural world, the human spirit, and the spectacular things we
          humans are capable of, if only given the chance.
        </p>
      </section>
    </main>
  )
}
