/** Server-side: enable camera snapshot step for proctored tests. */
export function isCameraProctoringEnabled(): boolean {
  return process.env.PROCTORING_CAMERA_ENABLED === "true"
}

/** Client-side mirror — set NEXT_PUBLIC_PROCTORING_CAMERA_ENABLED=true to match. */
export function isCameraProctoringEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_PROCTORING_CAMERA_ENABLED === "true"
}

export const PROCTORING_RETENTION_DAYS = 90
