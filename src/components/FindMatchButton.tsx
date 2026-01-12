'use client'

import { useState } from 'react'
import FindMatchModal from './FindMatchModal'

interface FindMatchButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function FindMatchButton({ className = '', children }: FindMatchButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        {children || 'Find Your Match'}
      </button>

      <FindMatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
