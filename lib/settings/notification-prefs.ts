export interface NotificationPrefs {
  /** Product & account emails (receipts, security). */
  emailUpdates: boolean
  /** Email when a candidate completes one of your tests. */
  candidateCompleted: boolean
  /** Email when teammates are invited or join. */
  teamActivity: boolean
  /** Weekly summary of assessment activity. */
  weeklyDigest: boolean
  /** Occasional product news and tips. */
  productNews: boolean
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailUpdates: true,
  candidateCompleted: true,
  teamActivity: true,
  weeklyDigest: false,
  productNews: true,
}

const STORAGE_KEY = "vertana-notification-prefs"

export function readNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_NOTIFICATION_PREFS
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>
    return { ...DEFAULT_NOTIFICATION_PREFS, ...parsed }
  } catch {
    return DEFAULT_NOTIFICATION_PREFS
  }
}

export function writeNotificationPrefs(prefs: NotificationPrefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore quota / private mode
  }
}
