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
  const [isLoading, setIsLoading] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [result, setResult] = useState<FaceDetectionResult | null>(null)

  // Preload models on mount
  useEffect(() => {
    loadFaceDetectionModels().then(loaded => {
      setIsModelLoaded(loaded)
    })
  }, [])

  const validatePhoto = useCallback(async (file: File): Promise<FaceDetectionResult> => {
    setIsLoading(true)
    setResult(null)

    try {
      const validationResult = await validateProfilePhoto(file)
      setResult(validationResult)
      return validationResult
    } finally {
      setIsLoading(false)
    }
  }, [])

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
