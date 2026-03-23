import { Suspense } from 'react'
import TopBar from '@/components/layout/TopBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Suspense fallback={
        <div className="flex-shrink-0 bg-white border-b border-gray-200 h-[88px]" />
      }>
        <TopBar />
      </Suspense>
      <main className="flex-1 overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  )
}
