"use client"

import React, {useCallback, useRef, useState, useEffect} from "react"
import * as THREE from "three"
import Image from "next/image"
import {H2, P} from "@/components/ui/Typography"
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

/**
 * Component die een afbeelding verwerkt met OpenCV en een 3D-extrusie (THREE.ExtrudeGeometry) genereert.
 *
 * - Laadt OpenCV (van CDN) wanneer nodig.
 * - Biedt drag & drop / file select functionaliteit.
 * - Verwerkt de afbeelding (grijswaarden, smoothing, edge detection, contour-detectie).
 * - Zet de grootste contour om naar een `THREE.Shape` en creëert daaruit een extrude-geometrie.
 * - Roept `onAddToScene` aan met de gegenereerde geometrie en een naam.
 *
 * De component handelt foutafhandeling en een kleine preview (200x200) af voor de UI.
 *
 * @param props.onAddToScene Callback om de gemaakte geometry aan de builder/scene toe te voegen.
 * @returns JSX element met upload UI en statusmeldingen.
 */

export default function ImageTo3D({ onAddToScene }: ImageTo3DProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cvReady, setCvReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Wait for OpenCV to load
  useEffect(() => {
    // OpenCV is al geladen (component was eerder gemount)
    if (window.cv && window.cv.Mat) {
      setCvReady(true)
      return
    }

    // Script zit al in de DOM maar is nog niet klaar
    if (document.querySelector("script[src*=\"opencv.js\"]")) {
      const interval = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          setCvReady(true)
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }

    // Script nog niet geladen, voeg toe
    const script = document.createElement("script")
    script.src = "https://docs.opencv.org/4.5.2/opencv.js"
    script.async = true
    script.onload = () => setCvReady(true)
    script.onerror = () => setError("OpenCV kon niet worden geladen van CDN")
    document.head.appendChild(script)
  }, [])

  /**
   * Verwerkt het geselecteerde afbeeldingsbestand en genereert een 3D-geometrie.
   *
   * Stappen:
   * - Laadt het beeld in een hidden canvas en schaalt down voor performance.
   * - Zet om naar grayscale en voert filtering + Canny edge detection uit.
   * - Vindt contours en selecteert de grootste contour.
   * - Zet contour-coördinaten om naar `THREE.Vector2` (genormaliseerd naar -0.5..0.5).
   * - Maakt een `THREE.Shape` en een `THREE.ExtrudeGeometry`, centreren en schalen.
   * - Roept `onAddToScene` aan met de resulterende geometry.
   *
   * @param file Afbeeldingsbestand dat geüpload is (PNG, JPG, etc.)
   * @throws Throws een Error wanneer OpenCV nog niet klaar is of wanneer er geen bruikbare contouren gevonden worden.
   */

  const processImage = useCallback(async (file: File) => {
    if (!cvReady) {
      setError("OpenCV is nog niet klaar. Probeer opnieuw.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const domImg = document.createElement("img")
      const canvas = canvasRef.current!

      await new Promise((resolve, reject) => {
        domImg.onload = () => {
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

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")!
      ctx.drawImage(domImg, 0, 0, width, height)

      // Convert canvas to OpenCV Mat
      const imageData = ctx.getImageData(0, 0, width, height)
      const src = window.cv.matFromImageData(imageData)

      // Convert to grayscale
      const gray = new window.cv.Mat()
      window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY)

      // Apply bilateral filter to smooth while preserving edges
      const blurred = new window.cv.Mat()
      window.cv.bilateralFilter(gray, blurred, 9, 75, 75)

      // Apply Canny edge detection
      const edges = new window.cv.Mat()
      window.cv.Canny(blurred, edges, 50, 150)

      // Dilate to connect nearby edges
      const dilated = new window.cv.Mat()
      const kernel = window.cv.getStructuringElement(window.cv.MORPH_ELLIPSE, new window.cv.Size(5, 5))
      window.cv.dilate(edges, dilated, kernel, new window.cv.Point(-1, -1), 2)

      // Find contours
      const contours = new window.cv.MatVector()
      const hierarchy = new window.cv.Mat()
      window.cv.findContours(dilated, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE)

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

      // Approximate the largest contour with Douglas-Peucker
      const largestContour = contours.get(largestContourIdx)

      const approxContour = largestContour.clone() // Use raw contour instead of approximated

      // Convert OpenCV contour to Three.js Vector2 array
      const contourPoints: THREE.Vector2[] = []
      for (let i = 0; i < approxContour.rows; i++) {
        const ptr = approxContour.intPtr(i)
        const rawX = ptr[0]
        const rawY = ptr[1]
        const x = rawX / width - 0.5
        const y = -(rawY / height - 0.5)

        contourPoints.push(new THREE.Vector2(x, y))
      }

      if (contourPoints.length < 5) {
        throw new Error("Object te klein. Probeer een grotere of duidelijker afbeelding.")
      }

      // Ensure the contour is closed (first and last points should be the same)
      if (contourPoints.length > 0 && !contourPoints[0].equals(contourPoints[contourPoints.length - 1])) {
        contourPoints.push(contourPoints[0].clone())
      }

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
      let geometry: THREE.ExtrudeGeometry
      try {
        const shape = new THREE.Shape(contourPoints)
        
        // Try without beveling first
        geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.2, // Increased depth
          bevelEnabled: false, // Disable beveling
        })

        // If that didn't work, try with minimal beveling
        if (geometry.attributes.position.count === 0) {
          geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.001,
            bevelSize: 0.001,
            bevelSegments: 1,
          })
        }
      } catch (err) {
        console.error("Error creating geometry from contour:", err)
        throw new Error("Kon geen geldige 3D vorm maken van de contour. Probeer een afbeelding met duidelijker object randen.")
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

      const fileName = file.name.replace(/\.[^/.]+$/, "") // Remove extension
      onAddToScene(geometry, `${fileName} (Custom)`)

      // Create preview
      const previewCanvas = document.createElement("canvas")
      previewCanvas.width = 200
      previewCanvas.height = 200
      const previewCtx = previewCanvas.getContext("2d")!
      previewCtx.drawImage(domImg, 0, 0, 200, 200)
      setPreviewImage(previewCanvas.toDataURL())

    } catch (err) {
      console.error("Error during image processing:", err)
      setError(err instanceof Error ? err.message : "Er is iets misgegaan bij het verwerken van de afbeelding")
    } finally {
      setIsProcessing(false)
    }
  }, [onAddToScene, cvReady])

  /**
   * Handler voor het file-input element.
   *
   * - Valideert type en grootte van het bestand.
   * - Roept `processImage` aan met het geselecteerde bestand.
   *
   * @param e Change event van het `<input type="file">`
   */

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
      <H2>Upload je figurine(s)</H2>
      <P className="text-white/70">
        Upload een afbeelding om deze om te zetten naar een 3D model. Gebruik afbeeldingen met duidelijke contrasten voor het beste resultaat. Zorg ervoor dat de afbeelding vierkant is.
      </P>

      {!cvReady && (
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500/30 border-t-blue-500"></div>
          <P className="text-blue-400">OpenCV laden...</P>
        </div>
      )}

      <div
        className="border-2 border-dashed border-[#98CEAA]/40 rounded-lg p-8 text-center hover:border-[#98CEAA]/80 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        style={{opacity: cvReady ? 1 : 0.5, pointerEvents: cvReady ? "auto" : "none"}}
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
            <Icon name="Upload" size={48} color="#98CEAA" />
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
