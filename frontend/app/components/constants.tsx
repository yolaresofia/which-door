import {url} from 'inspector'

/**
 * Generate LQIP (Low Quality Image Placeholder) URL from Sanity CDN URL
 * Creates a tiny, blurred version for instant loading
 */
function getLQIP(cdnUrl: string): string {
  if (!cdnUrl || !cdnUrl.includes('cdn.sanity.io/images')) return ''
  try {
    const url = new URL(cdnUrl)
    url.searchParams.set('w', '20')
    url.searchParams.set('q', '20')
    url.searchParams.set('blur', '120')
    url.searchParams.set('auto', 'format')
    return url.toString()
  } catch {
    return ''
  }
}

const projectsData = [
  {
    name: 'Joy Anonymous',
    slug: 'joy-anonymous',
    isInHomePage: true,
    description:
      'From London\'s Southbank to Brooklyn, New York this is a story which captures how our community came along when it was needed most. An example of how the dance music industry has opened up with inclusivity and spontaneity as top priorities. Filmed between London and Brooklyn this short film spreads collective joy between the cities, diving deep into capturing Joy\'s growing community and its wonderful details',
    bgColor: '#477AA1',
    director: 'Sam Mulvey',
    vimeoUrl:
      'https://player.vimeo.com/video/1142353483?h=a2f71faa3d&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/39307a58130a77d181ee0f7a126b45175917e9f7.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/56e1c08338bae02337d4eb3156b2c81b31cfd118-3015x1694.jpg',
    otherProjects: [
      {
        title: 'Idris Elba x King Charles | Creative Futures',
        directors: ['Sam Mulvey'],
        brand: 'Creative Futures',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/c74d289e1c9327576dd6e710730550ee045221c4.webm',
      },
      {
        title: 'UFC Return To London (Ft Kojey Radical)',
        directors: ['Sam Mulvey'],
        brand: 'UFC',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/e723f5af4ae111bb4df2ed754b9a55d8d9758c30.mp4',
        url: '/projects/ufc-return-to-london-ft-kojey-radical',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/afcd2a263f5c2a6460196cb33258fbaa8ca072dc-4362x2454.webp',
        alt: 'Joy Anonymous 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/950e9a6bb9c23a42bd71097d5a4892599f067bc0-5120x2880.webp',
        alt: 'Joy Anonymous 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/5f8f641974ce7f9d0d04dab43c8f21c3823ebd8d-4362x2454.webp',
        alt: 'Joy Anonymous 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/33a274329cd56e14d6ad7910ad12dc48d1ad9527-4362x2454.webp',
        alt: 'Joy Anonymous 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/6dc33b9fcf498ffe0f5d9b85c12db0f8bfcefae3-4362x2454.webp',
        alt: 'Joy Anonymous 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/2b24a9ed5a2105d58409c814b23f3d1b183e921d-5120x2880.webp',
        alt: 'Joy Anonymous 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/2b70aac191c3bcfe60115b3ca32181e46e0341f0-5120x2880.webp',
        alt: 'Joy Anonymous 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/292133ad90005b264ff784ee1e5134afb730556f-4362x2454.webp',
        alt: 'Joy Anonymous 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/0a5d4869489494838cd26b2069dc3a26020b10ad-4362x2454.webp',
        alt: 'Joy Anonymous 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/af0973be168c2727ff5777d582f7529c6ad0b2fe-4362x2454.webp',
        alt: 'Joy Anonymous 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/876dc6e4080cfe00eeceecd79f496969f5e61327-5120x2880.webp',
        alt: 'Joy Anonymous 11',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/e1730a5f052f9a068234b098405626f9d148fd4d-4362x2454.webp',
        alt: 'Joy Anonymous 12',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/35d5049557ed6d426db70fc053f7a491719ec6a0-4362x2454.webp',
        alt: 'Joy Anonymous 13',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/ea7175ea652ce5f758d52fc66a8b5df202f36d70-5120x2880.webp',
        alt: 'Joy Anonymous 14',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/0da95a98d6823a0f643f05372d4dd416b5ffd852-4362x2454.webp',
        alt: 'Joy Anonymous 15',
      },
    ],
  },
  {
    name: 'Inside José Andrés’ Mini Bar',
    slug: 'inside-jose-andres-mini-bar',
    isInHomePage: true,
    description:
      'A peek inside Minibar, the two-Michelin-star restaurant by legendary chef José Andrés – one of the world’s most imaginative dining experiences. In this intimate space, art meets science, and tradition meets technique, creating dishes that feel like stories coming to life. After geeking out with José for hours about food and chemistry, we decided to make something that captures that same spark – a piece you can watch on your big screen or in the restaurant itself. Something that leaves you hooked, relaxed, and maybe a little bit hungry.',
    director: 'Alicia Sully',
    vimeoUrl:
      'https://player.vimeo.com/video/1129967137?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/4d3df752ed60996dbcb945a2b5f14d26198f1a73.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/e44aaf0bd3677dcf945f8d9ca083990bdff9ccd8-3016x1689.jpg',
    bgColor: '#477AA1',
    otherProjects: [
      {
        title: 'Idris Elba x King Charles | Creative Futures',
        directors: ['Sam Mulvey'],
        brand: 'Creative Futures',
        url: '/projects/idris-elba-x-king-charles-creative-futures',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/c74d289e1c9327576dd6e710730550ee045221c4.webm',
      },
      {
        title: 'Dreams of Blue Lagoon',
        directors: ['Chris Kousouros'],
        brand:"Which Door original",
        url: '/projects/dreams-of-blue-lagoon',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/fd636fb8e66e21e8fb59f765617ead285549708c.webm',
      },
      {
        title: 'La Magicienne Film V.1 | Bridal Couture Collection',
        directors: ['Mohamad Abdouni'],
        brand: 'HASSIDRISS',
        url: '/projects/la-magicienne-film-v1-bridal-couture-collection',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/79397636e29b834e4fb57ecf3ed8ffd779738314.webm',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/98e8d6b381c6a4caa1b9711c03a3d63628ac702b-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/63e221848b037bd9a0263c928d949d0f435a5b8c-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/97e15cd3dafb67b27a47f5df724c2bb8be9eee29-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/142718d960b312919f7908df7fd3e96c3502c27d-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/bca2cae82aee3b5a62e513645009f3933060afe7-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/420ba4ddaf22fec94fc4be20c91e58f2e4e03f7e-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/6f26efd6f160eb72f2b47c5252d7f2a3f2ab4e86-4092x2302.webp',
        alt: 'Inside José Andrés Mini bar 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/5800ee80527113059fc649b3b9e23226c3f54d1f-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/96f82082bbf1701be4cef26b4489428139cb2be3-4062x2285.webp',
        alt: 'Inside José Andrés Mini bar 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/7a2a6170862e16f38a37e2a717deb8013be1c0db-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/4aa0869d7931c4d5578dcf3c27aa2fc7931780ef-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 11',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/26dca14a7dc1c0160498fb53bc6f6d6b7b0a008e-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 12',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/ff8bb51a6ec112b8ce3cc9579a1c8441bd8066c3-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 13',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/1b89ed1040e746b10833063ba3e10afd88d15045-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 14',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/0d17c96671994f79c3e9a05ec73fb50363a29aef-4558x2564.webp',
        alt: 'Inside José Andrés Mini bar 15',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/13c8a774bc920d767f66a2bb8f7abb08ea78ddae-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 16',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/d22af6e697ad16ee11408f235f97292647b897a2-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 17',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/c0b8ee4cd27a827cf1fb361ef4da60fc5b7a2bc0-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 18',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/04b572cf50d1f4ae0840d7d1655bfffe78aa85c9-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 19',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/eae5684053765447c6a44e8d7bbec6578c3d490c-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 20',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/13e64e6070fe6dfbdce01615dcb3561eccd2cff4-4402x2476.webp',
        alt: 'Inside José Andrés Mini bar 21',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/b479de691a29e095167cadc65c483247301a8a55-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 22',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/9858293931f791411221e712b472333bd52fc5ba-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 23',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/12b576f9e21525239d00c9cb538c76a83800c824-4430x2492.webp',
        alt: 'Inside José Andrés Mini bar 24',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/45e5265d73bd3331435b94d78f8b19efad93cf55-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 25',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/6bc0ab986a726f90d515d9a086c6db4f24f6b57b-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 26',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/28e9d88db1ebce90726c34c998ef252400ed78f0-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 27',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/98516fbf00d661bb566257623bc282906c669038-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 28',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/9c5f12ec23fd484d492f0a9e074fe5878d08ce26-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 29',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/a27bf97f5276720fe2bf8228d1a0bebfc197db3b-4525x2545.webp',
        alt: 'Inside José Andrés Mini bar 30',
      },
    ],
  },
  {
    name: 'Grandma Artsakh',
    slug: 'grandma-artsakh',
    isInHomePage: true,
    description:
      'Have you ever thought about what a grandma born into a land of constant conflict has lived through? This short film is a letter of love, comfort, and apology from a young Armenian woman to a grandmother from Artsakh. We made it in 2024, after more than 100,000 people fled their homes – drained from a year-long blockade by Azerbaijan.',
    bgColor: '#477AA1',
    director: 'Chris Kousouros',
    vimeoUrl: 'https://player.vimeo.com/video/1129969216?h=69f4878882',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/732d0525dc8e2b41ddc9b72407136506ff5e692c.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/beb4465767e968074e7dfc2143fff5a2a311e36c-3024x1664.jpg',
    otherProjects: [
      {
        title: 'Dreams of Blue Lagoon',
        directors: ['Chris Kousouros'],
        brand:"Which Door original",
        url: '/projects/dreams-of-blue-lagoon',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/fd636fb8e66e21e8fb59f765617ead285549708c.webm',
      },
      {
        title: 'Leading the way',
        directors: ['Chris Kousouros'],
        brand: 'VOX Media',
        url: '/projects/leading-the-way',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/c7268f59042501a370ea496db9008bc6cbdc5a06.webm',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/2cbf39a1296c57269cfb5cc0fa66a1dff3989ebf-4853x2730.webp',
        alt: 'Grandma Artsakh 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/cf1732c62b38e9e75539109517d5819e46b82a98-4853x2730.webp',
        alt: 'Grandma Artsakh 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/e78e648472fe08f05d74a91a20caeb1259851a5e-4853x2730.webp',
        alt: 'Grandma Artsakh 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/79ed735b6ee40843fd0646358f46a84bacbf5c82-4853x2730.webp',
        alt: 'Grandma Artsakh 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/0e4222c3c67f84a2a9cb47682457fbdd1248dc54-4853x2730.webp',
        alt: 'Grandma Artsakh 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/3299e20008db57a841a4c095d5fc936b87679558-5120x2880.webp',
        alt: 'Grandma Artsakh 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/3dc761039617a8011b03fc9a100d7af7e0816e3e-5120x2880.webp',
        alt: 'Grandma Artsakh 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/9e88db8656a10b8d152f975485f31cfce20b9410-5120x2880.webp',
        alt: 'Grandma Artsakh 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/fea8e8caa050c6aab2cc2e6cb8a598a421ac58af-5120x2880.webp',
        alt: 'Grandma Artsakh 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/c789dd46d2981e4dd3f6f769937bd371b85f9e76-4853x2730.webp',
        alt: 'Grandma Artsakh 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/9f5269f53efaf2320a243aab805fa7d2b863cbd8-4853x2730.webp',
        alt: 'Grandma Artsakh 11',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/12931bb145c3fd248cfb875300db8115dbf7c298-4853x2730.webp',
        alt: 'Grandma Artsakh 12',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/e66c15967c5d82539da0e5227b434ad426e8ae91-5120x2880.webp',
        alt: 'Grandma Artsakh 13',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/8dec9d169231bd67c6c41488eda3a9c95aab8f7c-5120x2880.webp',
        alt: 'Grandma Artsakh 14',
      },
    ],
  },
  {
    name: 'Leading the way',
    slug: 'leading-the-way',
    isInHomePage: false,
    description:
      'In collaboration with VOX Media, we traveled to El Salvador to film with Valeria Zavaleta– a young digital artist from San Salvador who brings imaginary worlds to life through 3D design, animation, and AI. Maybe we’re not supposed to have favorites, but it’s hard not to when the person in front of our camera leaves us in awe.',
    bgColor: '#477AA1',
    director: 'Chris Kousouros',
    vimeoUrl:
      'https://player.vimeo.com/video/1143139608?h=b98afc1413&amp;title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/c7268f59042501a370ea496db9008bc6cbdc5a06.webm',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/f196a8938544a45832fe78b5aeec74199b5a9c5a-3017x1690.jpg',
    otherProjects: [
      {
        title: 'Dreams of Blue Lagoon',
        directors: ['Chris Kousouros'],
        brand:"Which Door original",
        url: '/projects/dreams-of-blue-lagoon',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/fd636fb8e66e21e8fb59f765617ead285549708c.webm',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/4799d8c9aefa24996bcec03f65a399265fb43f8f-4159x2339.webp',
        alt: 'VOX IMAGE 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/2542e8662f3f866867ed37c0bbb79fbb411dec09-4159x2339.webp',
        alt: 'VOX IMAGE 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/1bcf288c8b2538cafd9f8355e443a7228e09a25e-4159x2339.webp',
        alt: 'VOX IMAGE 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/c8ad31eeaaa162fc7bcbeaf1de57a4b7ee472f9e-4159x2339.webp',
        alt: 'VOX IMAGE 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/6ad357fa6dd135438f56486b253e20013b77f60f-4159x2339.webp',
        alt: 'VOX IMAGE 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/e9ca16517778412339e99440a6cc2459a08ad2fd-4159x2339.webp',
        alt: 'VOX IMAGE 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/6a184fbf90b4cf45d596c77d1a373952b8879a22-4159x2339.webp',
        alt: 'VOX IMAGE 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/0d58fc4de806fe97dc9fa106efaae4e44a22ae37-4159x2339.webp',
        alt: 'VOX IMAGE 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/29bde10687c5a3d4cd8831878aa598d939d2e8c7-4159x2339.webp',
        alt: 'VOX IMAGE 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/59fc67249f24d9032882daa6ccbfb65f8b64bfcd-3852x2167.webp',
        alt: 'VOX IMAGE 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/74d5000a82bc1c485337be47536d759d6c7fce9b-4159x2339.webp',
        alt: 'VOX IMAGE 11',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/8eb93eb97c779bb49787626e0d775ded8f84c692-4159x2339.webp',
        alt: 'VOX IMAGE 12',
      },
    ],
  },
  {
    name: 'UFC Return To London (Ft Kojey Radical)',
    slug: 'ufc-return-to-london-ft-kojey-radical',
    isInHomePage: true,
    description:
      'After a profound and aching silence, the UFC stages its massive, primal return, a spectacle desperately yearned for by the city of London. The film captures the simmering, almost explosive anticipation of fighters and fans waiting for the world to return to its visceral norm. British rapper Kojey Radical provides the narrative pulse, painting a lyrical portrait of the struggle and ultimate triumph leading up to the final bell.',
    bgColor: '#477AA1',
    director: 'Sam Mulvey',
    vimeoUrl: 'https://player.vimeo.com/video/1142245174?h=b7f577754f',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/b49bd1325f9de47f66f65fe691b257bbdd209de4.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/2a639663763e4e484e1c77f4026a7b0e94ba4ef0-3020x1705.jpg',
    otherProjects: [
      {
        title: 'Idris Elba x King Charles | Creative Futures',
        directors: ['Sam Mulvey'],
        brand: 'Creative Futures',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/c74d289e1c9327576dd6e710730550ee045221c4.webm',
      },
      {
        title: 'Joy Anonymous',
        directors: ['Sam Mulvey'],
        brand: 'Brooklyn Pilsner',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/39307a58130a77d181ee0f7a126b45175917e9f7.mp4',
        url: '/projects/joy-anonymous',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/8f9aece8b36c881463b5066eb0ed108ea13920b9-4850x2728.webp',
        alt: 'UFC 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/462767a744fb67013caed9801d204fdb9caad4ab-4850x2728.webp',
        alt: 'UFC 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/4ce47aec38979f886e2a11b0921d3d11e5081585-4850x2728.webp',
        alt: 'UFC 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/4ee3e0f7079b182c7edea2e198a629f6bcf80399-4850x2728.webp',
        alt: 'UFC 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/b8d872477aefdf46f168358d6b4dedd10d380580-4850x2728.webp',
        alt: 'UFC 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/90782c1e2aa85e8303c21e3954e2bc82b20a3ad3-4850x2728.webp',
        alt: 'UFC 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/8c20f301a3d6caa567478af20da2f3fbd41b84b8-4850x2728.webp',
        alt: 'UFC 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/a622541234aabbd1d40b32140484076b805f85a5-4850x2728.webp',
        alt: 'UFC 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/bbc7b2fee5b1c49aae3dbdadf9b71e7eb7175641-4850x2728.webp',
        alt: 'UFC 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/727e5e190ffba64406f7c6af6ec8e9f658f92c81-4850x2728.webp',
        alt: 'UFC 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/6a606cb00359d0d3a7097aff0ee351049966d80b-4850x2728.webp',
        alt: 'UFC 11',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/8817722f37c5d43e654d1fde8a5c83c226dec367-4850x2728.webp',
        alt: 'UFC 12',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/16ba6a6cd7ab8c68bdcaf6e4ac49d233051da8e6-4850x2728.webp',
        alt: 'UFC 13',
      },
    ],
  },
  {
    name: 'Idris Elba x King Charles | Creative Futures',
    slug: 'idris-elba-x-king-charles-creative-futures',
    isInHomePage: false,
    description:
      'Idris Elba and King Charles III have launched a powerful new collaboration focused on the future of Britain’s creative talent. The initiative will tear down barriers, providing vital access to careers in film, music, and the arts for young people. This is a commitment to nurturing the next generation of storytellers and innovators who currently lack entry to these industries. Together, they are lighting a path toward a diverse future where talent, not background, dictates success.',
    bgColor: '#477AA1',
    director: 'Sam Mulvey',
    vimeoUrl:
      'https://player.vimeo.com/video/1142244722?h=fa3ef8a83d&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/530325e24bae5b2ebc9b5008751797b24e7c6352.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/388b3b5495d0eae6d7d0eed4c33fafbfa117c58a-3024x1964.jpg',
    otherProjects: [
      {
        title: 'Joy Anonymous',
        directors: ['Sam Mulvey'],
        brand: 'Brooklyn Pilsner',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/39307a58130a77d181ee0f7a126b45175917e9f7.mp4',
        url: '/projects/joy-anonymous',
      },
      {
        title: 'UFC Return To London (Ft Kojey Radical)',
        directors: ['Sam Mulvey'],
        brand: 'UFC',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/e723f5af4ae111bb4df2ed754b9a55d8d9758c30.mp4',
        url: '/projects/ufc-return-to-london-ft-kojey-radical',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/2ce9b1590cd9447c1534b469b7b80749f38bae06-4855x2731.webp',
        alt: 'Idris Elba x King Charles 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/a5b88f592e141bac64840843b4f0db7dbed41569-4855x2731.webp',
        alt: 'Idris Elba x King Charles 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/b3eb1d8b7c95cc789a614940458c55849b79bff5-4855x2731.webp',
        alt: 'Idris Elba x King Charles 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/2aeb499a36bd54bdc94ee1f9da963bcea6cd1258-4855x2731.webp',
        alt: 'Idris Elba x King Charles 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/21bd882ccf173faef218da89cf3e0db9399a5a02-4855x2731.webp',
        alt: 'Idris Elba x King Charles 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/bcb92fef149ab08bc9fe764640a80621cd8dc3e2-4855x2731.webp',
        alt: 'Idris Elba x King Charles 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/e981d81acfd2f9be4060a0d1dcf281e4b9bfd69a-4855x2731.webp',
        alt: 'Idris Elba x King Charles 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/27812b83cc10c826a388fff1d51b37e95e79f432-4855x2731.webp',
        alt: 'Idris Elba x King Charles 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/8f557cfdbfd90269c5539668c64cfdda3508e665-4864x2736.webp',
        alt: 'Idris Elba x King Charles 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/9dbe367d0b24b3c87b427dea83ae9e894989f893-4855x2731.webp',
        alt: 'Idris Elba x King Charles 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/dde5541e827f2dabe05073990efb2f533abf3e1e-5120x2880.webp',
        alt: 'Idris Elba x King Charles 11',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/c5dc3c2b52473a3351f1f3722e8d8d07d2f734b3-4855x2731.webp',
        alt: 'Idris Elba x King Charles 12',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/09f33fc273365cff6c2c64971d04a432163f4bf9-4855x2731.webp',
        alt: 'Idris Elba x King Charles 13',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/50772df585e4772c096cc24d3343d16a5717bc71-4855x2731.webp',
        alt: 'Idris Elba x King Charles 14',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/2215d4a6ec5cea36a1a335075a97afdaa32fa7cc-4855x2731.webp',
        alt: 'Idris Elba x King Charles 15',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/60b5c9901eaa6a498c6e9a86c6f0d32a6bde8ef7-4855x2731.webp',
        alt: 'Idris Elba x King Charles 16',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/e72df12e237a803036f7a216f3798027ff2e868d-4855x2731.webp',
        alt: 'Idris Elba x King Charles 17',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/402731c1fee0c0915512de0fb714ddb97102e7ce-5120x2880.webp',
        alt: 'Idris Elba x King Charles 18',
      },
    ],
  },
  {
    name: 'BURBERRY x Sorbet Magazine • This Red Rock',
    slug: 'burberry-sorbet-magazine-this-red-rock',
    isInHomePage: false,
    description:
      'Burberry and Sorbet Magazine collide in a crimson, cinematic short that layers sculptural styling with atmospheric landscape frames.',
    bgColor: '#477AA1',
    director: 'Mohamad Abdouni',
    vimeoUrl:
      'https://player.vimeo.com/video/1144229044?h=10c18eed0f&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/85ed3235c309f88da1306adeddd751ff18e97611.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/f86b5d94fe9adba777fe4a4f484417dd36279095-2651x1517.jpg',
    otherProjects: [
      {
        title: 'Gucci | Marie Claire',
        directors: ['Mohamad Abdouni'],
        url: '/projects/gucci-marie-claire',
        brand: 'Gucci/Marie Claire',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/3d80959f29a369a32503313968e9af53f14f6bae.webm',
      },
      {
        title: 'Trance - A Road Trip With Burberry',
        directors: ['Mohamad Abdouni'],
        brand: 'Burberry',
        url: '/projects/trance-a-road-trip-with-burberry',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/d4a3e53ff00dc9154d5709d1689039fbcd6dd6d3.webm',
      },
      {
        title: 'La Magicienne Film V.1 | Bridal Couture Collection',
        directors: ['Mohamad Abdouni'],
        brand: 'HASSIDRISS',
        url: '/projects/la-magicienne-film-v1-bridal-couture-collection',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/79397636e29b834e4fb57ecf3ed8ffd779738314.webm',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/f5ec4eb0424b3d8f8efa16c2e7fc052cfec10c72-4859x2733.webp',
        alt: 'Burberry Sorbet 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/df823a72807fb86e188ced22ae9572c5f406fabd-5120x2880.webp',
        alt: 'Burberry Sorbet 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/763d9b8295748036e638db5341e19c9c846671c1-4859x2733.webp',
        alt: 'Burberry Sorbet 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/212a443cee891b15578ffcf04c3caf75dda397ab-5120x2880.webp',
        alt: 'Burberry Sorbet 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/8a215988f4edc59e6a983d1c30d1f36f2fcb8384-4859x2733.webp',
        alt: 'Burberry Sorbet 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/dbe433f985a403b0a65e0b614309907be6efd402-4859x2733.webp',
        alt: 'Burberry Sorbet 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/d5d6e794c42265296d8a098d056f36b150d2e8e4-5120x2880.webp',
        alt: 'Burberry Sorbet 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/3788f27f95ea9b3447ba40e9ebf97fa619963e0c-5120x2880.webp',
        alt: 'Burberry Sorbet 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/7bf107ee229fc537e5c91aa9ac8b458e43699cbf-5120x2880.webp',
        alt: 'Burberry Sorbet 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/b1eb45cebfa6130e512e068b397abd64581c42ac-5120x2880.webp',
        alt: 'Burberry Sorbet 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/4e589189b63be5821b3a85d2c80df63f5fa8828b-5120x2880.webp',
        alt: 'Burberry Sorbet 11',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/0717306f6b9402a649889b333f6decc055928c20-5120x2880.webp',
        alt: 'Burberry Sorbet 12',
      },
    ],
  },
  {
    name: '"La Magicienne" Film V.1 | Bridal Couture Collection',
    slug: 'la-magicienne-film-v1-bridal-couture-collection',
    isInHomePage: false,
    description:
      "This is La Magicienne, the ethereal short film introducing the designer's very first bridal collection. The collection itself is a stunning homage to the cinematic genius of George Méliès, capturing the surreal wonder and early magic of film. Here, silk and lace become illusions, weaving a dreamlike narrative where the bride is both the star and the sorceress of her own world. It is a breathtaking fusion of fashion and fantasy, where every gown possesses the enchanting power of a vanished era.",
    bgColor: '#477AA1',
    director: 'Mohamad Abdouni',
    vimeoUrl:
      'https://player.vimeo.com/video/1142355792?h=dc4b970af2&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/79397636e29b834e4fb57ecf3ed8ffd779738314.webm',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/4a6208aa627527b1cc6bc14d81ca9be0d8aaab51-2515x1704.jpg',
    otherProjects: [
      {
        title: 'Gucci | Marie Claire',
        directors: ['Mohamad Abdouni'],
        brand: 'Gucci/Marie Claire',
        url: '/projects/gucci-marie-claire',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/3d80959f29a369a32503313968e9af53f14f6bae.webm',
      },
      {
        title: 'Trance - A Road Trip With Burberry',
        directors: ['Mohamad Abdouni'],
        brand: 'Burberry',
        url: '/projects/trance-a-road-trip-with-burberry',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/d4a3e53ff00dc9154d5709d1689039fbcd6dd6d3.webm',
      },
      {
        title: 'Burberry x Sorbet Magazine • This Red Rock',
        directors: ['Mohamad Abdouni'],
        brand: 'Burberry / Sorbet Magazine',
        url: '/projects/burberry-sorbet-magazine-this-red-rock',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/85ed3235c309f88da1306adeddd751ff18e97611.mp4',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/46001ef67b909b7cbee9d07b1c3989f75bba9543-4550x2559.webp',
        alt: 'La magicienne 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/ad9cf69b4f657c106e3e81e728461e7333979f8e-5120x2880.webp',
        alt: 'La magicienne 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/af535403e00c8fb572c580ea071bcb39b47e809d-5120x2880.webp',
        alt: 'La magicienne 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/51df6bb16590d1fb53b418aa20b14063d10a2936-5120x2880.webp',
        alt: 'La magicienne 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/fbed512d6f64cedd15f508b273f182bb8c6bfe2f-5120x2880.webp',
        alt: 'La magicienne 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/148620ef7cb95e6924221de1df35354a34bdad9d-5120x2880.webp',
        alt: 'La magicienne 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/c3a16c68d7e16edfe7544b07a2df92762df9a070-5120x2880.webp',
        alt: 'La magicienne 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/69fe5ca035d11f8ed0f733ceac724c66d3103279-5120x2880.webp',
        alt: 'La magicienne 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/a73c99612059a671b392ba5fcf8c76d836398117-5120x2880.webp',
        alt: 'La magicienne 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/1c6f24f1f9e9998782997da8ef8e3689b357c94c-5120x2880.webp',
        alt: 'La magicienne 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/196135233066d19e0e238d5b76b74e978902f2fd-5120x2880.webp',
        alt: 'La magicienne 11',
      },
    ],
  },
  {
    name: 'Gucci | Marie Claire',
    slug: 'gucci-marie-claire',
    isInHomePage: false,
    description:
      "Gucci's cinematic statement, revealing the fragile façade of wealth and dynasty. A formidable matriarch attempts to stage a perfect display of her family’s power during a lavish, meticulously controlled birthday dinner. Beneath the impeccable surface of luxury, however, family tensions and a desperate need for control threaten to fracture the meticulously crafted evening. What begins as a celebration quickly unravels into an unnerving spiral of dysfunction, ultimately exposing the chaos concealed beneath every veneer of perfection.",
    bgColor: '#477AA1',
    director: 'Mohamad Abdouni',
    vimeoUrl:
      'https://player.vimeo.com/video/1142353634?h=7833d4515d&amp;title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/3d80959f29a369a32503313968e9af53f14f6bae.webm',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/aefe4cdb8816b2c5d82eec75cca90045b581c4a6-3011x1602.jpg',
    otherProjects: [
      {
        title: 'Trance - A Road Trip With Burberry',
        directors: ['Mohamad Abdouni'],
        brand: 'Burberry',
        url: '/projects/trance-a-road-trip-with-burberry',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/d4a3e53ff00dc9154d5709d1689039fbcd6dd6d3.webm',
      },
      {
        title: 'La Magicienne Film V.1 | Bridal Couture Collection',
        directors: ['Mohamad Abdouni'],
        brand: 'HASSIDRISS',
        url: '/projects/la-magicienne-film-v1-bridal-couture-collection',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/79397636e29b834e4fb57ecf3ed8ffd779738314.webm',
      },
      {
        title: 'Burberry x Sorbet Magazine • This Red Rock',
        directors: ['Mohamad Abdouni'],
        brand: 'Burberry /Sorbet Magazine',
        url: '/projects/burberry-sorbet-magazine-this-red-rock',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/85ed3235c309f88da1306adeddd751ff18e97611.mp4',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/b4cbab8cbb260340e63b5a3bcbe264660bca4dcd-4864x2736.webp',
        alt: 'Gucci Marie Claire 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/a07957b98d83c4379d88c8bbb88cbf3b498aba0b-4864x2736.webp',
        alt: 'Gucci Marie Claire 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/5aab54a11d13059ea49a14731e98055b17623332-4864x2736.webp',
        alt: 'Gucci Marie Claire 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/24120814dd1824330ff6537c723aad101e4dd26b-4864x2736.webp',
        alt: 'Gucci Marie Claire 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/60acab8b2141bc20dc0059384d020426d77c87bc-4864x2736.webp',
        alt: 'Gucci Marie Claire 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/c6df325fe22baa19d1b8a80b8d767a13cada6553-4864x2736.webp',
        alt: 'Gucci Marie Claire 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/02eded75b9ac4446b3eaecc55915ebaf3ee06ab0-4864x2736.webp',
        alt: 'Gucci Marie Claire 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/f753366e18e474f12c9bd4ffd029d43f3d18fb23-4864x2736.webp',
        alt: 'Gucci Marie Claire 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/8f557cfdbfd90269c5539668c64cfdda3508e665-4864x2736.webp',
        alt: 'Gucci Marie Claire 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/cad1265c3d8ca0c9916c1b0e467e796d774a039c-4864x2736.webp',
        alt: 'Gucci Marie Claire 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/35e00fe814a3645f76973c546d2659ad544ac4fc-4864x2736.webp',
        alt: 'Gucci Marie Claire 11',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/71e74ce5f5cbaae2a7f6f35c1f6f68549faee04b-4864x2736.webp',
        alt: 'Gucci Marie Claire 12',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/09de5d93e3cc7c81bc087f9c907ec4aed762edb3-4864x2736.webp',
        alt: 'Gucci Marie Claire 13',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/575b4d164ad6afed0b2811f0d5405467fe2f6c6b-4864x2736.webp',
        alt: 'Gucci Marie Claire 14',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/ab04ec279493174c9bd3c7125af1a38a96e62728-4864x2736.webp',
        alt: 'Gucci Marie Claire 15',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/66a195ef916c0497d9012bbbf51bde1a478bd67e-4864x2736.webp',
        alt: 'Gucci Marie Claire 16',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/c7fe262119d9656c4c6555509c9a7e618af666dd-4864x2736.webp',
        alt: 'Gucci Marie Claire 17',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/442271401dcaa4082a1581a464b4aeb8fa07a6dc-4864x2736.webp',
        alt: 'Gucci Marie Claire 18',
      },
    ],
  },
  {
    name: 'TRANCE - A Road Trip With Burberry',
    slug: 'trance-a-road-trip-with-burberry',
    isInHomePage: false,
    description:
      'Student and model Tilila Meryem, emerging creative Daddyaaz, influencer Leena Alghouti, and model Ali Latif embark on a trippy journey at dawn, but as the day rolls on, tensions start to arise as they collectively start seeing familiar yet uncanny landscapes…',
    bgColor: '#477AA1',
    director: 'Mohamad Abdouni',
    vimeoUrl:
      'https://player.vimeo.com/video/1142357356?h=7b779aa10b&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/d4a3e53ff00dc9154d5709d1689039fbcd6dd6d3.webm',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/3605de91704fd23b91cd90352db077bd8aa27d75-3024x1693.jpg',
    otherProjects: [
      {
        title: 'Gucci | Marie Claire',
        directors: ['Mohamad Abdouni'],
        brand: 'Gucci/Marie Claire',
        url: '/projects/gucci-marie-claire',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/3d80959f29a369a32503313968e9af53f14f6bae.webm',
      },
      {
        title: 'La Magicienne Film V.1 | Bridal Couture Collection',
        directors: ['Mohamad Abdouni'],
        brand: 'HASSIDRISS',
        url: '/projects/la-magicienne-film-v1-bridal-couture-collection',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/79397636e29b834e4fb57ecf3ed8ffd779738314.webm',
      },
      {
        title: 'Burberry x Sorbet Magazine • This Red Rock',
        directors: ['Mohamad Abdouni'],
        brand: 'Burberry / Sorbet Magazine',
        url: '/projects/burberry-sorbet-magazine-this-red-rock',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/85ed3235c309f88da1306adeddd751ff18e97611.mp4',
      },
    ],
  },
  {
    name: 'Dreams of blue lagoon',
    slug: 'dreams-of-blue-lagoon',
    isInHomePage: false,
    description:
      'In a hidden lagoon deep in the South Sinai desert, a small Bedouin community has built a world of wind, water, and wonder. Surrounded by simple huts and endless blue, young Bedouins who treat the sea as their fifth limb show what it means to live in rhythm with the elements. We spent time with them–listening, filming, and learning–capturing a slice of paradise and the stories of people whose freedom and grace remain one of Sinai’s best-kept secrets.',
    bgColor: '#477AA1',
    director: 'Chris Kousouros',
    vimeoUrl:
      'https://player.vimeo.com/video/1129975862?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/fd636fb8e66e21e8fb59f765617ead285549708c.webm',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/9b1037e5dee41ab7919b274dd1d1e0bf8713a03f-3024x1687.jpg',
    otherProjects: [
      {
        title: 'Grandma Artsakh',
        directors: ['Chris Kousouros'],
        brand: 'Which Door original',
        url: '/projects/grandma-artsakh',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/732d0525dc8e2b41ddc9b72407136506ff5e692c.mp4',
      },
      {
        title: 'Leading the way',
        directors: ['Chris Kousouros'],
        brand: 'VOX Media',
        url: '/projects/leading-the-way',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/c7268f59042501a370ea496db9008bc6cbdc5a06.webm',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/2ad40b67b861354cbafe9fe252fd18408dcddad0-960x640.webp',
        alt: 'Dreams of blue lagoon 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/61c6d2ec483dc2b07c037ecb22f01cc227609596-1080x720.webp',
        alt: 'Dreams of blue lagoon 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/f0d748ea399a1b80599dc00b3e67c4eccbca722c-960x640.webp',
        alt: 'Dreams of blue lagoon 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/a869dd57a1ecbb9ae9b589cc4cd988822e5f11c5-1920x1079.webp',
        alt: 'Dreams of blue lagoon 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/5c61b916d83414538d8c0bc93699fdffcdcccf2f-1080x873.webp',
        alt: 'Dreams of blue lagoon 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/18349019b559cb276facfb7488247948127de1bf-1280x720.webp',
        alt: 'Dreams of blue lagoon 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/9f29d99ecf9600a778d5bf872f4f5a6f5ecf369e-960x960.webp',
        alt: 'Dreams of blue lagoon 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/72c097b4932499d78a2ed6cd0302e37ae250e400-641x640.webp',
        alt: 'Dreams of blue lagoon 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/f8de0d328ecf82cdcebb8bc679b9097f25e2ac17-960x960.webp',
        alt: 'Dreams of blue lagoon 9',
      },
    ],
  },
  {
    name: 'Island Island Island',
    slug: 'island-island-island',
    isInHomePage: true,
    description:
      'For the release of a new fashion line, we teamed up with npooSTUDIOS to create this short video. The theme was archipelago meets midsummer – soft light, open water, and that feeling of being completely free for a moment.',
    bgColor: '#477AA1',
    director: 'Johan Eriksson',
    vimeoUrl: 'https://player.vimeo.com/video/1129973979?h=e6cfedbeaa',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/4e3a2ab2513bcef4499141387fd2f3f59ccf4d00.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/b9c67d73293c6f6c67b74ed86a7d4738c77d1e64-3024x1579.jpg',
    otherProjects: [
      {
        title: 'Arrogance',
        directors: ['Johan Eriksson'],
        brand: 'Which Door + Terran Production',
        url: '/projects/arrogance',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/9b85daf7d3376be55af8608f287d59f1f8ac1837.mp4',
      },
      {
        title: 'Is the world getting better?',
        directors: ['Johan Eriksson'],
        url: '/projects/is-the-world-getting-better',
        brand: 'UNDP Sweden',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/7708e07c785880c13392463c35a517505dfc99e7.mp4',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/1e6fc22642e694aeb0bb60b210bb56296862aea2-4682x2634.webp',
        alt: 'Island Island Island 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/597350e2e3a5de5e67e6c5f438f9fd42084a27a2-4682x2634.webp',
        alt: 'Island Island Island 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/e1407f2345f9fbb470eef4bc564ed1869548921e-4682x2634.webp',
        alt: 'Island Island Island 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/ca5e891e8968bcc680a74f035043e28820dc07e7-4682x2634.webp',
        alt: 'Island Island Island 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/4a6de851df158cdf206dd2c078b80b3254bfeb04-4682x2634.webp',
        alt: 'Island Island Island 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/4a6de851df158cdf206dd2c078b80b3254bfeb04-4682x2634.webp',
        alt: 'Island Island Island 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/c21a491d0a4bc23b4bc14e5d048482e598b682b0-4682x2634.webp',
        alt: 'Island Island Island 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/29dfa5c5df5e1fb358d1ae8674fff6f486335ce0-4682x2634.webp',
        alt: 'Island Island Island 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/e214b0e7220d955cc10de2eda09435ea985ccbb4-4682x2634.webp',
        alt: 'Island Island Island 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/c2c57516ca462a2efe5e0908b18c1836cf4050e2-4682x2634.webp',
        alt: 'Island Island Island 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/0bf9060633bb54dd5934086824567b26eac7e8a9-4682x2634.webp',
        alt: 'Island Island Island 11',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/3d62f67e800ba8d1f8f55c6b3ee1f546cd901fb3-4682x2634.webp',
        alt: 'Island Island Island 12',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/e385aed2450144860b356cbd16a6e87429c14070-4682x2634.webp',
        alt: 'Island Island Island 13',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/7be5a6bf3ad37096c7e583faf702215165bd7a81-4682x2634.webp',
        alt: 'Island Island Island 14',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/bba611bd3cf4fa27210b2710b20c9f63ccab691d-4682x2634.webp',
        alt: 'Island Island Island 15',
      },
    ],
  },
  {
    name: 'Arrogance',
    slug: 'arrogance',
    isInHomePage: false,
    description:
      'Earth is dead—silent, bare, abandoned. Ayla, a scientist and one of the last believers, remains to revive what little life might still return. When Misha arrives, her purpose begins to shift, and the line between hope and surrender blurs. Arrogance unites director NAVARAK, artist Malin Bobeck Tadaa, dancers Tarika Wahlberg and Emelie Enlund, and musician Nikki Pryke to explore humanity’s fatal separation from nature.',
    bgColor: '#477AA1',
    director: 'Johan Eriksson',
    vimeoUrl:
      'https://player.vimeo.com/video/1131302044?h=5cf217a4d2&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/9b85daf7d3376be55af8608f287d59f1f8ac1837.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/3b0a7d1eb48c824533ba66323dfc712a4a005be6-3012x1692.jpg',
    otherProjects: [
      {
        title: 'Island Island Island',
        brand: 'Which Door + Terran Production',
        directors: ['Johan Eriksson'],
        url: '/projects/island-island-island',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/4e3a2ab2513bcef4499141387fd2f3f59ccf4d00.mp4',
      },
      {
        title: 'Is the world getting better?',
        directors: ['Johan Eriksson'],
        brand: 'UNDP Sweden',
        url: '/projects/is-the-world-getting-better',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/7708e07c785880c13392463c35a517505dfc99e7.mp4',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/4355fcd0ecad55199940b43a11b48fd9a0dbec04-4865x2737.webp',
        alt: 'Arrogance 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/42116f1ef26f863e28ce6ec8547af6014430869b-4865x2737.webp',
        alt: 'Arrogance 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/87011cdc106ffcb926b28768c12cc60f7e0e43c1-4865x2737.webp',
        alt: 'Arrogance 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/24e2cfd8747e2a15527ed44f446e79c0d5febbf5-4865x2737.webp',
        alt: 'Arrogance 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/0af6f2edb3ce05bec985aeaaa78bc9b8b666a9dd-4865x2737.webp',
        alt: 'Arrogance 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/fa6115bc0dce5d15f25e9ecde68b27afde6aaa56-4865x2737.webp',
        alt: 'Arrogance 8',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/95c73464abf3556f7b17d4efbafaf349e2df3003-4865x2737.webp',
        alt: 'Arrogance 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/842a511525aeb55cd0a6f89de13f73088c0f926c-4865x2737.webp',
        alt: 'Arrogance 12',
      },
    ],
  },
  {
    name: 'Is the world getting better?',
    slug: 'is-the-world-getting-better',
    isInHomePage: false,
    description:
      'We made this film for a UNDP Sweden campaign asking a simple question: Is the world getting better? Its aim is to show young people that behind the bad headlines, real progress exists. We took it further, focusing on the feeling of being fed up when older generations won’t listen but still expect you to fix everything. At the same time, we wanted to show the power that comes from speaking up and standing firm in what you believe.',
    bgColor: '#477AA1',
    director: 'Johan Eriksson',
    vimeoUrl:
      'https://player.vimeo.com/video/1135745104?h=7b19ad56d5&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/7708e07c785880c13392463c35a517505dfc99e7.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/a89f0a645e7b153ce7a1c226367794017072f298-5120x2880.webp',
    otherProjects: [
      {
        title: 'Island Island Island',
        directors: ['Johan Eriksson'],
        brand: 'Which Door + Terran Production',
        url: '/projects/island-island-island',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/4e3a2ab2513bcef4499141387fd2f3f59ccf4d00.mp4',
      },
      {
        title: 'Arrogance',
        directors: ['Johan Eriksson'],
        brand: 'Which Door + Terran Production',
        url: '/projects/arrogance',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/9b85daf7d3376be55af8608f287d59f1f8ac1837.mp4',
      },
    ],
    galleryImages: [
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/6c4d9bca6699858d7313c2897e42060e6537d2a0-4400x2475.webp',
        alt: 'Is the world getting better? 1',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/0547c7c756ac1067611dbef6a6486c333be90cba-4400x2475.webp',
        alt: 'Is the world getting better? 2',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/32ab98063051818db64e47b83706b6978893cb99-4400x2475.webp',
        alt: 'Is the world getting better? 3',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/f1eda11c6ff5305ba940504b2ca2de5aaca4f16b-4400x2475.webp',
        alt: 'Is the world getting better? 4',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/a4fcacb978bb405f68fd28dd74b1fb8b0107dfd2-5120x2880.webp',
        alt: 'Is the world getting better? 5',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/4f2b7894228f2d2e220d790265e85846b8244f18-5120x2880.webp',
        alt: 'Is the world getting better? 6',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/305fd0526dd015ea30a2225ca8148c3c5fd97db9-5120x2880.webp',
        alt: 'Is the world getting better? 7',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/ad676dacd7cf96c314596de29346130b8cb8a928-5120x2880.webp',
        alt: 'Is the world getting better? 8',
      },
         {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/6fd81b4024cfe68153b6bf53bf95496c2da415b2-5120x2880.webp',
        alt: 'Is the world getting better? 9',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/88056dc36b42434615f6e96f59a8a883fe48c12f-5120x2880.webp',
        alt: 'Is the world getting better? 10',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/e63f37a788108aa3370da053ba2338c44c6b4980-5120x2880.webp',
        alt: 'Is the world getting better? 11',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/5ae4721e739dcaa105631a9314e9f51fa1ef4d21-5120x2880.webp',
        alt: 'Is the world getting better? 12',
      },
           {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/24d707551fc69791bbc3b3431aeadf53a7151ec2-5120x2880.webp',
        alt: 'Is the world getting better? 13',
      },
      {
        url: 'https://cdn.sanity.io/images/xerhtqd5/production/a89f0a645e7b153ce7a1c226367794017072f298-5120x2880.webp',
        alt: 'Is the world getting better? 14',
      },
    ],
  },
]

const directorsData = [
  {
    name: 'Sam Mulvey',
    slug: 'sam-mulvey',
    bgImage: '/images/directors/chris.jpg',
    vimeoUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/c74d289e1c9327576dd6e710730550ee045221c4.webm',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/c74d289e1c9327576dd6e710730550ee045221c4.webm',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/388b3b5495d0eae6d7d0eed4c33fafbfa117c58a-3024x1964.jpg',
    specialization: 'Director | DOP',
    description:
      'Sam Mulvey is an award-winning filmmaker with over a decade of experience working across documentary, commercial, and music video projects. His films try to push visual language to its limits - transforming raw human stories into imaginative and emotionally resonant visual expressions. A graduate of Bristol film school, where he focused on documentary filmmaking, Sam has since broadened his horizons to encompass a wide range of cinematic forms. His recent nomination at the Berlin Commercial Film Awards and multiple features on the world-renowned platform Lens Addiction highlight his commitment to bold storytelling and visual innovation.',
    otherProjects: [
      {
        title: 'Joy Anonymous',
        directors: ['Sam Mulvey'],
        brand: 'Brooklyn Pilsner',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/39307a58130a77d181ee0f7a126b45175917e9f7.mp4',
        url: '/projects/joy-anonymous',
      },
      {
        title: 'Idris Elba x King Charles | Creative Futures',
        directors: ['Sam Mulvey'],
        brand: 'Creative Futures',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/c74d289e1c9327576dd6e710730550ee045221c4.webm',
      },
      {
        title: 'UFC Return To London (Ft Kojey Radical)',
        directors: ['Sam Mulvey'],
        brand: 'UFC',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/b49bd1325f9de47f66f65fe691b257bbdd209de4.mp4',
        url: '/projects/ufc-return-to-london-ft-kojey-radical',
      },
    ],
  },
  {
    name: 'Mohamad Abdouni',
    slug: 'mohamad-abdouni',
    bgImage: '/images/directors/riham.jpg',
    vimeoUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/3d80959f29a369a32503313968e9af53f14f6bae.webm',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/3d80959f29a369a32503313968e9af53f14f6bae.webm',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/aefe4cdb8816b2c5d82eec75cca90045b581c4a6-3011x1602.jpg',
    specialization: 'Director | Visual Artist',
    description:
      'Mohamad Abdouni is an artist, filmmaker, photographer, and the Editor-in-Chief of COLD CUTS, the photo journal exploring queer cultures in the SWANA region. His work has been shown at the Brooklyn Museum, FOAM Amsterdam, Institut du Monde Arabe, Art Basel (Paris+), and the Lyon Biennale, and he received the 2023 Lafayette Anticipations Prize. Mohamad directs narrative fashion films and music videos for clients such as Gucci, Vogue US & Italia, Burberry, Puma, The New York Times, Fendi, Farfetch, GQ, Dazed, Another, Nowness, and L’Officiel. His personal work centers on queer histories in the Arab region, including the long-term archival project Treat Me Like Your Mother, now housed at the Arab Image Foundation. He is currently exploring themes of masculinity, family, and inherited identities.',
    otherProjects: [
      {
        title: "'La Magicienne' Film V.1 | Bridal Couture Collection",
        directors: ['Mohamad Abdouni'],
        brand: 'HASSIDRISS',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/79397636e29b834e4fb57ecf3ed8ffd779738314.webm',
        url: '/projects/la-magicienne-film-v1-bridal-couture-collection',
      },
      {
        title: 'Gucci | Marie Claire',
        directors: ['Mohamad Abdouni'],
        brand: 'Gucci/Marie Claire',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/3d80959f29a369a32503313968e9af53f14f6bae.webm',
        url: '/projects/gucci-marie-claire',
      },
      {
        title: 'TRANCE - A Road Trip With Burberry',
        directors: ['Mohamad Abdouni'],
        brand: 'BURBERRY',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/d4a3e53ff00dc9154d5709d1689039fbcd6dd6d3.webm',
        url: '/projects/trance-a-road-trip-with-burberry',
      },
      {
        title: 'BURBERRY x Sorbet Magazine • This Red Rock',
        directors: ['Mohamad Abdouni'],
        brand: 'Burberry / Sorbet Magazine',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/85ed3235c309f88da1306adeddd751ff18e97611.mp4',
        url: '/projects/burberry-sorbet-magazine-this-red-rock',
      },
    ],
  },
  {
    name: 'Alicia Sully',
    slug: 'alicia-sully',
    bgImage: '/images/directors/alicia.jpg',
    vimeoUrl:
      'https://player.vimeo.com/video/1129967137?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/4d3df752ed60996dbcb945a2b5f14d26198f1a73.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/e44aaf0bd3677dcf945f8d9ca083990bdff9ccd8-3016x1689.jpg',
    specialization: 'Director | Cinematographer',
    description:
      'Alicia is an Emmy-nominated cinematographer who has 17 years of experience working in remote areas, conflict and disaster zones. Alicia studied at SUNY Purchase Film Conservatory in New York and cinematography at FAMU in the Czech Republic. She co-founded What Took You So Long after spending several formative years in Northern Ghana which resulted in a lifelong passion for participatory filmmaking. She has worked in more than 80 countries as Director of Photography, Producer, and Editor on hundreds of projects for a variety of clients and collaborators. She lead our team to several projects in Somalia including the production of a local TV series in collaboration with Hargeisa based Bulsho TV. She is born and raised in the US - her mother tongue is English. ',
    otherProjects: [
      {
        title: 'Dreams of Blue Lagoon',
        directors: ['Chris Kousouros'],
        brand:"Which Door original",
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/fd636fb8e66e21e8fb59f765617ead285549708c.webm',
        url: '/projects/dreams-of-blue-lagoon',
      },
      {
        title: 'TRANCE - A Road Trip With Burberry',
        directors: ['Mohamad Abdouni'],
        brand: 'BURBERRY',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/d4a3e53ff00dc9154d5709d1689039fbcd6dd6d3.webm',
        url: '/projects/trance-a-road-trip-with-burberry',
      },
      {
        title: "'La Magicienne' Film V.1 | Bridal Couture Collection",
        directors: ['Mohamad Abdouni'],
        brand: 'HASSIDRISS',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/530325e24bae5b2ebc9b5008751797b24e7c6352.mp4',
        url: '/projects/la-magicienne-film-v1-bridal-couture-collection',
      },
    ],
  },
  {
    name: 'Johan Eriksson',
    slug: 'johan-eriksson',
    bgImage: '/images/directors/johan.jpg',
    vimeoUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/7708e07c785880c13392463c35a517505dfc99e7.mp4',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/7708e07c785880c13392463c35a517505dfc99e7.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/a89f0a645e7b153ce7a1c226367794017072f298-5120x2880.webp',
    specialization: 'Director | Editor',
    description:
      'Johan is an experienced award winning producer and filmmaker with a background in Development Studies from Uppsala University. He’s currently running the Swedish department of the international production house What Took You So Long?. His experience ranges from directing, project lead, director of photography to editing. He has worked in over 20 countries, many of which are complex low resource environments, which has moulded him into the agile and creative filmmaker he is today. Johan is passionate about telling stories mainstream media neglects and present a more nuanced picture of the world. Johan has led large projects with global UN entities and the H&M Group to small scale farmers in sub Saharan Africa.',
    otherProjects: [
      {
        title: 'Island Island Island',
        directors: ['Johan Eriksson'],
        brand: 'Which Door + Terran Production',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/4e3a2ab2513bcef4499141387fd2f3f59ccf4d00.mp4',
        url: '/projects/island-island-island',
      },
      {
        title: 'Arrogance',
        directors: ['Johan Eriksson'],
        brand: 'Which Door + Terran Production',
        url: '/projects/arrogance',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/9b85daf7d3376be55af8608f287d59f1f8ac1837.mp4',
      },
      {
        title: 'Is the world getting better?',
        directors: ['Johan Eriksson'],
        url: '/projects/is-the-world-getting-better',
        brand: 'UNDP Sweden',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/7708e07c785880c13392463c35a517505dfc99e7.mp4',
      },
    ],
  },
  {
    name: 'Chris Kousouros',
    slug: 'chris-kousouros',
    bgImage: '/images/directors/chris.jpg',
    vimeoUrl: 'https://player.vimeo.com/video/1129969216?h=69f4878882',
    previewUrl:
      'https://cdn.sanity.io/files/xerhtqd5/production/b77f6282b701f9170c4e312b4c2e0c6091f3592d.mp4',
    previewPoster:
      'https://cdn.sanity.io/images/xerhtqd5/production/9b1037e5dee41ab7919b274dd1d1e0bf8713a03f-3024x1687.jpg',
    specialization: 'Director | DOP',
    description:
      'Chris Kousouros made his transition to filmmaking from genocide prevention with the hopes of addressing global issues with visual products instead of cabinet meetings. He joined documentary production company What Took You So long in December 2014, and has since worked on films in over 50 countries. Chris Co-founded Which Door to bring the incredible stories he found across the world to a commercial audience. Chris speaks English, Spanish, and Levantine Arabic.',
    otherProjects: [
      {
        title: 'Dreams of Blue Lagoon',
        directors: ['Chris Kousouros'],
        brand:"Which Door original",
        url: '/projects/dreams-of-blue-lagoon',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/fd636fb8e66e21e8fb59f765617ead285549708c.webm',
      },
      {
        title: 'Grandma Artsakh',
        directors: ['Chris Kousouros'],
        brand: 'Which Door original',
        url: '/projects/grandma-artsakh',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/732d0525dc8e2b41ddc9b72407136506ff5e692c.mp4',
      },
      {
        title: 'Leading the way',
        directors: ['Chris Kousouros'],
        brand: 'VOX Media',
        url: '/projects/leading-the-way',
        previewUrl:
          'https://cdn.sanity.io/files/xerhtqd5/production/c7268f59042501a370ea496db9008bc6cbdc5a06.webm',
      },
    ],
  },
]

export const galleryImages = [
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/4799d8c9aefa24996bcec03f65a399265fb43f8f-4159x2339.webp',
    alt: 'VOX IMAGE 1',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/2542e8662f3f866867ed37c0bbb79fbb411dec09-4159x2339.webp',
    alt: 'VOX IMAGE 2',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/1bcf288c8b2538cafd9f8355e443a7228e09a25e-4159x2339.webp',
    alt: 'VOX IMAGE 3',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/c8ad31eeaaa162fc7bcbeaf1de57a4b7ee472f9e-4159x2339.webp',
    alt: 'VOX IMAGE 4',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/6ad357fa6dd135438f56486b253e20013b77f60f-4159x2339.webp',
    alt: 'VOX IMAGE 5',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/e9ca16517778412339e99440a6cc2459a08ad2fd-4159x2339.webp',
    alt: 'VOX IMAGE 6',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/6a184fbf90b4cf45d596c77d1a373952b8879a22-4159x2339.webp',
    alt: 'VOX IMAGE 7',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/0d58fc4de806fe97dc9fa106efaae4e44a22ae37-4159x2339.webp',
    alt: 'VOX IMAGE 8',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/29bde10687c5a3d4cd8831878aa598d939d2e8c7-4159x2339.webp',
    alt: 'VOX IMAGE 9',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/59fc67249f24d9032882daa6ccbfb65f8b64bfcd-3852x2167.webp',
    alt: 'VOX IMAGE 10',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/74d5000a82bc1c485337be47536d759d6c7fce9b-4159x2339.webp',
    alt: 'VOX IMAGE 11',
  },
  {
    url: 'https://cdn.sanity.io/images/xerhtqd5/production/8eb93eb97c779bb49787626e0d775ded8f84c692-4159x2339.webp',
    alt: 'VOX IMAGE 12',
  },
]

// Export projects with auto-generated LQIP URLs
export const projects = projectsData.map(project => ({
  ...project,
  previewPosterLQIP: project.previewPoster ? getLQIP(project.previewPoster) : undefined,
}))

// Export directors with auto-generated LQIP URLs
export const directors = directorsData.map(director => ({
  ...director,
  previewPosterLQIP: director.previewPoster ? getLQIP(director.previewPoster) : undefined,
}))
