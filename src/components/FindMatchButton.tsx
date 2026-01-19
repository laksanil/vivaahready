'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import FindMatchModal from './FindMatchModal'
import { isTestMode } from '@/lib/testMode'

interface FindMatchButtonProps {
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
  children?: React.ReactNode
  showArrow?: boolean
}

export default function FindMatchButton({
  variant = 'primary',
  className = '',
  children,
  showArrow = true
}: FindMatchButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!isTestMode) return
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('e2eOpenModal') === '1') {
      setIsModalOpen(true)
    }
  }, [])

  const variantStyles = {
    primary: 'bg-primary-600 text-white px-8 py-3.5 rounded-lg font-semibold text-lg shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center',
    secondary: 'btn-primary w-full flex items-center justify-center py-3',
    white: 'bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-flex items-center',
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className || variantStyles[variant]}
      >
        {children || 'Find My Match'}
        {showArrow && <ArrowRight className="ml-2 h-5 w-5" />}
      </button>

      <FindMatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
