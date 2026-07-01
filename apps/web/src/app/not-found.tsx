import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <img
          src="/images/states/error-404.webp"
          alt=""
          className="mx-auto mb-6 h-40 w-40 object-contain"
        />
        <h1 className="text-xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/dashboard" className={buttonVariants({ className: 'mt-6' })}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
