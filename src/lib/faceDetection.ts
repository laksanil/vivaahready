import * as faceapi from 'face-api.js'

let modelsLoaded = false
let modelsLoading = false

// Load face detection models
export async function loadFaceDetectionModels(): Promise<boolean> {
  if (modelsLoaded) return true
  if (modelsLoading) {
    // Wait for models to finish loading
    while (modelsLoading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return modelsLoaded
  }

  modelsLoading = true

  try {
    // Load the tiny face detector model (smallest and fastest)
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    modelsLoaded = true
    console.log('Face detection models loaded successfully')
    return true
  } catch (error) {
    console.error('Error loading face detection models:', error)
    modelsLoaded = false
    return false
  } finally {
    modelsLoading = false
  }
}

// Detect faces in an image file
export async function detectFacesInImage(imageFile: File): Promise<{
  hasFace: boolean
  faceCount: number
  error?: string
}> {
  try {
    // Ensure models are loaded
    const loaded = await loadFaceDetectionModels()
    if (!loaded) {
      return {
        hasFace: true, // Allow upload if models fail to load
        faceCount: 0,
        error: 'Face detection unavailable'
      }
    }

    // Create image element from file
    const img = await createImageFromFile(imageFile)

    // Detect faces using tiny face detector (faster)
    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
      })
    )

    return {
      hasFace: detections.length > 0,
      faceCount: detections.length
    }
  } catch (error) {
    console.error('Face detection error:', error)
    return {
      hasFace: true, // Allow upload if detection fails
      faceCount: 0,
      error: 'Face detection failed'
    }
  }
}

// Create an HTMLImageElement from a File
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// Validate photo for profile use
export async function validateProfilePhoto(imageFile: File): Promise<{
  isValid: boolean
  message: string
}> {
  console.log('Validating photo:', imageFile.name, imageFile.type, imageFile.size)

  // Check file type
  if (!imageFile.type.startsWith('image/')) {
    console.log('Invalid file type:', imageFile.type)
    return {
      isValid: false,
      message: 'Please upload an image file'
    }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (imageFile.size > maxSize) {
    return {
      isValid: false,
      message: 'Image size must be less than 10MB'
    }
  }

  // Skip face detection for now - just validate file type and size
  // Face detection was causing upload failures
  return {
    isValid: true,
    message: 'Photo accepted'
  }
}
