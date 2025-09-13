export type RelatedProject = {
  title: string
  directors: string[]
  brand: string
}

export type Director = {
  name: string
  slug: string
  bgImage: string
  bgVideo?: string
  specialization: string
  bio: string
  relatedProjects: RelatedProject[]
}
