export type RelatedProject = {
  title: string
  directors: string[]
  brand: string
}

export type Director = {
  name: string
  slug: string
  bgImage: string
  vimeoUrl?: string
  specialization: string
  bio: string
  relatedProjects: RelatedProject[]
}
