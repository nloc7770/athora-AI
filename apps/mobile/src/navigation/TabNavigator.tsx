import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { Colors } from '@/constants/colors'
import {
  FlashcardsScreen,
  HomeScreen,
  LibraryScreen,
  ProfileScreen,
  TutorScreen,
} from '@/screens'

const Tab = createBottomTabNavigator()

type IconName = keyof typeof Ionicons.glyphMap

const TABS = [
  { name: 'Home', label: 'Trang chủ', component: HomeScreen, icon: 'home-outline' },
  { name: 'Library', label: 'Tài liệu', component: LibraryScreen, icon: 'library-outline' },
  { name: 'Tutor', label: 'Gia sư', component: TutorScreen, icon: 'sparkles-outline' },
  {
    name: 'Flashcards',
    label: 'Thẻ ghi nhớ',
    component: FlashcardsScreen,
    icon: 'albums-outline',
  },
  { name: 'Profile', label: 'Cá nhân', component: ProfileScreen, icon: 'person-outline' },
] as const satisfies ReadonlyArray<{
  name: string
  label: string
  component: React.ComponentType
  icon: IconName
}>

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  )
}
