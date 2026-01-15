'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Camera, Upload, Trash2, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function PhotosUploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const profileId = searchParams.get('profileId')
  const fromSignup = searchParams.get('fromSignup') === 'true'

  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [photoVisibility, setPhotoVisibility] = useState('verified_only')
  const [loading, setLoading] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (!profileId && status === 'authenticated') {
      // If no profileId provided, redirect to dashboard
      router.push('/dashboard')
    }
  }, [profileId, status, router])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos: { file: File; preview: string }[] = []
    Array.from(files).forEach((file) => {
      if (photos.length + newPhotos.length < 6) {
        newPhotos.push({
          file,
          preview: URL.createObjectURL(file),
        })
      }
    })
    setPhotos((prev) => [...prev, ...newPhotos])
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const handlePhotoSubmit = async () => {
    if (!profileId) {
      setError('Profile not found. Please try again.')
      return
    }

    if (photos.length === 0) {
      setError('Please upload at least one photo to continue.')
      return
    }

    setError('')
    setLoading(true)
    setUploadingPhotos(true)

    try {
      // Upload photos
      for (const photo of photos) {
        const photoFormData = new FormData()
        photoFormData.append('file', photo.file)
        photoFormData.append('profileId', profileId)

        await fetch('/api/profile/upload-photo', {
          method: 'POST',
          body: photoFormData,
        })
      }

      // Update photo visibility setting
      await fetch('/api/profile/update-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          photoVisibility,
        }),
      })

      // Redirect to dashboard with success message
      router.push('/dashboard?status=pending')
    } catch {
      setError('Failed to upload photos. Please try again.')
    } finally {
      setLoading(false)
      setUploadingPhotos(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          {!fromSignup && (
            <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {fromSignup ? 'Almost Done! Add Your Photos' : 'Upload Photos'}
          </h1>
          <p className="text-gray-600 mt-1">
            A profile photo is required to view and connect with matches.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-10 w-10 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Upload Your Photo
            </h3>
            <p className="text-gray-600">
              Add up to 6 photos. Your first photo will be your primary profile picture.
            </p>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Uploaded Photos */}
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square overflow-hidden border-2 border-primary-500 bg-gray-100 rounded-lg">
                <Image
                  src={photo.preview}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary-500 text-white text-xs py-1 text-center">
                    Primary Photo
                  </div>
                )}
              </div>
            ))}

            {/* Add Photo Buttons */}
            {Array.from({ length: Math.max(0, 6 - photos.length) }).map((_, index) => (
              <button
                key={`empty-${index}`}
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                  photos.length === 0 && index === 0
                    ? 'border-primary-400 bg-primary-50 hover:bg-primary-100'
                    : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
                }`}
              >
                <Upload className={`h-6 w-6 mb-1 ${photos.length === 0 && index === 0 ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className={`text-xs ${photos.length === 0 && index === 0 ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                  {photos.length === 0 && index === 0 ? 'Add Photo *' : 'Add Photo'}
                </span>
              </button>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-primary-500 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="h-5 w-5" />
            Upload from Device
          </button>

          {/* Photo Visibility Options */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Photo Privacy Settings</h4>
            <p className="text-sm text-gray-500 mb-4">Choose who can view your photos:</p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="photoVisibility"
                  value="verified_only"
                  checked={photoVisibility === 'verified_only'}
                  onChange={(e) => setPhotoVisibility(e.target.value)}
                  className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Verified Members Only</span>
                  <p className="text-sm text-gray-500">Your photos will only be visible to members with verified profiles</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="photoVisibility"
                  value="matching_preferences"
                  checked={photoVisibility === 'matching_preferences'}
                  onChange={(e) => setPhotoVisibility(e.target.value)}
                  className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Matching Profiles Only</span>
                  <p className="text-sm text-gray-500">Your photos will be visible to members whose preferences align with your profile</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="photoVisibility"
                  value="mutual_interest"
                  checked={photoVisibility === 'mutual_interest'}
                  onChange={(e) => setPhotoVisibility(e.target.value)}
                  className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-900">After Mutual Interest</span>
                  <p className="text-sm text-gray-500">Your photos will only be revealed after both parties express interest</p>
                </div>
              </label>
            </div>
          </div>

          {/* Photo Guidelines */}
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Photo Guidelines</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Use a recent, clear photograph of yourself
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Ensure your face is clearly visible
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Avoid group photos or images with accessories obscuring your face
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              onClick={handlePhotoSubmit}
              disabled={loading || photos.length === 0}
              className={`w-full py-3.5 rounded-lg font-semibold text-lg shadow-lg transition-all ${
                !loading && photos.length > 0
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  {uploadingPhotos ? 'Uploading Photos...' : 'Processing...'}
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>
            {photos.length === 0 && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Please upload at least one photo to complete your registration
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PhotosUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <PhotosUploadContent />
    </Suspense>
  )
}
