import { onValue, ref as dbRef } from 'firebase/database'
import { ref } from 'vue'

import { database } from '@/lib/firebase'
import type { ContactDetails, MediaVideo, ProjectItem, SkillGroup } from '@/types/portfolio'

const defaultContactDetails: ContactDetails = {
  email: 'ma7moudsalamacoder@gmail.com',
  emailUrl: 'mailto:ma7moudsalamacoder@gmail.com',
  linkedin: '/in/mahmoudkm-coder',
  linkedinUrl: 'https://www.linkedin.com/in/mahmoudkm-coder',
  github: '@ma7moud-salama',
  githubUrl: 'https://github.com/ma7moud-salama',
  twitter: '@msalama_dev',
  twitterUrl: 'https://x.com/msalama_dev',
}

const defaultMediaVideos: MediaVideo[] = [
  {
    platform: 'YouTube',
    title: 'API Architecture Deep Dive',
    embedUrl: 'https://www.youtube.com/embed/ysz5S6PUM-U',
    videoUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    thumbnailUrl: 'https://img.youtube.com/vi/ysz5S6PUM-U/hqdefault.jpg',
  },
  {
    platform: 'YouTube',
    title: 'Modern Web Development Talk',
    embedUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
    videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg',
  },
  {
    platform: 'TikTok',
    title: 'Backend Engineering Tips',
    embedUrl: 'https://www.tiktok.com/embed/v2/7106818926616966446',
    videoUrl: 'https://www.tiktok.com/@scout2015/video/7106818926616966446',
    thumbnailUrl: 'https://placehold.co/1280x720/020617/00e1ff?text=TikTok+Video',
  },
  {
    platform: 'TikTok',
    title: 'Mobile App Development Snippet',
    embedUrl: 'https://www.tiktok.com/embed/v2/7218552891404862766',
    videoUrl: 'https://www.tiktok.com/@scout2015/video/7218552891404862766',
    thumbnailUrl: 'https://placehold.co/1280x720/020617/00e1ff?text=TikTok+Video',
  },
]

const defaultSkillGroups: SkillGroup[] = [
  {
    title: 'Backend',
    icon: 'terminal',
    items: ['Laravel / PHP', 'Drupal / PHP', 'Node.js / Express', 'Python / Django'],
  },
  {
    title: 'Frontend',
    icon: 'layers',
    items: ['Vue.js / Nuxt', 'Ant-Design', 'PrimeVue', 'Tailwind CSS'],
  },
  {
    title: 'DevOps',
    icon: 'cloud',
    items: ['Docker / Kubernetes', 'CI/CD Pipelines', 'AWS / DigitalOcean', 'Linux / Nginx'],
  },
  {
    title: 'Databases',
    icon: 'database',
    items: ['PostgreSQL / MySQL', 'Redis / Caching', 'MongoDB', 'SQLite'],
  },
  {
    title: 'Backend Services',
    icon: 'hub',
    items: ['Firebase', 'Supabase', 'Appwrite', 'REST APIs / GraphQL'],
  },
  {
    title: 'Testing & QA',
    icon: 'fact_check',
    items: ['Unit Testing', 'Integration Testing', 'API Testing (Postman)', 'Debugging & Performance'],
  },
  {
    title: 'Architecture',
    icon: 'account_tree',
    items: ['Clean Architecture', 'Microservices', 'Design Patterns', 'Scalable System Design'],
  },
  {
    title: 'Mobile Apps',
    icon: 'smartphone',
    items: ['iOS / Swift', 'Android / Kotlin', 'Flutter / Dart', 'React Native / Expo'],
  },
]

const defaultProjects: ProjectItem[] = [
  {
    title: 'Omni-Channel API Gateway',
    description:
      'A high-throughput API gateway for banking microservices with OAuth2 and rate limiting.',
    tags: ['Laravel', 'PostgreSQL'],
    link: '#',
  },
  {
    title: 'Real-time Analytics Engine',
    description:
      'Processes millions of websocket events per minute with low-latency storage and dynamic dashboards.',
    tags: ['Node.js', 'React'],
    link: '#',
  },
]

const contactDetails = ref<ContactDetails>(defaultContactDetails)
const mediaVideos = ref<MediaVideo[]>(defaultMediaVideos)
const skillGroups = ref<SkillGroup[]>(defaultSkillGroups)
const projects = ref<ProjectItem[]>(defaultProjects)
const dataReady = ref(false)

let initialized = false

function readList<T>(value: unknown, transform: (id: string, item: Record<string, unknown>) => T) {
  if (!value || typeof value !== 'object') return []

  return Object.entries(value as Record<string, unknown>)
    .map(([id, item]) => {
      if (!item || typeof item !== 'object') return null
      return transform(id, item as Record<string, unknown>)
    })
    .filter((item): item is T => item !== null)
}

function initPortfolioListeners() {
  if (initialized) return
  initialized = true

  onValue(dbRef(database, 'portfolio/contactDetails'), (snapshot) => {
    if (!snapshot.exists()) {
      contactDetails.value = { ...defaultContactDetails }
      return
    }

    contactDetails.value = {
      ...defaultContactDetails,
      ...(snapshot.val() as Partial<ContactDetails>),
    }
  })

  onValue(dbRef(database, 'portfolio/mediaVideos'), (snapshot) => {
    if (!snapshot.exists()) {
      mediaVideos.value = [...defaultMediaVideos]
      return
    }

    mediaVideos.value = readList(snapshot.val(), (id, item) => ({
      id,
      platform: String(item.platform ?? ''),
      title: String(item.title ?? ''),
      embedUrl: String(item.embedUrl ?? ''),
      videoUrl: String(item.videoUrl ?? ''),
      thumbnailUrl: String(item.thumbnailUrl ?? ''),
    }))
  })

  onValue(dbRef(database, 'portfolio/skillGroups'), (snapshot) => {
    if (!snapshot.exists()) {
      skillGroups.value = [...defaultSkillGroups]
      return
    }

    skillGroups.value = readList(snapshot.val(), (id, item) => ({
      id,
      title: String(item.title ?? ''),
      icon: String(item.icon ?? 'terminal'),
      items: Array.isArray(item.items)
        ? item.items.map((entry) => String(entry)).filter(Boolean)
        : [],
    }))
  })

  onValue(dbRef(database, 'portfolio/projects'), (snapshot) => {
    if (!snapshot.exists()) {
      projects.value = [...defaultProjects]
      dataReady.value = true
      return
    }

    projects.value = readList(snapshot.val(), (id, item) => ({
      id,
      title: String(item.title ?? ''),
      description: String(item.description ?? ''),
      tags: Array.isArray(item.tags) ? item.tags.map((entry) => String(entry)).filter(Boolean) : [],
      link: String(item.link ?? '#'),
    }))

    dataReady.value = true
  })
}

export function usePortfolioData() {
  initPortfolioListeners()

  return {
    contactDetails,
    mediaVideos,
    skillGroups,
    projects,
    dataReady,
  }
}
