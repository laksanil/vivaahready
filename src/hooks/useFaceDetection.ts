'use client'

import { useState, useCallback, useEffect } from 'react'
import { loadFaceDetectionModels, validateProfilePhoto } from '@/lib/faceDetection'

interface FaceDetectionResult {
  isValid: boolean
  message: string
}

interface UseFaceDetectionReturn {
  isLoading: boolean
  isModelLoaded: boolean
  validatePhoto: (file: File) => Promise<FaceDetectionResult>
  result: FaceDetectionResult | null
  clearResult: () => void
}

export function useFaceDetection(): UseFaceDetectionReturn {
  const bypassFaceValidation = process.env.NEXT_PUBLIC_E2E_TEST === 'true'
  const [isLoading, setIsLoading] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(bypassFaceValidation)
  const [result, setResult] = useState<FaceDetectionResult | null>(null)

  // Preload models on mount
  useEffect(() => {
    if (bypassFaceValidation) {
      setIsModelLoaded(true)
      return
    }
    loadFaceDetectionModels().then(loaded => {
      setIsModelLoaded(loaded)
    })
  }, [bypassFaceValidation])

  const validatePhoto = useCallback(async (file: File): Promise<FaceDetectionResult> => {
    if (bypassFaceValidation) {
      const validationResult = { isValid: true, message: 'Photo accepted' }
      setResult(validationResult)
      return validationResult
    }

    setIsLoading(true)
    setResult(null)

    try {
      const validationResult = await validateProfilePhoto(file)
      setResult(validationResult)
      return validationResult
    } finally {
      setIsLoading(false)
    }
  }, [bypassFaceValidation])

  const clearResult = useCallback(() => {
    setResult(null)
  }, [])

  return {
    isLoading,
    isModelLoaded,
    validatePhoto,
    result,
    clearResult
  }
}
