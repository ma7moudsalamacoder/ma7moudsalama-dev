import { logEvent } from 'firebase/analytics'
import { ref as dbRef, runTransaction, update } from 'firebase/database'

import { analytics, database } from '@/lib/firebase'

const VISITOR_KEY = 'ms_portfolio_visitor_id'
const ANALYTICS_ROOT = 'websiteAnalytics'

function createVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function getVisitorId() {
  if (typeof window === 'undefined') return 'unknown'

  const existing = localStorage.getItem(VISITOR_KEY)
  if (existing) return existing

  const next = createVisitorId()
  localStorage.setItem(VISITOR_KEY, next)
  return next
}

export async function trackWebsiteVisit(path: string) {
  if (typeof window === 'undefined') return

  const normalizedPath = path || '/'
  const pathKey = encodeURIComponent(normalizedPath)
  const visitorId = getVisitorId()
  const now = Date.now()

  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: normalizedPath,
    })
  }

  const totalViewsRef = dbRef(database, `${ANALYTICS_ROOT}/summary/totalPageViews`)
  const pathViewsRef = dbRef(database, `${ANALYTICS_ROOT}/summary/paths/${pathKey}`)
  const visitorRef = dbRef(database, `${ANALYTICS_ROOT}/visitors/${visitorId}`)
  const summaryRef = dbRef(database, `${ANALYTICS_ROOT}/summary`)

  await Promise.all([
    runTransaction(totalViewsRef, (value) => (typeof value === 'number' ? value + 1 : 1)),
    runTransaction(pathViewsRef, (value) => (typeof value === 'number' ? value + 1 : 1)),
    runTransaction(visitorRef, (value) => {
      if (value && typeof value === 'object') {
        const current = value as Record<string, unknown>
        const currentCount = Number(current.visitCount ?? 0)

        return {
          ...current,
          visitCount: currentCount + 1,
          lastSeenAt: now,
          lastPath: normalizedPath,
        }
      }

      return {
        firstSeenAt: now,
        lastSeenAt: now,
        visitCount: 1,
        lastPath: normalizedPath,
      }
    }),
    update(summaryRef, {
      lastVisitedAt: now,
      lastVisitedPath: normalizedPath,
      updatedAt: now,
    }),
  ])
}
