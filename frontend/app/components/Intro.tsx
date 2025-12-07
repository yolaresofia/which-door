import Image from 'next/image'

export default function Intro() {
  return (
    <section className="relative w-screen h-screen overflow-hidden">
      <Image
        src="https://cdn.sanity.io/images/xerhtqd5/production/5441905f27813ad31022fd3b18e8cdd2436b20f5-692x450.gif"
        alt="Intro background"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="https://cdn.sanity.io/images/xerhtqd5/production/0d40f22651c19648b1b763c39c3be9cf3df8e469-39x46.svg"
          alt="Which Door logo"
          width={265}
          height={313}
          priority
        />
      </div>
    </section>
  )
}
