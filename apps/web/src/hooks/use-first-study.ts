"use client"

const STORAGE_KEY = "athora_first_study_done"

/**
 * Marks that the user has completed their first study action.
 * Call this after flashcard review, exam submission, or content generation.
 */
export function markFirstStudyDone(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, "true")
  } catch {
    // Storage full or unavailable — non-critical
  }
}

/**
 * Returns whether the user has completed at least one study action.
 */
export function hasCompletedFirstStudy(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}
