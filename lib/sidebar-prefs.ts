const STORAGE_KEY = "vertana-sidebar-collapsed"

export function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function writeSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0")
  } catch {
    // ignore quota / private mode
  }
}
