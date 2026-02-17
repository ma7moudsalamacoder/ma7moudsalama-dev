export type ContactDetails = {
  email: string
  emailUrl: string
  linkedin: string
  linkedinUrl: string
  github: string
  githubUrl: string
  twitter: string
  twitterUrl: string
}

export type MediaVideo = {
  id?: string
  platform: string
  title: string
  embedUrl: string
  videoUrl: string
  thumbnailUrl: string
}

export type SkillGroup = {
  id?: string
  title: string
  icon: string
  items: string[]
}

export type ProjectItem = {
  id?: string
  title: string
  description: string
  tags: string[]
  link: string
}
