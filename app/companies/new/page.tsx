'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCompanyPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/companies?new=1')
  }, [router])
  return null
}
