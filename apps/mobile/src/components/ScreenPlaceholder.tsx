import { StyleSheet, Text, View } from 'react-native'

import { Colors } from '@/constants/colors'
import { Radius, Spacing } from '@/constants/spacing'

type ScreenPlaceholderProps = {
  title: string
  description: string
}

/**
 * Shared shell for screens whose features are not built yet.
 * Keeps every stub visually consistent with the design tokens.
 */
export function ScreenPlaceholder({ title, description }: ScreenPlaceholderProps) {
  return (
    <View style={styles.root} accessibilityLabel={title}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  description: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
})
