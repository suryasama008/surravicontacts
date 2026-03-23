'use client'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
const Client = dynamic(() => import('@/components/import/ImportClient'), { ssr: false })
export default function Page() {
  return <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>}><Client /></Suspense>
}
