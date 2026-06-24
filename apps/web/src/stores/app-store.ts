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
  sidebarOpen: true,
  activeCourse: null,
  activeDocument: null,
  searchQuery: '',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveCourse: (courseId) => set({ activeCourse: courseId }),
  setActiveDocument: (docId) => set({ activeDocument: docId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
