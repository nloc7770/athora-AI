# Mobile Guide — Athora (Expo)

## Tech Stack

| Layer | Library | Version |
|-------|---------|---------|
| Framework | Expo | 56 |
| UI | React Native | 0.85 |
| Language | TypeScript | 6.x |
| Runtime | React | 19.2 |

---

## Project Structure

```
apps/mobile/
├── App.tsx                  # Entry point (default Expo boilerplate)
├── index.ts                 # Expo entry registration
├── app.json                 # Expo config (name, icons, splash)
├── package.json             # Dependencies and scripts
├── tsconfig.json
├── assets/
│   ├── icon.png
│   ├── favicon.png
│   ├── splash-icon.png
│   ├── android-icon-foreground.png
│   ├── android-icon-background.png
│   └── android-icon-monochrome.png
└── src/
    ├── constants/
    │   └── colors.ts        # Design tokens (palette)
    └── screens/
        ├── index.ts         # Barrel exports
        ├── HomeScreen.tsx
        ├── LibraryScreen.tsx
        ├── FlashcardsScreen.tsx
        ├── TutorScreen.tsx
        └── ProfileScreen.tsx
```

---

## Screens

| Screen | File | Planned Purpose |
|--------|------|-----------------|
| `HomeScreen` | `src/screens/HomeScreen.tsx` | Dashboard — courses, progress, quick actions |
| `LibraryScreen` | `src/screens/LibraryScreen.tsx` | Document list with upload capability |
| `FlashcardsScreen` | `src/screens/FlashcardsScreen.tsx` | Swipe-based flashcard review |
| `TutorScreen` | `src/screens/TutorScreen.tsx` | Voice/chat AI tutor |
| `ProfileScreen` | `src/screens/ProfileScreen.tsx` | User settings, subscription, stats |

---

## Navigation Plan

The app is designed for a bottom tab navigator with 5 tabs:

```
TabNavigator
├── Home (HomeScreen)
├── Library (LibraryScreen)
├── Tutor (TutorScreen)      # Center/featured tab
├── Flashcards (FlashcardsScreen)
└── Profile (ProfileScreen)
```

Navigation library is not yet installed. Recommended: `@react-navigation/native` + `@react-navigation/bottom-tabs` (or Expo Router if migrating to file-based routing).

---

## Design Tokens

Defined in `src/constants/colors.ts`:

```typescript
export const Colors = {
  primary: '#0B0F1A',        // Near-black for headers/nav
  accent: '#F59E0B',         // Amber — matches web CTA color
  background: '#FFFFFF',     // White background
  text: '#18181B',           // zinc-900 equivalent
  textSecondary: '#71717A',  // zinc-500 equivalent
  border: '#E4E4E7',         // zinc-200 equivalent
  success: '#10B981',        // emerald-500
  error: '#EF4444',          // red-500
}
```

These align with the web app's Tailwind palette for cross-platform consistency.

---

## Shared Types Usage

The web app defines mock data interfaces in `apps/web/src/data/mock.ts`:

- `Course`
- `Document`
- `Message`
- `Flashcard`

To share these types across web and mobile, extract them to a shared package (e.g., `packages/types/`) in the monorepo. Currently they are only in the web app.

---

## How to Run

### Prerequisites

- Node.js 18+
- pnpm (workspace root uses pnpm)
- Xcode (iOS simulator) or Android Studio (Android emulator)
- Expo Go app on physical device (optional)

### Commands

```bash
cd apps/mobile

# Start Expo dev server (interactive menu)
pnpm start

# Launch directly on iOS simulator
pnpm ios

# Launch directly on Android emulator
pnpm android

# Launch web preview
pnpm web
```

### iOS Simulator

1. Install Xcode from the Mac App Store
2. Open Xcode > Settings > Platforms > install an iOS simulator runtime
3. Run `pnpm ios` — Expo will find and boot the default simulator

### Android Emulator

1. Install Android Studio
2. Open AVD Manager, create a virtual device (Pixel 7 + latest API recommended)
3. Start the emulator
4. Run `pnpm android`

### Physical Device

1. Install "Expo Go" from the App Store / Play Store
2. Run `pnpm start`
3. Scan the QR code with your device camera

---

## Current State vs Planned Features

### Current State (Scaffolding)

- Expo 56 project initialized with TypeScript
- 5 placeholder screens with minimal boilerplate (just a centered text label)
- Color constants defined
- App.tsx still shows default Expo template
- No navigation library installed
- No shared types package
- No API integration

### Planned Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Bottom tab navigation | P0 | Install react-navigation or adopt Expo Router |
| Home dashboard | P0 | Course cards, study streak, recent docs |
| Document library | P0 | List documents, open viewer |
| Flashcard review | P1 | Swipe gestures, spaced repetition |
| AI Tutor chat | P1 | Text + voice input, streaming responses |
| Document upload | P1 | Camera capture + file picker |
| Push notifications | P2 | Study reminders, card due alerts |
| Offline mode | P2 | Cache flashcards locally |
| Profile & settings | P2 | Subscription management, preferences |
| Audio playback | P2 | In-app audio document player |
| Exam mode | P3 | Timed quizzes on mobile |

### Migration Notes

- The web app uses `framer-motion` — mobile equivalent is `react-native-reanimated`
- Web UI uses shadcn/Tailwind — mobile should use a comparable design system (e.g., custom components matching the same tokens)
- Consider Expo Router for file-based routing consistency with Next.js App Router
