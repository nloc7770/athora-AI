import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { Colors } from '@/constants/colors'
import { Radius, Spacing } from '@/constants/spacing'

const QUICK_STATS = [
  { label: 'Ngày streak', value: '0' },
  { label: 'Thẻ cần học', value: '0' },
  { label: 'Tài liệu', value: '0' },
] as const

export function HomeScreen() {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      accessibilityLabel="Trang chủ Athora"
    >
      <Text style={styles.greeting}>Chào bạn</Text>
      <Text style={styles.subtitle}>Hôm nay học gì nào?</Text>

      <View style={styles.statRow}>
        {QUICK_STATS.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Tiếp tục học</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Chưa có khoá học nào. Tải tài liệu lên để bắt đầu.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.accent,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  placeholder: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
})
