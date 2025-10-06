'use client'

export default function AboutPage() {
  const bg =
    'https://cdn.sanity.io/images/xerhtqd5/production/5441905f27813ad31022fd3b18e8cdd2436b20f5-692x450.gif'

  return (
    <main
      // small: center content X/Y; md+: normal flow (top)
      className="min-h-screen w-full bg-cover bg-center text-white flex items-center justify-center md:block"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <section className="mx-auto w-full px-6 pt-0 md:pt-32">
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
