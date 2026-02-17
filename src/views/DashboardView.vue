<script setup lang="ts">
import { signOut } from 'firebase/auth'
import { onValue, push, ref as dbRef, remove, set } from 'firebase/database'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
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
const visitorLastSeenAt = ref<number[]>([])
const lastVisitedPath = ref('/')
const lastVisitedAt = ref<number | null>(null)
const pathViews = ref<Record<string, number>>({})
const analyticsUnsubscribes: Array<() => void> = []
const activeDashboardTabIndex = ref(0)
const showContactModal = ref(false)
const showMediaModal = ref(false)
const showSkillModal = ref(false)
const showProjectModal = ref(false)
const showStoreApiModal = ref(false)
const showStoreApiTestModal = ref(false)
const storeApiSaving = ref(false)
const storeApiLoading = ref(true)
const storeBearerSaving = ref(false)
const storeApiTestLoading = ref(false)
const activeStoreApiId = ref<string | null>(null)
const storeBearerApiKey = ref('')

type StoreApiTestResult = {
  ok: boolean
  status: number
  statusText: string
  durationMs: number
  headers: Record<string, string>
  body: string
}

type StoreApiCategory = 'analytics' | 'users' | 'products' | 'payments'
type StoreApiAction = {
  id?: string
  category: StoreApiCategory
  route: string
  methods: string[]
  action: string
  description: string
}

const storeApis = ref<StoreApiAction[]>([])
const storeApiForm = reactive<StoreApiAction>({
  category: 'analytics',
  route: '',
  methods: ['GET'],
  action: '',
  description: '',
})

const storeApiTestForm = reactive({
  route: '',
  method: 'GET',
  body: '',
})
const storeApiTestResult = ref<StoreApiTestResult | null>(null)
const storeApiTestError = ref('')
const storeApiResponseView = ref<'raw' | 'graph'>('raw')

const storeApiMethodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const storeApiCategories: Array<{ key: StoreApiCategory; label: string; icon: string }> = [
  { key: 'analytics', label: 'Analytics API', icon: 'query_stats' },
  { key: 'users', label: 'Users APIs', icon: 'group' },
  { key: 'products', label: 'Products APIs (services/apps)', icon: 'deployed_code' },
  { key: 'payments', label: 'Payments APIs', icon: 'payments' },
]

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

const groupedStoreApis = computed(() => {
  const grouped = new Map<string, StoreApiAction[]>()

  storeApis.value.forEach((api) => {
    const key = api.route.trim() || '/'
    const current = grouped.get(key) ?? []
    current.push(api)
    grouped.set(key, current)
  })

  return Array.from(grouped.entries())
    .map(([route, actions]) => ({
      route,
      actions: actions.sort((a, b) => a.action.localeCompare(b.action)),
    }))
    .sort((a, b) => a.route.localeCompare(b.route))
})

const topPagesPiePalette = ['#00e1ff', '#06b6d4', '#22d3ee', '#38bdf8', '#0ea5e9']

const topPagesPieSlices = computed(() => {
  const total = topPages.value.reduce((sum, item) => sum + item.views, 0)
  let start = 0

  return topPages.value.map((item, index) => {
    const ratio = total > 0 ? item.views / total : 0
    const sweep = ratio * 360
    const end = start + sweep
    const slice = {
      ...item,
      color: topPagesPiePalette[index % topPagesPiePalette.length],
      start,
      end,
      percentage: ratio * 100,
    }
    start = end
    return slice
  })
})

const topPagesPieStyle = computed(() => {
  if (topPagesPieSlices.value.length === 0) {
    return { background: 'conic-gradient(#e2e8f0 0deg 360deg)' }
  }

  const gradient = topPagesPieSlices.value
    .map((slice) => `${slice.color} ${slice.start}deg ${slice.end}deg`)
    .join(', ')

  return {
    background: `conic-gradient(${gradient})`,
  }
})

const weeklyUniqueVisitors = computed(() => {
  const order = [1, 2, 3, 4, 5, 6, 0] // Mon ... Sun
  const labels = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
  } as const

  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? 6 : day - 1
  const weekStart = new Date(now)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(now.getDate() - diffToMonday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const counts = new Map<number, number>(order.map((weekday) => [weekday, 0]))
  visitorLastSeenAt.value.forEach((timestamp) => {
    const date = new Date(timestamp)
    if (date >= weekStart && date < weekEnd) {
      const weekday = date.getDay()
      counts.set(weekday, (counts.get(weekday) ?? 0) + 1)
    }
  })

  return order.map((weekday) => ({
    day: weekday,
    label: labels[weekday as keyof typeof labels],
    count: counts.get(weekday) ?? 0,
  }))
})

const weeklyUniqueVisitorsMax = computed(() =>
  weeklyUniqueVisitors.value.length > 0
    ? Math.max(...weeklyUniqueVisitors.value.map((item) => item.count), 1)
    : 1,
)

type BrainstormNode = {
  id: string
  depth: number
  label: string
  value: string
  parentId: string | null
  parentLabel: string
}

const apiResponseBrainstorm = computed<BrainstormNode[]>(() => {
  const body = storeApiTestResult.value?.body ?? ''
  if (!body || body === '(empty response)') return []

  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return []
  }

  const nodes: BrainstormNode[] = []
  const maxNodes = 120
  const maxDepth = 6

  function shortValue(value: unknown) {
    if (value === null) return 'null'
    if (typeof value === 'string') return value.length > 48 ? `${value.slice(0, 48)}...` : value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return `${value.length} items`
    if (typeof value === 'object') return `${Object.keys(value as Record<string, unknown>).length} fields`
    return String(value)
  }

  function visit(
    value: unknown,
    label: string,
    depth: number,
    parentId: string | null,
    parentLabel: string,
    keyPath: string,
  ) {
    if (nodes.length >= maxNodes || depth > maxDepth) return

    nodes.push({
      id: keyPath,
      depth,
      label,
      value: shortValue(value),
      parentId,
      parentLabel,
    })

    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.slice(0, 12).forEach((entry, index) => {
          visit(entry, `[${index}]`, depth + 1, keyPath, label, `${keyPath}.${index}`)
        })
        return
      }

      Object.entries(value as Record<string, unknown>)
        .slice(0, 16)
        .forEach(([entryKey, entryValue]) => {
          visit(entryValue, entryKey, depth + 1, keyPath, label, `${keyPath}.${entryKey}`)
        })
    }
  }

  visit(parsed, 'root', 0, null, '-', 'root')
  return nodes
})

const selectedBrainstormPath = ref<string[]>([])

const apiResponseBrainstormLevels = computed(() => {
  const nodes = apiResponseBrainstorm.value
  if (nodes.length === 0) return []

  const nodesByDepth = new Map<number, BrainstormNode[]>()
  nodes.forEach((node) => {
    const current = nodesByDepth.get(node.depth) ?? []
    current.push(node)
    nodesByDepth.set(node.depth, current)
  })

  const levels: Array<{ depth: number; selectedId: string; nodes: BrainstormNode[] }> = []
  const rootNodes = nodesByDepth.get(0) ?? []
  if (rootNodes.length === 0) return []

  let selectedId = rootNodes.some((node) => node.id === selectedBrainstormPath.value[0])
    ? selectedBrainstormPath.value[0]
    : rootNodes[0].id
  levels.push({ depth: 0, selectedId, nodes: rootNodes })

  const maxDepth = Math.max(...nodes.map((node) => node.depth))
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const depthNodes = (nodesByDepth.get(depth) ?? []).filter((node) => node.parentId === selectedId)
    if (depthNodes.length === 0) break

    selectedId = depthNodes.some((node) => node.id === selectedBrainstormPath.value[depth])
      ? selectedBrainstormPath.value[depth]
      : depthNodes[0].id

    levels.push({ depth, selectedId, nodes: depthNodes })
  }

  return levels
})

function selectBrainstormNode(depth: number, nodeId: string) {
  selectedBrainstormPath.value = [...selectedBrainstormPath.value.slice(0, depth), nodeId]
}

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

function resetStoreApiForm() {
  activeStoreApiId.value = null
  storeApiForm.category = 'analytics'
  storeApiForm.route = ''
  storeApiForm.methods = ['GET']
  storeApiForm.action = ''
  storeApiForm.description = ''
}

function openAddStoreApiModal() {
  resetStoreApiForm()
  showStoreApiModal.value = true
}

function openEditStoreApiModal(api: StoreApiAction) {
  activeStoreApiId.value = api.id ?? null
  storeApiForm.category = api.category
  storeApiForm.route = api.route
  storeApiForm.methods = [...api.methods]
  storeApiForm.action = api.action
  storeApiForm.description = api.description
  showStoreApiModal.value = true
}

function closeStoreApiModal() {
  showStoreApiModal.value = false
  resetStoreApiForm()
}

function openStoreApiTestModal() {
  storeApiTestForm.route = ''
  storeApiTestForm.method = 'GET'
  storeApiTestForm.body = ''
  storeApiTestResult.value = null
  storeApiTestError.value = ''
  storeApiResponseView.value = 'raw'
  selectedBrainstormPath.value = []
  showStoreApiTestModal.value = true
}

function closeStoreApiTestModal() {
  showStoreApiTestModal.value = false
}

async function saveStoreApi() {
  storeApiSaving.value = true

  try {
    const normalizedMethods = Array.from(
      new Set(storeApiForm.methods.map((method) => method.trim().toUpperCase()).filter(Boolean)),
    )
    const methods = normalizedMethods.length > 0 ? normalizedMethods : ['GET']

    const payload = {
      category: storeApiForm.category,
      route: storeApiForm.route.trim(),
      methods,
      action: storeApiForm.action.trim(),
      description: storeApiForm.description.trim(),
    }

    if (activeStoreApiId.value) {
      await set(dbRef(database, `store/apis/${activeStoreApiId.value}`), payload)
      setStatus('Store API action updated.')
    } else {
      const apiRef = push(dbRef(database, 'store/apis'))
      await set(apiRef, payload)
      setStatus('Store API action added.')
    }

    resetStoreApiForm()
  } finally {
    storeApiSaving.value = false
  }
}

async function deleteStoreApi(id?: string) {
  if (!id) return
  await remove(dbRef(database, `store/apis/${id}`))
  setStatus('Store API action removed.')

  if (activeStoreApiId.value === id) {
    closeStoreApiModal()
  }
}

function getStoreApiCategoryLabel(key: StoreApiCategory) {
  return storeApiCategories.find((entry) => entry.key === key)?.label ?? key
}

async function saveStoreBearerApiKey() {
  storeBearerSaving.value = true

  try {
    await set(dbRef(database, 'store/config/bearerApiKey'), storeBearerApiKey.value.trim())
    setStatus('Store Bearer API key saved.')
  } finally {
    storeBearerSaving.value = false
  }
}

async function runStoreApiTest() {
  storeApiTestLoading.value = true
  storeApiTestError.value = ''
  storeApiTestResult.value = null
  selectedBrainstormPath.value = []

  try {
    const method = storeApiTestForm.method.trim().toUpperCase()
    const route = storeApiTestForm.route.trim()

    if (!route) {
      storeApiTestError.value = 'Route is required.'
      return
    }

    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
    }

    if (storeBearerApiKey.value.trim()) {
      headers.Authorization = `Bearer ${storeBearerApiKey.value.trim()}`
    }

    const init: RequestInit = {
      method,
      headers,
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && storeApiTestForm.body.trim()) {
      headers['Content-Type'] = 'application/json'
      init.body = storeApiTestForm.body
    }

    const startedAt = performance.now()
    const response = await fetch(route, init)
    const durationMs = Math.round(performance.now() - startedAt)

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const rawBody = await response.text()
    let normalizedBody = rawBody

    try {
      const parsed = JSON.parse(rawBody)
      normalizedBody = JSON.stringify(parsed, null, 2)
    } catch {
      // Keep raw text response
    }

    storeApiTestResult.value = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      headers: responseHeaders,
      body: normalizedBody || '(empty response)',
    }
  } catch (error) {
    storeApiTestError.value = error instanceof Error ? error.message : 'Request failed.'
  } finally {
    storeApiTestLoading.value = false
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
        visitorLastSeenAt.value = []
        return
      }

      const visitors = snapshot.val() as Record<string, unknown>
      uniqueVisitors.value = Object.keys(visitors).length
      visitorLastSeenAt.value = Object.values(visitors)
        .map((value) => {
          if (!value || typeof value !== 'object') return 0
          const row = value as Record<string, unknown>
          return Number(row.lastSeenAt ?? 0)
        })
        .filter((value) => Number.isFinite(value) && value > 0)
    },
    (error) => {
      analyticsError.value = 'Analytics data is unavailable right now.'
      console.error('[dashboard] Failed to read analytics visitors.', error)
    },
  )

  const unsubscribeStoreApis = onValue(
    dbRef(database, 'store/apis'),
    (snapshot) => {
      if (!snapshot.exists()) {
        storeApis.value = []
        storeApiLoading.value = false
        return
      }

      const raw = snapshot.val() as Record<string, Record<string, unknown>>
      storeApis.value = Object.entries(raw)
        .map(([id, value]) => ({
          id,
          category: String(value.category ?? 'analytics') as StoreApiCategory,
          route: String(value.route ?? ''),
          methods: Array.isArray(value.methods)
            ? value.methods.map((entry) => String(entry).toUpperCase()).filter(Boolean)
            : [String(value.method ?? 'GET').toUpperCase()],
          action: String(value.action ?? ''),
          description: String(value.description ?? ''),
        }))
        .filter((entry) => entry.route && entry.action)

      storeApiLoading.value = false
    },
    (error) => {
      storeApiLoading.value = false
      console.error('[dashboard] Failed to read store APIs.', error)
    },
  )

  const unsubscribeStoreConfig = onValue(
    dbRef(database, 'store/config'),
    (snapshot) => {
      if (!snapshot.exists()) {
        storeBearerApiKey.value = ''
        return
      }

      const raw = snapshot.val() as Record<string, unknown>
      storeBearerApiKey.value = String(raw.bearerApiKey ?? '')
    },
    (error) => {
      console.error('[dashboard] Failed to read store config.', error)
    },
  )

  analyticsUnsubscribes.push(
    unsubscribeSummary,
    unsubscribeVisitors,
    unsubscribeStoreApis,
    unsubscribeStoreConfig,
  )
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
                      <div class="flex items-start gap-3">
                        <div class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span class="material-symbols-outlined text-[20px]">visibility</span>
                        </div>
                        <div>
                          <p class="metric-label">Total Page Views</p>
                          <p class="mt-2 text-3xl font-black tracking-tight text-text-main dark:text-white">{{ totalPageViews }}</p>
                        </div>
                      </div>
                    </template>
                  </Card>
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <div class="flex items-start gap-3">
                        <div class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span class="material-symbols-outlined text-[20px]">groups</span>
                        </div>
                        <div>
                          <p class="metric-label">Unique Visitors</p>
                          <p class="mt-2 text-3xl font-black tracking-tight text-text-main dark:text-white">{{ uniqueVisitors }}</p>
                        </div>
                      </div>
                    </template>
                  </Card>
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <div class="flex items-start gap-3">
                        <div class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span class="material-symbols-outlined text-[20px]">web</span>
                        </div>
                        <div>
                          <p class="metric-label">Tracked Pages</p>
                          <p class="mt-2 text-3xl font-black tracking-tight text-text-main dark:text-white">{{ trackedPageCount }}</p>
                        </div>
                      </div>
                    </template>
                  </Card>
                  <Card class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                    <template #content>
                      <div class="flex items-start gap-3">
                        <div class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span class="material-symbols-outlined text-[20px]">schedule</span>
                        </div>
                        <div>
                          <p class="metric-label">Last Visit</p>
                          <p class="mt-2 text-sm font-semibold text-text-main dark:text-white">{{ formattedLastVisit }}</p>
                          <p class="mt-1 text-xs text-text-muted dark:text-slate-400">{{ lastVisitedPath }}</p>
                        </div>
                      </div>
                    </template>
                  </Card>
                </div>

                <div class="space-y-3">
                  <h3 class="dashboard-sub-title text-sm font-bold uppercase tracking-wider text-text-main dark:text-white">Charts Overview</h3>
                  <p v-if="topPages.length === 0" class="text-sm text-text-muted dark:text-slate-400">No page views tracked yet.</p>
                  <div v-else class="analytics-dual-charts">
                    <article class="analytics-chart-card">
                      <p class="analytics-chart-title">Top Pages (Doughnut)</p>
                      <div class="analytics-pie-chart">
                        <div class="analytics-doughnut-wrap">
                          <div class="analytics-pie-circle" :style="topPagesPieStyle" />
                          <div class="analytics-doughnut-center">
                            <p class="analytics-doughnut-value">{{ topPages.length }}</p>
                            <p class="analytics-doughnut-label">Pages</p>
                          </div>
                        </div>
                        <div class="analytics-pie-legend">
                          <article
                            v-for="slice in topPagesPieSlices"
                            :key="`pie-${slice.path}`"
                            class="analytics-pie-legend-item"
                          >
                            <span class="analytics-pie-dot" :style="{ backgroundColor: slice.color }" />
                            <p class="analytics-pie-path" :title="slice.path">{{ slice.path }}</p>
                            <p class="analytics-pie-meta">{{ slice.views }} ({{ slice.percentage.toFixed(1) }}%)</p>
                          </article>
                        </div>
                      </div>
                    </article>

                    <article class="analytics-chart-card">
                      <p class="analytics-chart-title">Weekly Unique Visitors (Weekdays)</p>
                      <div class="analytics-weekly-chart">
                      <article
                        v-for="item in weeklyUniqueVisitors"
                        :key="`weekly-${item.label}`"
                        class="analytics-weekday-item"
                      >
                        <div
                          class="analytics-weekday-bar"
                          :style="{ height: `${Math.max((item.count / weeklyUniqueVisitorsMax) * 160, 8)}px` }"
                          :title="`${item.label}: ${item.count}`"
                        />
                        <p class="analytics-weekday-value">{{ item.count }}</p>
                        <p class="analytics-weekday-label">{{ item.label }}</p>
                      </article>
                    </div>
                    </article>
                  </div>
                </div>

                <div class="space-y-3">
                  <h3 class="dashboard-sub-title text-sm font-bold uppercase tracking-wider text-text-main dark:text-white">Top Pages</h3>
                  <p v-if="topPages.length === 0" class="text-sm text-text-muted dark:text-slate-400">No page views tracked yet.</p>
                  <DataTable
                    v-else
                    :value="topPages"
                    responsiveLayout="scroll"
                    stripedRows
                    class="analytics-top-pages"
                  >
                    <Column field="path" header="Page">
                      <template #body="slotProps">
                        <span class="inline-flex items-center gap-2 font-semibold text-text-main dark:text-white">
                          <span class="material-symbols-outlined text-base text-primary">description</span>
                          <span>{{ slotProps.data.path }}</span>
                        </span>
                      </template>
                    </Column>
                    <Column field="views" header="Views">
                      <template #body="slotProps">
                        <span class="text-text-muted dark:text-slate-300">{{ slotProps.data.views }}</span>
                      </template>
                    </Column>
                  </DataTable>
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

        <TabPanel>
          <template #header>
            <span class="tab-header">
              <span class="material-symbols-outlined">storefront</span>
              <span>Store</span>
            </span>
          </template>
        </TabPanel>

        <TabPanel>
          <template #header>
            <span class="tab-header">
              <span class="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </span>
          </template>
          <section class="grid gap-8">
            <Card class="skill-card">
              <template #content>
                <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <h2 class="dashboard-section-title flex items-center gap-2 text-2xl font-bold text-text-main dark:text-white">
                    <span class="material-symbols-outlined text-primary">api</span>
                    Manage Store APIs
                  </h2>
                  <div class="flex flex-wrap gap-3">
                    <Button class="btn-secondary !px-6 !py-3" label="Test API" @click="openStoreApiTestModal" />
                    <Button class="btn-primary !px-6 !py-3" label="Add API Action" @click="openAddStoreApiModal" />
                  </div>
                </div>

                <p class="mb-4 text-sm text-text-muted dark:text-slate-400">
                  Define API actions for each route. One route can have multiple actions and methods.
                </p>
                <Card class="mb-6 !rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark">
                  <template #content>
                    <p class="mb-2 text-sm font-semibold text-text-main dark:text-white">Shared Authorization (for all store APIs)</p>
                    <p class="mb-3 text-xs text-text-muted dark:text-slate-400">
                      Header: <code>Authorization: Bearer &lt;API_KEY&gt;</code>
                    </p>
                    <div class="flex flex-wrap gap-3">
                      <div class="min-w-[260px] flex-1">
                        <InputText v-model="storeBearerApiKey" class="w-full dashboard-input !h-12 !px-4 !py-3" placeholder="Enter shared Bearer API key" />
                      </div>
                      <Button
                        class="btn-primary !px-6 !py-3"
                        :label="storeBearerSaving ? 'Saving...' : 'Save API Key'"
                        :disabled="storeBearerSaving"
                        @click="saveStoreBearerApiKey"
                      />
                    </div>
                  </template>
                </Card>

                <div class="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Card
                    v-for="category in storeApiCategories"
                    :key="category.key"
                    class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark"
                  >
                    <template #content>
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">{{ category.icon }}</span>
                        <p class="text-sm font-semibold text-text-main dark:text-white">{{ category.label }}</p>
                      </div>
                    </template>
                  </Card>
                </div>

                <p v-if="storeApiLoading" class="text-sm text-text-muted dark:text-slate-400">Loading store APIs...</p>
                <p v-else-if="groupedStoreApis.length === 0" class="text-sm text-text-muted dark:text-slate-400">
                  No API actions configured yet.
                </p>

                <div v-else class="space-y-4">
                  <Card
                    v-for="group in groupedStoreApis"
                    :key="group.route"
                    class="!rounded-xl !border !border-border-light !bg-white dark:!border-border-dark dark:!bg-surface-dark"
                  >
                    <template #content>
                      <div class="mb-4 flex items-center justify-between gap-3">
                        <p class="text-sm font-bold text-text-main dark:text-white">{{ group.route }}</p>
                        <span class="chip !normal-case">{{ group.actions.length }} action(s)</span>
                      </div>

                      <div class="space-y-3">
                        <div
                          v-for="api in group.actions"
                          :key="api.id ?? `${api.route}-${api.action}`"
                          class="rounded-lg border border-border-light p-3 dark:border-border-dark"
                        >
                          <div class="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              v-for="method in api.methods"
                              :key="`${api.id ?? api.route}-${method}`"
                              class="chip !normal-case"
                            >
                              {{ method }}
                            </span>
                            <span class="chip !normal-case !border-slate-300 !bg-slate-100 !text-slate-700 dark:!border-slate-600 dark:!bg-slate-800 dark:!text-slate-200">
                              {{ getStoreApiCategoryLabel(api.category) }}
                            </span>
                            <p class="text-sm font-semibold text-text-main dark:text-white">{{ api.action }}</p>
                          </div>
                          <p class="mb-3 text-xs text-text-muted dark:text-slate-400">{{ api.description }}</p>

                          <div class="flex gap-2">
                            <Button class="chip !normal-case" label="Edit" @click="openEditStoreApiModal(api)" />
                            <Button
                              class="chip !normal-case !border-rose-300 !bg-rose-50 !text-rose-700"
                              label="Delete"
                              @click="deleteStoreApi(api.id)"
                            />
                          </div>
                        </div>
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
        v-model:visible="showStoreApiModal"
        modal
        class="dashboard-dialog"
        :draggable="false"
        :dismissableMask="true"
        :header="activeStoreApiId ? 'Edit API Action' : 'Add API Action'"
        :style="{ width: 'min(760px, 95vw)' }"
      >
        <form class="space-y-4" @submit.prevent="saveStoreApi">
          <div class="space-y-2 dashboard-field">
            <span class="metric-label">API Group</span>
            <Dropdown
              v-model="storeApiForm.category"
              :options="storeApiCategories"
              optionLabel="label"
              optionValue="key"
              appendTo="body"
              :autoZIndex="true"
              :baseZIndex="3000"
              class="w-full dashboard-input dashboard-select"
              placeholder="Select API Group"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[18px]">
                    {{ storeApiCategories.find((entry) => entry.key === slotProps.value)?.icon }}
                  </span>
                  <span>{{ storeApiCategories.find((entry) => entry.key === slotProps.value)?.label }}</span>
                </div>
                <span v-else class="text-text-muted dark:text-slate-400">{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[18px]">{{ slotProps.option.icon }}</span>
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Dropdown>
          </div>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Route</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon">route</span>
              <InputText v-model="storeApiForm.route" class="w-full dashboard-input with-icon" required />
            </div>
          </label>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2 dashboard-field">
              <span class="metric-label">Methods</span>
              <MultiSelect
                v-model="storeApiForm.methods"
                :options="storeApiMethodOptions"
                appendTo="body"
                :autoZIndex="true"
                :baseZIndex="3000"
                class="w-full dashboard-input dashboard-select"
                display="chip"
                :maxSelectedLabels="2"
                placeholder="Select one or more methods"
              />
            </div>
            <label class="space-y-2 dashboard-field">
              <span class="metric-label">Action</span>
              <div class="field-input-wrap">
                <span class="material-symbols-outlined field-icon">bolt</span>
                <InputText v-model="storeApiForm.action" class="w-full dashboard-input with-icon" required />
              </div>
            </label>
          </div>
          <label class="space-y-2 dashboard-field">
            <span class="metric-label">Description</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon textarea-icon">description</span>
              <Textarea v-model="storeApiForm.description" class="w-full dashboard-input with-icon-textarea" rows="4" required />
            </div>
          </label>
          <div class="flex gap-3">
            <Button
              type="submit"
              class="btn-primary !px-6 !py-3"
              :label="storeApiSaving ? 'Saving...' : activeStoreApiId ? 'Update API Action' : 'Add API Action'"
              :disabled="storeApiSaving"
            />
            <Button type="button" class="btn-secondary !px-6 !py-3" label="Cancel" @click="closeStoreApiModal" />
          </div>
        </form>
      </Dialog>

      <Dialog
        v-model:visible="showStoreApiTestModal"
        modal
        class="dashboard-dialog"
        :draggable="false"
        :dismissableMask="true"
        header="Test Store API"
        :style="{ width: 'min(860px, 96vw)' }"
      >
        <form class="space-y-4" @submit.prevent="runStoreApiTest">
          <div class="grid gap-4 md:grid-cols-[170px_1fr]">
            <div class="space-y-2 dashboard-field">
              <span class="metric-label">Method</span>
              <Dropdown
                v-model="storeApiTestForm.method"
                :options="storeApiMethodOptions"
                appendTo="body"
                :autoZIndex="true"
                :baseZIndex="3000"
                class="w-full dashboard-input dashboard-select"
                placeholder="Method"
              />
            </div>
            <div class="space-y-2 dashboard-field">
              <span class="metric-label">Route URL</span>
              <div class="field-input-wrap">
                <span class="material-symbols-outlined field-icon">route</span>
                <InputText
                  v-model="storeApiTestForm.route"
                  class="w-full dashboard-input with-icon"
                  placeholder="https://api.example.com/v1/products or /api/products"
                  required
                />
              </div>
            </div>
          </div>

          <div class="space-y-2 dashboard-field">
            <span class="metric-label">Request Body (JSON, optional)</span>
            <div class="field-input-wrap">
              <span class="material-symbols-outlined field-icon textarea-icon">data_object</span>
              <Textarea
                v-model="storeApiTestForm.body"
                class="w-full dashboard-input with-icon-textarea"
                rows="5"
                placeholder='{"name":"Sample Product"}'
              />
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <Button
              type="submit"
              class="btn-primary !px-6 !py-3"
              :label="storeApiTestLoading ? 'Testing...' : 'Run Test'"
              :disabled="storeApiTestLoading"
            />
            <Button type="button" class="btn-secondary !px-6 !py-3" label="Close" @click="closeStoreApiTestModal" />
          </div>
        </form>

        <Message
          v-if="storeApiTestError"
          severity="error"
          :closable="false"
          class="mt-4"
        >
          {{ storeApiTestError }}
        </Message>

        <div v-if="storeApiTestResult" class="mt-5 space-y-3">
          <div class="grid gap-3 sm:grid-cols-3">
            <article class="rounded-lg border border-border-light bg-white px-4 py-3 dark:border-border-dark dark:bg-background-dark">
              <p class="metric-label">Status</p>
              <p class="mt-1 text-sm font-bold" :class="storeApiTestResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                {{ storeApiTestResult.status }} {{ storeApiTestResult.statusText }}
              </p>
            </article>
            <article class="rounded-lg border border-border-light bg-white px-4 py-3 dark:border-border-dark dark:bg-background-dark">
              <p class="metric-label">Duration</p>
              <p class="mt-1 text-sm font-bold text-text-main dark:text-white">{{ storeApiTestResult.durationMs }} ms</p>
            </article>
            <article class="rounded-lg border border-border-light bg-white px-4 py-3 dark:border-border-dark dark:bg-background-dark">
              <p class="metric-label">Headers</p>
              <p class="mt-1 text-sm font-bold text-text-main dark:text-white">{{ Object.keys(storeApiTestResult.headers).length }}</p>
            </article>
          </div>

          <div class="space-y-2">
            <p class="metric-label">Response Headers</p>
            <pre class="api-test-result-block">{{ JSON.stringify(storeApiTestResult.headers, null, 2) }}</pre>
          </div>

          <div class="space-y-2">
            <p class="metric-label">Response Body</p>
            <div class="flex items-center gap-2">
              <Button
                type="button"
                size="small"
                class="!px-3 !py-2"
                :severity="storeApiResponseView === 'raw' ? 'info' : 'secondary'"
                outlined
                @click="storeApiResponseView = 'raw'"
              >
                <span class="inline-flex items-center gap-1">
                  <span class="material-symbols-outlined text-base">data_object</span>
                  <span>Raw JSON</span>
                </span>
              </Button>
              <Button
                type="button"
                size="small"
                class="!px-3 !py-2"
                :severity="storeApiResponseView === 'graph' ? 'info' : 'secondary'"
                outlined
                @click="storeApiResponseView = 'graph'"
              >
                <span class="inline-flex items-center gap-1">
                  <span class="material-symbols-outlined text-base">account_tree</span>
                  <span>Brainstorm Graph</span>
                </span>
              </Button>
            </div>

            <pre v-if="storeApiResponseView === 'raw'" class="api-test-result-block">{{ storeApiTestResult.body }}</pre>

            <div v-else class="api-graph-wrap">
              <p
                v-if="apiResponseBrainstormLevels.length === 0"
                class="rounded-lg border border-border-light bg-white px-3 py-2 text-xs text-text-muted dark:border-border-dark dark:bg-background-dark dark:text-slate-300"
              >
                Graph view is available for valid JSON responses.
              </p>
              <div v-else class="api-graph-board">
                <section
                  v-for="(level, levelIndex) in apiResponseBrainstormLevels"
                  :key="`level-${levelIndex}`"
                  class="api-graph-level"
                >
                  <p class="api-graph-level-title">Level {{ levelIndex }}</p>
                  <article
                    v-for="node in level.nodes"
                    :key="node.id"
                    class="api-graph-node"
                    :class="{ 'is-selected': level.selectedId === node.id }"
                    role="button"
                    tabindex="0"
                    @click="selectBrainstormNode(levelIndex, node.id)"
                    @keydown.enter.prevent="selectBrainstormNode(levelIndex, node.id)"
                    @keydown.space.prevent="selectBrainstormNode(levelIndex, node.id)"
                  >
                    <p class="api-graph-node-label">{{ node.label }}</p>
                    <p class="api-graph-node-value">{{ node.value }}</p>
                    <p v-if="levelIndex > 0" class="api-graph-node-parent">from: {{ node.parentLabel }}</p>
                  </article>
                </section>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

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

:global(.analytics-pie-chart) {
  align-items: center;
  display: grid;
  gap: 1rem;
  grid-template-columns: 210px minmax(0, 1fr);
  padding: 0.25rem;
}

:global(.analytics-dual-charts) {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 1024px) {
  :global(.analytics-dual-charts) {
    grid-template-columns: 1fr 1fr;
  }
}

:global(.analytics-chart-card) {
  border: 1px solid rgb(226 232 240);
  border-radius: 0.75rem;
  padding: 0.9rem;
}

:global(.analytics-chart-title) {
  color: rgb(100 116 139);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
}

:global(.analytics-pie-circle) {
  border-radius: 9999px;
  flex: 0 0 auto;
  height: 210px;
  width: 210px;
}

:global(.analytics-doughnut-wrap) {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  position: relative;
}

:global(.analytics-doughnut-center) {
  align-items: center;
  background: rgb(255 255 255);
  border-radius: 9999px;
  display: flex;
  flex-direction: column;
  height: 118px;
  justify-content: center;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 118px;
}

:global(.analytics-doughnut-value) {
  color: rgb(15 23 42);
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1;
  margin: 0;
}

:global(.analytics-doughnut-label) {
  color: rgb(100 116 139);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  margin: 0.2rem 0 0;
  text-transform: uppercase;
}

:global(.analytics-pie-legend) {
  display: grid;
  gap: 0.55rem;
  min-width: 0;
}

:global(.analytics-pie-legend-item) {
  align-items: center;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: auto 1fr auto;
  padding: 0.15rem 0;
}

:global(.analytics-pie-dot) {
  border-radius: 9999px;
  display: inline-block;
  height: 0.62rem;
  width: 0.62rem;
}

:global(.analytics-pie-path) {
  color: rgb(15 23 42);
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.analytics-pie-meta) {
  color: rgb(100 116 139);
  font-size: 0.75rem;
  margin: 0;
  white-space: nowrap;
}

:global(.analytics-weekly-chart) {
  align-items: end;
  display: grid;
  gap: 0.6rem;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  min-height: 220px;
}

:global(.analytics-weekday-item) {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  justify-content: end;
}

:global(.analytics-weekday-bar) {
  background: linear-gradient(180deg, rgba(0, 225, 255, 0.95) 0%, rgba(34, 211, 238, 0.55) 100%);
  border-radius: 0.45rem 0.45rem 0.3rem 0.3rem;
  transition: height 0.35s ease;
  width: 100%;
}

:global(.analytics-weekday-value) {
  color: rgb(15 23 42);
  font-size: 0.72rem;
  font-weight: 700;
  margin: 0;
}

:global(.analytics-weekday-label) {
  color: rgb(100 116 139);
  font-size: 0.72rem;
  margin: 0;
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

:global(.dashboard-dialog .api-test-result-block) {
  background: rgb(248 250 252);
  border: 1px solid rgb(226 232 240);
  border-radius: 0.65rem;
  color: rgb(15 23 42);
  font-size: 0.75rem;
  line-height: 1.4;
  margin: 0;
  max-height: 240px;
  overflow: auto;
  padding: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
}

:global(.dashboard-dialog .api-graph-wrap) {
  border: 1px solid rgb(226 232 240);
  border-radius: 0.65rem;
  padding: 0.75rem;
}

:global(.dashboard-dialog .api-graph-board) {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

:global(.dashboard-dialog .api-graph-level) {
  background: rgb(248 250 252);
  border: 1px dashed rgb(203 213 225);
  border-radius: 0.65rem;
  padding: 0.55rem;
}

:global(.dashboard-dialog .api-graph-level-title) {
  color: rgb(100 116 139);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 0 0 0.45rem;
  text-transform: uppercase;
}

:global(.dashboard-dialog .api-graph-node) {
  background: rgb(255 255 255);
  border: 1px solid rgb(226 232 240);
  border-radius: 0.5rem;
  cursor: pointer;
  margin-bottom: 0.45rem;
  padding: 0.45rem 0.5rem;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

:global(.dashboard-dialog .api-graph-node:last-child) {
  margin-bottom: 0;
}

:global(.dashboard-dialog .api-graph-node:hover) {
  border-color: rgb(0 225 255);
  transform: translateY(-1px);
}

:global(.dashboard-dialog .api-graph-node.is-selected) {
  background: rgba(0, 225, 255, 0.1);
  border-color: rgb(6 182 212);
}

:global(.dashboard-dialog .api-graph-node-label) {
  color: rgb(15 23 42);
  font-size: 0.78rem;
  font-weight: 700;
  margin: 0;
  word-break: break-word;
}

:global(.dashboard-dialog .api-graph-node-value) {
  color: rgb(71 85 105);
  font-size: 0.72rem;
  margin: 0.18rem 0 0;
  word-break: break-word;
}

:global(.dashboard-dialog .api-graph-node-parent) {
  color: rgb(100 116 139);
  font-size: 0.68rem;
  margin: 0.18rem 0 0;
}

:global(.analytics-top-pages.p-datatable .p-datatable-thead > tr > th) {
  background: rgba(248, 250, 252, 0.85);
  border-color: rgb(226 232 240);
  color: rgb(100 116 139);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.85rem 1rem;
  text-transform: uppercase;
}

:global(.analytics-top-pages.p-datatable .p-datatable-wrapper) {
  background: rgb(255 255 255);
  border: 1px solid rgb(226 232 240);
  border-radius: 0.75rem;
  overflow: hidden;
}

:global(.analytics-top-pages.p-datatable .p-datatable-table) {
  width: 100%;
}

:global(.analytics-top-pages.p-datatable .p-datatable-tbody > tr > td) {
  background: rgb(255 255 255);
  border-color: rgb(226 232 240);
  color: rgb(15 23 42);
  padding: 0.9rem 1rem;
}

:global(.analytics-top-pages.p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even) > td) {
  background: rgb(248 250 252);
}

:global(.dashboard-dialog .field-input-wrap) {
  position: relative;
}

:global(.dashboard-dialog .field-icon) {
  color: rgb(100 116 139);
  left: 0.75rem;
  pointer-events: none;
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

:global(.dashboard-dialog .dashboard-input.dashboard-select.p-dropdown),
:global(.dashboard-dialog .dashboard-input.dashboard-select.p-multiselect) {
  min-height: 3rem;
}

:global(.dashboard-dialog .dashboard-input.with-icon.p-dropdown),
:global(.dashboard-dialog .dashboard-input.with-icon.p-multiselect) {
  min-height: 3rem;
}

:global(.dashboard-dialog .dashboard-input.with-icon.p-dropdown .p-dropdown-label),
:global(.dashboard-dialog .dashboard-input.with-icon.p-multiselect .p-multiselect-label) {
  padding-left: 2rem;
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

:global(html.dark .analytics-pie-chart) {
  background: transparent;
}

:global(html.dark .analytics-chart-card) {
  border-color: rgb(51 65 85);
}

:global(html.dark .analytics-chart-title) {
  color: rgb(148 163 184);
}

:global(html.dark .analytics-doughnut-center) {
  background: rgb(2 6 23);
}

:global(html.dark .analytics-doughnut-value) {
  color: rgb(241 245 249);
}

:global(html.dark .analytics-doughnut-label) {
  color: rgb(148 163 184);
}

:global(html.dark .analytics-pie-path) {
  color: rgb(241 245 249);
}

:global(html.dark .analytics-pie-meta) {
  color: rgb(148 163 184);
}

:global(html.dark .analytics-weekday-value) {
  color: rgb(241 245 249);
}

:global(html.dark .analytics-weekday-label) {
  color: rgb(148 163 184);
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

:global(.dashboard-dialog input.p-inputtext),
:global(.dashboard-dialog textarea.p-inputtextarea),
:global(.dashboard-dialog .p-dropdown),
:global(.dashboard-dialog .p-multiselect) {
  background: rgb(255 255 255);
  border: 1px solid rgb(203 213 225);
  border-radius: 0.65rem;
  color: rgb(15 23 42);
  width: 100%;
}

:global(.dashboard-dialog input.p-inputtext:enabled:focus),
:global(.dashboard-dialog textarea.p-inputtextarea:enabled:focus),
:global(.dashboard-dialog .p-dropdown:not(.p-disabled).p-focus),
:global(.dashboard-dialog .p-multiselect:not(.p-disabled).p-focus) {
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

:global(html.dark .dashboard-dialog input.p-inputtext),
:global(html.dark .dashboard-dialog textarea.p-inputtextarea),
:global(html.dark .dashboard-dialog .p-dropdown),
:global(html.dark .dashboard-dialog .p-multiselect) {
  background: rgb(2 6 23);
  border-color: rgb(51 65 85);
  color: rgb(248 250 252);
}

:global(html.dark .dashboard-dialog .field-icon) {
  color: rgb(148 163 184);
}

:global(html.dark .dashboard-dialog .api-test-result-block) {
  background: rgb(2 6 23);
  border-color: rgb(51 65 85);
  color: rgb(226 232 240);
}

:global(html.dark .dashboard-dialog .api-graph-wrap) {
  border-color: rgb(51 65 85);
}

:global(html.dark .dashboard-dialog .api-graph-level) {
  background: rgb(2 6 23);
  border-color: rgb(71 85 105);
}

:global(html.dark .dashboard-dialog .api-graph-level-title) {
  color: rgb(148 163 184);
}

:global(html.dark .dashboard-dialog .api-graph-node) {
  background: rgb(15 23 42);
  border-color: rgb(51 65 85);
}

:global(html.dark .dashboard-dialog .api-graph-node:hover) {
  border-color: rgb(34 211 238);
}

:global(html.dark .dashboard-dialog .api-graph-node.is-selected) {
  background: rgba(34, 211, 238, 0.14);
  border-color: rgb(34 211 238);
}

:global(html.dark .dashboard-dialog .api-graph-node-label) {
  color: rgb(241 245 249);
}

:global(html.dark .dashboard-dialog .api-graph-node-value) {
  color: rgb(148 163 184);
}

:global(html.dark .dashboard-dialog .api-graph-node-parent) {
  color: rgb(100 116 139);
}

:global(html.dark .analytics-top-pages.p-datatable .p-datatable-thead > tr > th) {
  background: rgba(2, 6, 23, 0.88);
  border-color: rgb(51 65 85);
  color: rgb(148 163 184);
}

:global(html.dark .analytics-top-pages.p-datatable .p-datatable-wrapper) {
  background: rgb(2 6 23);
  border-color: rgb(51 65 85);
}

:global(html.dark .analytics-top-pages.p-datatable .p-datatable-tbody > tr > td) {
  background: rgb(2 6 23);
  border-color: rgb(51 65 85);
  color: rgb(226 232 240);
}

:global(html.dark .analytics-top-pages.p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even) > td) {
  background: rgb(15 23 42);
}

:global(html.dark .dashboard-dialog input.p-inputtext:enabled:focus),
:global(html.dark .dashboard-dialog textarea.p-inputtextarea:enabled:focus),
:global(html.dark .dashboard-dialog .p-dropdown:not(.p-disabled).p-focus),
:global(html.dark .dashboard-dialog .p-multiselect:not(.p-disabled).p-focus) {
  border-color: rgb(0 225 255);
  box-shadow: 0 0 0 0.2rem rgba(0, 225, 255, 0.16);
}
</style>
