"use client"

import {useCallback, useRef, useState, useEffect} from "react"
import * as THREE from "three"
import Image from "next/image"
import {H3, P} from "@/components/ui/Typography"
import {Icon} from "@/components/ui/Icon"

// OpenCV will be loaded from window.cv
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cv: any
    onOpenCvReady: () => void
  }
}

interface ImageTo3DProps {
  onAddToScene: (geometry: THREE.BufferGeometry, name: string) => void
}

export default function ImageTo3D({ onAddToScene }: ImageTo3DProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cvReady, setCvReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Wait for OpenCV to load
  useEffect(() => {
    // Only load OpenCV once per page load
    if (cvReady || document.querySelector('script[src*="opencv.js"]')) {
      return
    }

    const loadOpenCV = async () => {
      try {
        // Check if OpenCV is already loaded
        if (window.cv && window.cv.Mat) {
          console.log('OpenCV already loaded')
          setCvReady(true)
          return
        }

        // Check if script is already in document
        const existingScript = document.querySelector('script[src*="opencv.js"]')
        if (existingScript) {
          console.log('OpenCV script already in document, waiting for load...')
          return
        }

        // Load OpenCV from CDN
        const script = document.createElement('script')
        script.src = 'https://docs.opencv.org/4.5.2/opencv.js'
        script.async = true
        script.onload = () => {
          console.log('OpenCV loaded successfully from CDN')
          setCvReady(true)
        }
        script.onerror = () => {
          console.error('Failed to load OpenCV from CDN')
          setError('OpenCV kon niet worden geladen van CDN')
        }
        document.head.appendChild(script)
      } catch (err) {
        console.error('Failed to load OpenCV:', err)
        setError('OpenCV kon niet worden geladen')
      }
    }

    loadOpenCV()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - this effect should only run once on mount

  const processImage = useCallback(async (file: File) => {
    if (!cvReady) {
      setError("OpenCV is nog niet klaar. Probeer opnieuw.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      console.log('Starting image processing for file:', file.name)
      const domImg = document.createElement('img')
      const canvas = canvasRef.current!

      await new Promise((resolve, reject) => {
        domImg.onload = () => {
          console.log('Image loaded, dimensions:', domImg.width, 'x', domImg.height)
          resolve(void 0)
        }
        domImg.onerror = reject
        domImg.src = URL.createObjectURL(file)
      })

      // Resize image for processing (max 512x512 for performance)
      const maxSize = 512
      const resizeScale = Math.min(maxSize / domImg.width, maxSize / domImg.height, 1)
      const width = Math.floor(domImg.width * resizeScale)
      const height = Math.floor(domImg.height * resizeScale)

      console.log('Resized to:', width, 'x', height, 'scale:', resizeScale)

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")!
      ctx.drawImage(domImg, 0, 0, width, height)

      // Convert canvas to OpenCV Mat
      const imageData = ctx.getImageData(0, 0, width, height)
      const src = window.cv.matFromImageData(imageData)

      // Convert to grayscale
      console.log('Converting to grayscale...')
      const gray = new window.cv.Mat()
      window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY)

      // Apply bilateral filter to smooth while preserving edges
      console.log('Applying bilateral filter...')
      const blurred = new window.cv.Mat()
      window.cv.bilateralFilter(gray, blurred, 9, 75, 75)

      // Apply Canny edge detection
      console.log('Applying Canny edge detection...')
      const edges = new window.cv.Mat()
      window.cv.Canny(blurred, edges, 50, 150)

      // Dilate to connect nearby edges
      console.log('Dilating edges...')
      const dilated = new window.cv.Mat()
      const kernel = window.cv.getStructuringElement(window.cv.MORPH_ELLIPSE, new window.cv.Size(5, 5))
      window.cv.dilate(edges, dilated, kernel, new window.cv.Point(-1, -1), 2)

      // Find contours
      console.log('Finding contours...')
      const contours = new window.cv.MatVector()
      const hierarchy = new window.cv.Mat()
      window.cv.findContours(dilated, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE)

      console.log('Found', contours.size(), 'contours')

      if (contours.size() === 0) {
        throw new Error("Geen objecten gevonden in de afbeelding. Probeer een afbeelding met duidelijker randen.")
      }

      // Find the largest contour
      let largestContourIdx = 0
      let largestContourArea = 0

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i)
        const area = window.cv.contourArea(contour)
        if (area > largestContourArea) {
          largestContourArea = area
          largestContourIdx = i
        }
        contour.delete()
      }

      console.log('Largest contour area:', largestContourArea)

      // Approximate the largest contour with Douglas-Peucker
      console.log('Approximating contour with Douglas-Peucker...')
      const largestContour = contours.get(largestContourIdx)
      console.log('Raw contour has', largestContour.rows, 'points')

      // DEBUG: Log raw OpenCV contour data
      console.log('Raw OpenCV contour data (first 10 points):')
      for (let i = 0; i < Math.min(10, largestContour.rows); i++) {
        const ptr = largestContour.intPtr(i)
        const x = ptr[0]
        const y = ptr[1]
        console.log(`Point ${i}: (${x}, ${y})`)
      }

      // Skip Douglas-Peucker for now to see raw contour
      const approxContour = largestContour.clone() // Use raw contour instead of approximated

      // Convert OpenCV contour to Three.js Vector2 array
      const contourPoints: THREE.Vector2[] = []
      for (let i = 0; i < approxContour.rows; i++) {
        const ptr = approxContour.intPtr(i)
        const rawX = ptr[0]
        const rawY = ptr[1]
        const x = rawX / width - 0.5
        const y = -(rawY / height - 0.5)

        console.log(`Converting point ${i}: (${rawX}, ${rawY}) -> (${x.toFixed(3)}, ${y.toFixed(3)})`)
        contourPoints.push(new THREE.Vector2(x, y))
      }

      console.log('Extracted', contourPoints.length, 'contour points')
      console.log('First few points:', contourPoints.slice(0, 5).map(p => `(${p.x.toFixed(3)}, ${p.y.toFixed(3)})`))

      if (contourPoints.length < 5) {
        throw new Error("Object te klein. Probeer een grotere of duidelijker afbeelding.")
      }

      // Ensure the contour is closed (first and last points should be the same)
      if (contourPoints.length > 0 && !contourPoints[0].equals(contourPoints[contourPoints.length - 1])) {
        console.log('Closing contour by adding first point to end')
        contourPoints.push(contourPoints[0].clone())
      }

      console.log('Final contour points:', contourPoints.length)
      console.log('Shape bounds check:')
      const minX = Math.min(...contourPoints.map(p => p.x))
      const maxX = Math.max(...contourPoints.map(p => p.x))
      const minY = Math.min(...contourPoints.map(p => p.y))
      const maxY = Math.max(...contourPoints.map(p => p.y))
      console.log(`X range: ${minX.toFixed(3)} to ${maxX.toFixed(3)}, Y range: ${minY.toFixed(3)} to ${maxY.toFixed(3)}`)

      // Clean up OpenCV Mats
      src.delete()
      gray.delete()
      blurred.delete()
      edges.delete()
      dilated.delete()
      kernel.delete()
      hierarchy.delete()
      largestContour.delete()
      approxContour.delete()
      contours.delete()

      // Create 3D geometry from contours
      console.log('Creating 3D geometry from', contourPoints.length, 'contour points')

      let geometry: THREE.ExtrudeGeometry
      try {
        const shape = new THREE.Shape(contourPoints)
        console.log('Shape created successfully')

        // Try without beveling first
        geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.2, // Increased depth
          bevelEnabled: false, // Disable beveling
        })
        console.log('ExtrudeGeometry created successfully (no beveling)')

        // If that didn't work, try with minimal beveling
        if (geometry.attributes.position.count === 0) {
          console.log('Trying with minimal beveling...')
          geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.001,
            bevelSize: 0.001,
            bevelSegments: 1,
          })
          console.log('ExtrudeGeometry created with minimal beveling')
        }
      } catch (shapeError) {
        console.error('Failed to create shape/geometry:', shapeError)
        // Fallback: create a simple box as test
        console.log('Creating fallback box geometry...')
        geometry = new THREE.BoxGeometry(1, 1, 0.2) as unknown as THREE.ExtrudeGeometry
        throw new Error("Kon geen geldige 3D vorm maken van de contour. Probeer een afbeelding met duidelijker object randen.")
      }

      console.log('Geometry created with', geometry.attributes.position.count, 'vertices')

      if (geometry.attributes.position.count === 0) {
        console.error('Geometry still has 0 vertices, creating fallback box')
        geometry = new THREE.BoxGeometry(1, 1, 0.2) as unknown as THREE.ExtrudeGeometry
        console.log('Fallback box created with', geometry.attributes.position.count, 'vertices')
      }

      // Center the geometry
      geometry.computeBoundingBox()
      const bbox = geometry.boundingBox!
      const center = new THREE.Vector3()
      bbox.getCenter(center)
      geometry.translate(-center.x, -center.y, -center.z)

      // Scale to reasonable size (max 2 units)
      const size = new THREE.Vector3()
      bbox.getSize(size)
      const maxDim = Math.max(size.x, size.z)
      const geometryScale = maxDim > 2 ? 2 / maxDim : 1
      geometry.scale(geometryScale, geometryScale, geometryScale)

      console.log('Geometry scaled and centered, final size:', size.x * geometryScale, size.y * geometryScale, size.z * geometryScale)

      const fileName = file.name.replace(/\.[^/.]+$/, "") // Remove extension
      onAddToScene(geometry, `${fileName} (Custom)`)

      // Create preview
      const previewCanvas = document.createElement("canvas")
      previewCanvas.width = 200
      previewCanvas.height = 200
      const previewCtx = previewCanvas.getContext("2d")!
      previewCtx.drawImage(domImg, 0, 0, 200, 200)
      setPreviewImage(previewCanvas.toDataURL())

      console.log('Processing complete')

    } catch (err) {
      console.error('Error during image processing:', err)
      setError(err instanceof Error ? err.message : "Er is iets misgegaan bij het verwerken van de afbeelding")
    } finally {
      setIsProcessing(false)
    }
  }, [onAddToScene, cvReady])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Selecteer een geldige afbeelding (PNG, JPG, etc.)")
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("Afbeelding is te groot (max 10MB)")
      return
    }

    processImage(file)
  }, [processImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      processImage(file)
    }
  }, [processImage])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <H3>Upload je eigen afbeelding</H3>
      <P className="text-white/70 text-sm">
        Upload een afbeelding om deze om te zetten naar een 3D model. Gebruik afbeeldingen met duidelijke contrasten voor het beste resultaat.
      </P>

      {!cvReady && (
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500/30 border-t-blue-500"></div>
          <P className="text-blue-400 text-sm">OpenCV laden...</P>
        </div>
      )}

      <div
        className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-white/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        style={{opacity: cvReady ? 1 : 0.5, pointerEvents: cvReady ? 'auto' : 'none'}}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {previewImage ? (
          <div className="flex flex-col items-center gap-4">
            <Image
              src={previewImage}
              alt="Preview"
              width={128}
              height={128}
              className="w-32 h-32 object-cover rounded border border-white/20"
            />
            <P className="text-white/60">Klik om een andere afbeelding te selecteren</P>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Icon name="Upload" size={48} color="#ffffff60" />
            <div>
              <P className="text-white/90 font-medium">Sleep een afbeelding hierheen</P>
              <P className="text-white/60 text-sm">of klik om te selecteren</P>
            </div>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 p-4 bg-white/5 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
          <P>Afbeelding verwerken...</P>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <P className="text-red-400 text-sm">{error}</P>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
