<script setup lang="ts">
import { signOut } from 'firebase/auth'
import { onValue, push, ref as dbRef, remove, set } from 'firebase/database'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import Textarea from 'primevue/textarea'

import { usePortfolioData } from '@/composables/usePortfolioData'
import { useTheme } from '@/composables/useTheme'
import { auth, database } from '@/lib/firebase'
import type { ContactDetails, MediaVideo, ProjectItem, SkillGroup } from '@/types/portfolio'

const router = useRouter()
const { contactDetails, mediaVideos, skillGroups, projects } = usePortfolioData()
const { isDark, toggleTheme } = useTheme()

const savingContact = ref(false)
const mediaSaving = ref(false)
const skillSaving = ref(false)
const projectSaving = ref(false)
const statusMessage = ref('')

const contactForm = reactive<ContactDetails>({ ...contactDetails.value })

watch(
  contactDetails,
  (value) => {
    Object.assign(contactForm, value)
  },
  { immediate: true },
)

type EditableMedia = {
  platform: string
  title: string
  embedUrl: string
  videoUrl: string
  thumbnailUrl: string
}

const mediaForm = reactive<EditableMedia>({
  platform: 'YouTube',
  title: '',
  embedUrl: '',
  videoUrl: '',
  thumbnailUrl: '',
})
const activeMediaId = ref<string | null>(null)

type EditableSkill = {
  title: string
  icon: string
  itemsText: string
}

const skillForm = reactive<EditableSkill>({
  title: '',
  icon: 'terminal',
  itemsText: '',
})
const activeSkillId = ref<string | null>(null)

type EditableProject = {
  title: string
  description: string
  tagsText: string
  link: string
}

const projectForm = reactive<EditableProject>({
  title: '',
  description: '',
  tagsText: '',
  link: '',
})
const activeProjectId = ref<string | null>(null)
const analyticsLoading = ref(true)
const analyticsError = ref('')
const totalPageViews = ref(0)
const uniqueVisitors = ref(0)
const lastVisitedPath = ref('/')
const lastVisitedAt = ref<number | null>(null)
const pathViews = ref<Record<string, number>>({})
const analyticsUnsubscribes: Array<() => void> = []
const activeDashboardTabIndex = ref(0)
const showContactModal = ref(false)
const showMediaModal = ref(false)
const showSkillModal = ref(false)
const showProjectModal = ref(false)

const trackedPageCount = computed(() => Object.keys(pathViews.value).length)
const formattedLastVisit = computed(() => {
  if (!lastVisitedAt.value) return 'No visits yet'
  return new Date(lastVisitedAt.value).toLocaleString()
})

const topPages = computed(() =>
  Object.entries(pathViews.value)
    .map(([encodedPath, value]) => ({
      path: (() => {
        try {
          return decodeURIComponent(encodedPath)
        } catch {
          return encodedPath
        }
      })(),
      views: Number(value) || 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5),
)

function parseItems(text: string) {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function setStatus(message: string) {
  statusMessage.value = message
  window.setTimeout(() => {
    if (statusMessage.value === message) {
      statusMessage.value = ''
    }
  }, 3000)
}

async function logout() {
  await signOut(auth)
  await router.push('/login')
}

async function viewSite() {
  await router.push('/')
}

async function saveContactDetails() {
  savingContact.value = true

  try {
    await set(dbRef(database, 'portfolio/contactDetails'), {
      email: contactForm.email.trim(),
      emailUrl: contactForm.emailUrl.trim(),
      linkedin: contactForm.linkedin.trim(),
      linkedinUrl: contactForm.linkedinUrl.trim(),
      github: contactForm.github.trim(),
      githubUrl: contactForm.githubUrl.trim(),
      twitter: contactForm.twitter.trim(),
      twitterUrl: contactForm.twitterUrl.trim(),
    })

    setStatus('Contact details saved.')
    showContactModal.value = false
  } finally {
    savingContact.value = false
  }
}

function openContactModal() {
  Object.assign(contactForm, contactDetails.value)
  showContactModal.value = true
}

function resetMediaForm() {
  activeMediaId.value = null
  mediaForm.platform = 'YouTube'
  mediaForm.title = ''
  mediaForm.embedUrl = ''
  mediaForm.videoUrl = ''
  mediaForm.thumbnailUrl = ''
}

function openAddMediaModal() {
  resetMediaForm()
  showMediaModal.value = true
}

function openEditMediaModal(video: MediaVideo) {
  editMedia(video)
  showMediaModal.value = true
}

function closeMediaModal() {
  showMediaModal.value = false
  resetMediaForm()
}

function editMedia(video: MediaVideo) {
  activeMediaId.value = video.id ?? null
  mediaForm.platform = video.platform
  mediaForm.title = video.title
  mediaForm.embedUrl = video.embedUrl
  mediaForm.videoUrl = video.videoUrl
  mediaForm.thumbnailUrl = video.thumbnailUrl
}

async function saveMediaVideo() {
  mediaSaving.value = true

  try {
    const payload = {
      platform: mediaForm.platform.trim(),
      title: mediaForm.title.trim(),
      embedUrl: mediaForm.embedUrl.trim(),
      videoUrl: mediaForm.videoUrl.trim(),
      thumbnailUrl: mediaForm.thumbnailUrl.trim(),
    }

    if (activeMediaId.value) {
      await set(dbRef(database, `portfolio/mediaVideos/${activeMediaId.value}`), payload)
      setStatus('Video updated.')
    } else {
      const mediaRef = push(dbRef(database, 'portfolio/mediaVideos'))
      await set(mediaRef, payload)
      setStatus('Video added.')
    }

    resetMediaForm()
    showMediaModal.value = false
  } finally {
    mediaSaving.value = false
  }
}

async function deleteMediaVideo(id?: string) {
  if (!id) return
  await remove(dbRef(database, `portfolio/mediaVideos/${id}`))
  setStatus('Video removed.')

  if (activeMediaId.value === id) {
    resetMediaForm()
  }
}

function resetSkillForm() {
  activeSkillId.value = null
  skillForm.title = ''
  skillForm.icon = 'terminal'
  skillForm.itemsText = ''
}

function openAddSkillModal() {
  resetSkillForm()
  showSkillModal.value = true
}

function openEditSkillModal(group: SkillGroup) {
  editSkill(group)
  showSkillModal.value = true
}

function closeSkillModal() {
  showSkillModal.value = false
  resetSkillForm()
}

function editSkill(group: SkillGroup) {
  activeSkillId.value = group.id ?? null
  skillForm.title = group.title
  skillForm.icon = group.icon
  skillForm.itemsText = group.items.join(', ')
}

async function saveSkillGroup() {
  skillSaving.value = true

  try {
    const payload = {
      title: skillForm.title.trim(),
      icon: skillForm.icon.trim(),
      items: parseItems(skillForm.itemsText),
    }

    if (activeSkillId.value) {
      await set(dbRef(database, `portfolio/skillGroups/${activeSkillId.value}`), payload)
      setStatus('Skill group updated.')
    } else {
      const skillRef = push(dbRef(database, 'portfolio/skillGroups'))
      await set(skillRef, payload)
      setStatus('Skill group added.')
    }

    resetSkillForm()
    showSkillModal.value = false
  } finally {
    skillSaving.value = false
  }
}

async function deleteSkillGroup(id?: string) {
  if (!id) return
  await remove(dbRef(database, `portfolio/skillGroups/${id}`))
  setStatus('Skill group removed.')

  if (activeSkillId.value === id) {
    resetSkillForm()
  }
}

function resetProjectForm() {
  activeProjectId.value = null
  projectForm.title = ''
  projectForm.description = ''
  projectForm.tagsText = ''
  projectForm.link = ''
}

function openAddProjectModal() {
  resetProjectForm()
  showProjectModal.value = true
}

function openEditProjectModal(project: ProjectItem) {
  editProject(project)
  showProjectModal.value = true
}

function closeProjectModal() {
  showProjectModal.value = false
  resetProjectForm()
}

function editProject(project: ProjectItem) {
  activeProjectId.value = project.id ?? null
  projectForm.title = project.title
  projectForm.description = project.description
  projectForm.tagsText = project.tags.join(', ')
  projectForm.link = project.link
}

async function saveProject() {
  projectSaving.value = true

  try {
    const payload = {
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      tags: parseItems(projectForm.tagsText),
      link: projectForm.link.trim() || '#',
    }

    if (activeProjectId.value) {
      await set(dbRef(database, `portfolio/projects/${activeProjectId.value}`), payload)
      setStatus('Project updated.')
    } else {
      const projectRef = push(dbRef(database, 'portfolio/projects'))
      await set(projectRef, payload)
      setStatus('Project added.')
    }

    resetProjectForm()
    showProjectModal.value = false
  } finally {
    projectSaving.value = false
  }
}

async function deleteProject(id?: string) {
  if (!id) return
  await remove(dbRef(database, `portfolio/projects/${id}`))
  setStatus('Project removed.')

  if (activeProjectId.value === id) {
    resetProjectForm()
  }
}

onMounted(() => {
  const unsubscribeSummary = onValue(
    dbRef(database, 'websiteAnalytics/summary'),
    (snapshot) => {
      analyticsError.value = ''
      if (snapshot.exists()) {
        const value = snapshot.val() as Record<string, unknown>
        totalPageViews.value = Number(value.totalPageViews ?? 0)
        lastVisitedPath.value = String(value.lastVisitedPath ?? '/')
        lastVisitedAt.value = Number(value.lastVisitedAt ?? 0) || null
        pathViews.value =
          value.paths && typeof value.paths === 'object'
            ? (value.paths as Record<string, number>)
            : {}
      } else {
        totalPageViews.value = 0
        lastVisitedPath.value = '/'
        lastVisitedAt.value = null
        pathViews.value = {}
      }

      analyticsLoading.value = false
    },
    (error) => {
      analyticsLoading.value = false
      analyticsError.value = 'Analytics data is unavailable right now.'
      console.error('[dashboard] Failed to read analytics summary.', error)
    },
  )

  const unsubscribeVisitors = onValue(
    dbRef(database, 'websiteAnalytics/visitors'),
    (snapshot) => {
      analyticsError.value = ''
      if (!snapshot.exists()) {
        uniqueVisitors.value = 0
        return
      }

      const visitors = snapshot.val() as Record<string, unknown>
      uniqueVisitors.value = Object.keys(visitors).length
    },
    (error) => {
      analyticsError.value = 'Analytics data is unavailable right now.'
      console.error('[dashboard] Failed to read analytics visitors.', error)
    },
  )

  analyticsUnsubscribes.push(unsubscribeSummary, unsubscribeVisitors)
})

onBeforeUnmount(() => {
  analyticsUnsubscribes.forEach((unsubscribe) => unsubscribe())
})
</script>

<template>
  <main class="dashboard-identity circuit-bg min-h-screen bg-background-light pb-16 pt-24 dark:bg-background-dark">
    <section class="section-shell space-y-8">
      <header class="glass-panel rounded-2xl p-6 md:p-8">
        <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="section-kicker">Protected Area</p>
            <h1 class="dashboard-hero-title text-3xl font-black tracking-tight text-text-main dark:text-white md:text-4xl">Portfolio Dashboard</h1>
            <p class="mt-2 text-sm text-text-muted dark:text-slate-400">
              Manage portfolio content and monitor website analytics.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <Button
              type="button"
              class="theme-toggle-btn group !h-11 !w-11 !rounded-lg !border !border-primary/30 !bg-primary/10 !p-0 !text-primary transition-all duration-300 hover:!border-primary hover:!bg-primary/20"
              aria-label="Toggle theme"
              @click="toggleTheme"
            >
              <span class="material-symbols-outlined flex items-center justify-center leading-none" v-if="!isDark">light_mode</span>
              <span class="material-symbols-outlined flex items-center justify-center leading-none" v-else>dark_mode</span>
            </Button>
            <Button type="button" class="btn-secondary !px-6 !py-3" label="View Site" @click="viewSite" />
            <Button type="button" class="btn-primary !px-6 !py-3" label="Logout" @click="logout" />
          </div>
        </div>

        <Message
          v-if="statusMessage"
          severity="success"
          :closable="false"
          class="mt-4 !rounded-lg !border !border-emerald-300 !bg-emerald-50 !px-4 !py-3 !text-sm !text-emerald-700 dark:!border-emerald-500/30 dark:!bg-emerald-500/10 dark:!text-emerald-200"
        >
          {{ statusMessage }}
        </Message>
      </header>

      <TabView v-model:activeIndex="activeDashboardTabIndex" class="dashboard-tabs">
        <TabPanel>
          <template #header>
            <span class="tab-header">
              <span class="material-symbols-outlined">query_stats</span>
              <span>Analytics</span>
            </span>
          </template>
          <Card class="skill-card">
            <template #content>
              <h2 class="dashboard-section-title mb-2 flex items-center gap-2 text-2xl font-bold text-text-main dark:text-white">
                <span class="material-symbols-outlined text-primary">monitoring</span>
                Website Analytics
              </h2>
              <p class="mb-5 text-sm text-text-muted dark:text-slate-400">Tracked with Firebase Analytics and Realtime Database counters.</p>

              <p v-if="analyticsLoading" class="text-sm text-text-muted dark:text-slate-400">Loading analytics...</p>
              <Message
                v-else-if="analyticsError"
                severity="warn"
                :closable="false"
                class="!rounded-lg !border !border-amber-300 !bg-amber-50 !px-4 !py-3 !text-sm !text-amber-700 dark:!border-amber-500/30 dark:!bg-amber-500/10 dark:!text-amber-200"
              >
                {{ analyticsError }}
              </Message>

              <div v-else class="space-y-6">
                <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <p class="metric-label">Total Page Views</p>
                      <p class="mt-2 text-3xl font-black tracking-tight text-text-main dark:text-white">{{ totalPageViews }}</p>
                    </template>
                  </Card>
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <p class="metric-label">Unique Visitors</p>
                      <p class="mt-2 text-3xl font-black tracking-tight text-text-main dark:text-white">{{ uniqueVisitors }}</p>
                    </template>
                  </Card>
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <p class="metric-label">Tracked Pages</p>
                      <p class="mt-2 text-3xl font-black tracking-tight text-text-main dark:text-white">{{ trackedPageCount }}</p>
                    </template>
                  </Card>
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <p class="metric-label">Last Visit</p>
                      <p class="mt-2 text-sm font-semibold text-text-main dark:text-white">{{ formattedLastVisit }}</p>
                      <p class="mt-1 text-xs text-text-muted dark:text-slate-400">{{ lastVisitedPath }}</p>
                    </template>
                  </Card>
                </div>

                <div class="space-y-3">
                  <h3 class="dashboard-sub-title text-sm font-bold uppercase tracking-wider text-text-main dark:text-white">Top Pages</h3>
                  <p v-if="topPages.length === 0" class="text-sm text-text-muted dark:text-slate-400">No page views tracked yet.</p>
                  <Card
                    v-for="item in topPages"
                    :key="item.path"
                    class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark"
                  >
                    <template #content>
                      <div class="flex items-center justify-between text-sm">
                        <p class="font-semibold text-text-main dark:text-white">{{ item.path }}</p>
                        <p class="text-text-muted dark:text-slate-400">{{ item.views }} views</p>
                      </div>
                    </template>
                  </Card>
                </div>
              </div>
            </template>
          </Card>
        </TabPanel>

        <TabPanel>
          <template #header>
            <span class="tab-header">
              <span class="material-symbols-outlined">workspaces</span>
              <span>Portfolio</span>
            </span>
          </template>
          <section class="grid gap-8">
            <Card class="skill-card">
              <template #content>
                <div class="mb-5 flex items-center justify-between gap-4">
                  <h2 class="dashboard-section-title flex items-center gap-2 text-2xl font-bold text-text-main dark:text-white">
                    <span class="material-symbols-outlined text-primary">contact_page</span>
                    Contact Details
                  </h2>
                  <Button class="btn-primary !px-6 !py-3" label="Edit Contact" @click="openContactModal" />
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <p class="metric-label">Email</p>
                      <a class="mt-2 block text-sm font-semibold text-text-main hover:text-primary dark:text-white" :href="contactDetails.emailUrl">
                        {{ contactDetails.email }}
                      </a>
                    </template>
                  </Card>
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <p class="metric-label">LinkedIn</p>
                      <a class="mt-2 block text-sm font-semibold text-text-main hover:text-primary dark:text-white" :href="contactDetails.linkedinUrl" target="_blank" rel="noreferrer">
                        {{ contactDetails.linkedin }}
                      </a>
                    </template>
                  </Card>
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <p class="metric-label">GitHub</p>
                      <a class="mt-2 block text-sm font-semibold text-text-main hover:text-primary dark:text-white" :href="contactDetails.githubUrl" target="_blank" rel="noreferrer">
                        {{ contactDetails.github }}
                      </a>
                    </template>
                  </Card>
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <p class="metric-label">X / Twitter</p>
                      <a class="mt-2 block text-sm font-semibold text-text-main hover:text-primary dark:text-white" :href="contactDetails.twitterUrl" target="_blank" rel="noreferrer">
                        {{ contactDetails.twitter }}
                      </a>
                    </template>
                  </Card>
                </div>
              </template>
            </Card>

            <Card class="skill-card">
              <template #content>
                <div class="mb-5 flex items-center justify-between gap-4">
                  <h2 class="dashboard-section-title flex items-center gap-2 text-2xl font-bold text-text-main dark:text-white">
                    <span class="material-symbols-outlined text-primary">play_circle</span>
                    Media Center Videos
                  </h2>
                  <Button class="btn-primary !px-6 !py-3" label="Add Video" @click="openAddMediaModal" />
                </div>

                <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Card
                    v-for="video in mediaVideos"
                    :key="video.id ?? video.title"
                    class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark"
                  >
                    <template #content>
                      <div class="mb-4 space-y-1">
                        <p class="text-sm font-bold text-text-main dark:text-white">{{ video.title }}</p>
                        <p class="text-xs text-text-muted dark:text-slate-400">{{ video.platform }}</p>
                      </div>
                      <div class="flex gap-2">
                        <Button class="chip !normal-case" label="Edit" @click="openEditMediaModal(video)" />
                        <Button class="chip !normal-case !border-rose-300 !bg-rose-50 !text-rose-700" label="Delete" @click="deleteMediaVideo(video.id)" />
                      </div>
                    </template>
                  </Card>
                </div>
              </template>
            </Card>

            <Card class="skill-card">
              <template #content>
                <div class="mb-5 flex items-center justify-between gap-4">
                  <h2 class="dashboard-section-title flex items-center gap-2 text-2xl font-bold text-text-main dark:text-white">
                    <span class="material-symbols-outlined text-primary">auto_awesome</span>
                    Skill Groups
                  </h2>
                  <Button class="btn-primary !px-6 !py-3" label="Add Group" @click="openAddSkillModal" />
                </div>

                <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Card
                    v-for="group in skillGroups"
                    :key="group.id ?? group.title"
                    class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark"
                  >
                    <template #content>
                      <div class="mb-4 space-y-1">
                        <p class="text-sm font-bold text-text-main dark:text-white">{{ group.title }}</p>
                        <p class="text-xs text-text-muted dark:text-slate-400">{{ group.items.join(', ') }}</p>
                      </div>
                      <div class="flex gap-2">
                        <Button class="chip !normal-case" label="Edit" @click="openEditSkillModal(group)" />
                        <Button class="chip !normal-case !border-rose-300 !bg-rose-50 !text-rose-700" label="Delete" @click="deleteSkillGroup(group.id)" />
                      </div>
                    </template>
                  </Card>
                </div>
              </template>
            </Card>

            <Card class="skill-card">
              <template #content>
                <div class="mb-5 flex items-center justify-between gap-4">
                  <h2 class="dashboard-section-title flex items-center gap-2 text-2xl font-bold text-text-main dark:text-white">
                    <span class="material-symbols-outlined text-primary">folder_code</span>
                    Projects
                  </h2>
                  <Button class="btn-primary !px-6 !py-3" label="Add Project" @click="openAddProjectModal" />
                </div>

                <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Card
                    v-for="project in projects"
                    :key="project.id ?? project.title"
                    class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark"
                  >
                    <template #content>
                      <div class="mb-4 space-y-2">
                        <p class="text-sm font-bold text-text-main dark:text-white">{{ project.title }}</p>
                        <p class="text-xs text-text-muted dark:text-slate-400">{{ project.description }}</p>
                        <p class="text-xs text-text-muted dark:text-slate-400">{{ project.tags.join(', ') }}</p>
                      </div>
                      <div class="flex gap-2">
                        <Button class="chip !normal-case" label="Edit" @click="openEditProjectModal(project)" />
                        <Button class="chip !normal-case !border-rose-300 !bg-rose-50 !text-rose-700" label="Delete" @click="deleteProject(project.id)" />
                      </div>
                    </template>
                  </Card>
                </div>
              </template>
            </Card>
          </section>
        </TabPanel>
      </TabView>

      <Dialog
        v-model:visible="showContactModal"
        modal
        header="Edit Contact Details"
        class="dashboard-dialog"
        :draggable="false"
        :dismissableMask="true"
        :style="{ width: 'min(900px, 95vw)' }"
      >
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="saveContactDetails">
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Email</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">mail</span>
              <InputText v-model="contactForm.email" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Email URL</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">link</span>
              <InputText v-model="contactForm.emailUrl" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">LinkedIn Label</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">badge</span>
              <InputText v-model="contactForm.linkedin" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">LinkedIn URL</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">link</span>
              <InputText v-model="contactForm.linkedinUrl" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">GitHub Label</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">code</span>
              <InputText v-model="contactForm.github" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">GitHub URL</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">link</span>
              <InputText v-model="contactForm.githubUrl" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">X/Twitter Label</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">alternate_email</span>
              <InputText v-model="contactForm.twitter" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">X/Twitter URL</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">link</span>
              <InputText v-model="contactForm.twitterUrl" class="w-full dashboard-input with-icon" required />
            </div>
          </label>

          <div class="md:col-span-2 flex gap-3">
            <Button type="submit" class="btn-primary !px-6 !py-3" :label="savingContact ? 'Saving...' : 'Save Contact Details'" :disabled="savingContact" />
            <Button type="button" class="btn-secondary !px-6 !py-3" label="Cancel" @click="showContactModal = false" />
          </div>
        </form>
      </Dialog>

      <Dialog
        v-model:visible="showMediaModal"
        modal
        class="dashboard-dialog"
        :draggable="false"
        :dismissableMask="true"
        :header="activeMediaId ? 'Edit Video' : 'Add Video'"
        :style="{ width: 'min(760px, 95vw)' }"
      >
        <form class="space-y-4" @submit.prevent="saveMediaVideo">
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Platform</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">public</span>
              <InputText v-model="mediaForm.platform" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Title</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">title</span>
              <InputText v-model="mediaForm.title" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Embed URL</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">iframe</span>
              <InputText v-model="mediaForm.embedUrl" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Video URL</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">smart_display</span>
              <InputText v-model="mediaForm.videoUrl" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Thumbnail URL</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">image</span>
              <InputText v-model="mediaForm.thumbnailUrl" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <div class="flex gap-3">
            <Button type="submit" class="btn-primary !px-6 !py-3" :label="mediaSaving ? 'Saving...' : activeMediaId ? 'Update Video' : 'Add Video'" :disabled="mediaSaving" />
            <Button type="button" class="btn-secondary !px-6 !py-3" label="Cancel" @click="closeMediaModal" />
          </div>
        </form>
      </Dialog>

      <Dialog
        v-model:visible="showSkillModal"
        modal
        class="dashboard-dialog"
        :draggable="false"
        :dismissableMask="true"
        :header="activeSkillId ? 'Edit Skill Group' : 'Add Skill Group'"
        :style="{ width: 'min(760px, 95vw)' }"
      >
        <form class="space-y-4" @submit.prevent="saveSkillGroup">
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Group Title</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">category</span>
              <InputText v-model="skillForm.title" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Icon Name</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">emoji_symbols</span>
              <InputText v-model="skillForm.icon" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Items (comma separated)</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon textarea-icon">list</span>
              <Textarea v-model="skillForm.itemsText" class="w-full dashboard-input with-icon-textarea" rows="4" required />
            </div>
          </label>
          <div class="flex gap-3">
            <Button type="submit" class="btn-primary !px-6 !py-3" :label="skillSaving ? 'Saving...' : activeSkillId ? 'Update Group' : 'Add Group'" :disabled="skillSaving" />
            <Button type="button" class="btn-secondary !px-6 !py-3" label="Cancel" @click="closeSkillModal" />
          </div>
        </form>
      </Dialog>

      <Dialog
        v-model:visible="showProjectModal"
        modal
        class="dashboard-dialog"
        :draggable="false"
        :dismissableMask="true"
        :header="activeProjectId ? 'Edit Project' : 'Add Project'"
        :style="{ width: 'min(760px, 95vw)' }"
      >
        <form class="space-y-4" @submit.prevent="saveProject">
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Project Title</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">work</span>
              <InputText v-model="projectForm.title" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Description</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon textarea-icon">description</span>
              <Textarea v-model="projectForm.description" class="w-full dashboard-input with-icon-textarea" rows="4" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Tags (comma separated)</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">sell</span>
              <InputText v-model="projectForm.tagsText" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Link URL</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">link</span>
              <InputText v-model="projectForm.link" class="w-full dashboard-input with-icon" />
            </div>
          </label>
          <div class="flex gap-3">
            <Button type="submit" class="btn-primary !px-6 !py-3" :label="projectSaving ? 'Saving...' : activeProjectId ? 'Update Project' : 'Add Project'" :disabled="projectSaving" />
            <Button type="button" class="btn-secondary !px-6 !py-3" label="Cancel" @click="closeProjectModal" />
          </div>
        </form>
      </Dialog>
    </section>
  </main>
</template>

<style scoped>
.dashboard-tabs :deep(.p-tabview-nav-container),
.dashboard-tabs :deep(.p-tabview-nav),
.dashboard-tabs :deep(.p-tabview-panels) {
  background: transparent;
  border: 0;
}

.dashboard-tabs :deep(.p-tabview-nav-container) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 4.5rem;
}

.dashboard-tabs :deep(.p-tabview-nav) {
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.5rem 0;
  width: auto;
}

.dashboard-tabs :deep(.p-tabview-nav li .p-tabview-nav-link) {
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 0.75rem;
  color: rgb(100 116 139);
  font-weight: 700;
  padding: 0.7rem 1.05rem;
  transition: all 0.2s ease;
}

.dashboard-tabs :deep(.p-tabview-nav li:not(.p-highlight) .p-tabview-nav-link:hover) {
  background: rgba(255, 255, 255, 0.75);
  color: rgb(15 23 42);
}

.dashboard-tabs :deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  background: rgb(0 225 255);
  border-color: rgb(0 225 255);
  box-shadow: 0 8px 24px rgba(0, 225, 255, 0.25);
  color: rgb(2 6 23);
}

.dashboard-tabs :deep(.p-tabview-panels) {
  margin-top: 0.75rem;
  padding: 0;
}

.tab-header {
  align-items: center;
  display: inline-flex;
  gap: 0.45rem;
  line-height: 1;
}

.tab-header .material-symbols-outlined {
  font-size: 1.1rem;
}

:global(.dashboard-identity .p-component) {
  font-family: 'Space Grotesk', sans-serif;
}

.dashboard-hero-title,
.dashboard-section-title {
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: -0.015em;
}

.dashboard-sub-title {
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: 0.08em;
}

:global(.theme-toggle-btn.p-button) {
  align-items: center;
  display: inline-flex;
  justify-content: center;
}

:global(.theme-toggle-btn .p-button-label) {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  justify-content: center;
  line-height: 1;
}

:global(.dashboard-dialog .dashboard-field) {
  display: block;
}

:global(.dashboard-dialog .field-input-wrap) {
  position: relative;
}

:global(.dashboard-dialog .field-icon) {
  color: rgb(100 116 139);
  left: 0.75rem;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

:global(.dashboard-dialog .field-icon.textarea-icon) {
  top: 0.9rem;
  transform: none;
}

:global(.dashboard-dialog .dashboard-input.with-icon.p-inputtext) {
  min-height: 3rem;
  padding-left: 2.6rem;
}

:global(.dashboard-dialog .dashboard-input.with-icon-textarea.p-inputtextarea) {
  min-height: 7.5rem;
  padding-left: 2.6rem;
  padding-top: 0.7rem;
}

:global(html.dark) .dashboard-tabs :deep(.p-tabview-nav li .p-tabview-nav-link) {
  background: rgba(15, 23, 42, 0.55);
  border-color: rgba(0, 225, 255, 0.2);
  color: rgb(148 163 184);
}

:global(html.dark) .dashboard-tabs :deep(.p-tabview-nav li:not(.p-highlight) .p-tabview-nav-link:hover) {
  background: rgba(15, 23, 42, 0.6);
  color: rgb(255 255 255);
}

:global(.dashboard-dialog.p-dialog) {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 1rem;
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.25);
  color: rgb(15 23 42);
}

:global(.dashboard-dialog .p-dialog-header) {
  background: transparent;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  color: rgb(15 23 42);
  padding: 1.1rem 1.25rem;
}

:global(.dashboard-dialog .p-dialog-title) {
  font-size: 1.125rem;
  font-weight: 800;
}

:global(.dashboard-dialog .p-dialog-content) {
  background: transparent;
  color: inherit;
  padding: 1.1rem 1.25rem 1.25rem;
}

:global(.dashboard-dialog .p-inputtext),
:global(.dashboard-dialog .p-inputtextarea) {
  background: rgb(255 255 255);
  border: 1px solid rgb(203 213 225);
  border-radius: 0.65rem;
  color: rgb(15 23 42);
  width: 100%;
}

:global(.dashboard-dialog .p-inputtext:enabled:focus),
:global(.dashboard-dialog .p-inputtextarea:enabled:focus) {
  border-color: rgb(0 225 255);
  box-shadow: 0 0 0 0.2rem rgba(0, 225, 255, 0.18);
}

:global(.p-dialog-mask.p-component-overlay) {
  backdrop-filter: blur(5px);
  background: rgba(2, 6, 23, 0.6);
}

:global(html.dark .dashboard-dialog.p-dialog) {
  background: rgba(15, 23, 42, 0.96);
  border-color: rgba(0, 225, 255, 0.24);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.6);
  color: rgb(226 232 240);
}

:global(html.dark .dashboard-dialog .p-dialog-header) {
  border-bottom-color: rgba(0, 225, 255, 0.2);
  color: rgb(248 250 252);
}

:global(html.dark .dashboard-dialog .p-inputtext),
:global(html.dark .dashboard-dialog .p-inputtextarea) {
  background: rgb(2 6 23);
  border-color: rgb(51 65 85);
  color: rgb(248 250 252);
}

:global(html.dark .dashboard-dialog .field-icon) {
  color: rgb(148 163 184);
}

:global(html.dark .dashboard-dialog .p-inputtext:enabled:focus),
:global(html.dark .dashboard-dialog .p-inputtextarea:enabled:focus) {
  border-color: rgb(0 225 255);
  box-shadow: 0 0 0 0.2rem rgba(0, 225, 255, 0.16);
}
</style>
