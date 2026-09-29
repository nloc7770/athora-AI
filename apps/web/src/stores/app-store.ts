import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  activeCourse: string | null
  activeDocument: string | null
  searchQuery: string
  setSidebarOpen: (open: boolean) => void
  setActiveCourse: (courseId: string | null) => void
  setActiveDocument: (docId: string | null) => void
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Drives the mobile nav sheet only. The desktop sidebar is always visible
  // (`hidden lg:flex`), so defaulting this to true left the sheet — and its
  // full-viewport backdrop, which swallows every click — open on desktop on
  // every load, with no visible control to close it.
  sidebarOpen: false,
  activeCourse: null,
  activeDocument: null,
  searchQuery: '',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveCourse: (courseId) => set({ activeCourse: courseId }),
  setActiveDocument: (docId) => set({ activeDocument: docId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
