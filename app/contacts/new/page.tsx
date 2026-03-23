'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirects to /contacts and signals to open the add form
export default function NewContactPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/contacts?new=1')
  }, [router])
  return null
}
