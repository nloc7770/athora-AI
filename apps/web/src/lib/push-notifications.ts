const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    return registration
  } catch {
    return null
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return null

  try {
    const registration = await registerServiceWorker()
    if (!registration) return null

    // Check existing subscription
    const existing = await registration.pushManager.getSubscription()
    if (existing) return existing

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    // Send subscription to backend
    await sendSubscriptionToServer(subscription)

    return subscription
  } catch {
    return null
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      await removeSubscriptionFromServer(subscription)
    }
    return true
  } catch {
    return false
  }
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const { apiClient } = await import('@/lib/api')
  await apiClient.post('/notifications/subscribe', {
    subscription: subscription.toJSON(),
  })
}

async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  const { apiClient } = await import('@/lib/api')
  await apiClient.post('/notifications/unsubscribe', {
    endpoint: subscription.endpoint,
  })
}

/**
 * Request push permission after a positive user action (e.g., first flashcard review).
 * Returns true if subscription was successful.
 */
export async function requestPushAfterEngagement(): Promise<boolean> {
  const permission = getPermissionState()

  // Don't ask if already granted or explicitly denied
  if (permission === 'granted' || permission === 'denied' || permission === 'unsupported') {
    return permission === 'granted'
  }

  const subscription = await subscribeToPush()
  return subscription !== null
}
