/**
 * Server-side print file generator for builder orders.
 *
 * Generates a 3MF/STL file from a builder config using actual GLB mesh data.
 * Stores files in `private/print-files/` (outside `public/`, not accessible to users).
 *
 * Loads real model geometries from GLB files, applies correct positions,
 * rotations, and scales. Each 1 Three.js unit = 10 mm in the exported file.
 */

import * as fs from "fs"
import * as path from "path"
import * as THREE from "three"
import JSZip from "jszip"
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

import type { BuilderCheckoutDraft } from "@/lib/builder-checkout-draft"
import {getDecorationModelScale, getPlatformModelScaleVector} from "@/lib/builder-scene-scale";

// All private print files live here — never inside `public/`
const PRINT_FILES_DIR = path.join(process.cwd(), "private", "print-files")

/**
 * Load model assets from JSON and create a lookup map.
 * This way, all model management is centralized in model-assets.json.
 */
function loadModelAssets(): Record<string, string> {
	const assetsPath = path.join(process.cwd(), "app/builder/model-assets.json")
	const data = fs.readFileSync(assetsPath, "utf-8")
	const models: Array<{ id: string; modelPath: string }> = JSON.parse(data)

	const assetMap: Record<string, string> = {}
	for (const model of models) {
		assetMap[model.id] = model.modelPath
	}
	return assetMap
}

function toAbsoluteModelPath(modelPath: string): string {
	// JSON uses public URLs like "/models/Tree.glb"; convert to disk path under /public.
	if (modelPath.startsWith("/")) {
		return path.join(process.cwd(), "public", modelPath.replace(/^\/+/, ""))
	}

	if (modelPath.startsWith("public/")) {
		return path.join(process.cwd(), modelPath)
	}

	if (path.isAbsolute(modelPath)) {
		return modelPath
	}

	return path.join(process.cwd(), "public", modelPath)
}

/**
 * Load a GLB model from disk and return its scene.
 */
async function loadGlbModel(modelPath: string): Promise<THREE.Group> {
	const absolutePath = toAbsoluteModelPath(modelPath)
	if (!fs.existsSync(absolutePath)) {
		throw new Error(`Model file not found: ${modelPath} -> ${absolutePath}`)
	}

	const loader = new GLTFLoader()
	return new Promise((resolve, reject) => {
		const data = fs.readFileSync(absolutePath)
		const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)

		loader.parse(
			arrayBuffer,
			"",
			(gltf) => {
				resolve(gltf.scene)
			},
			reject,
		)
	})
}

/**
 * Clone and flatten a loaded model into a single merged geometry.
 * This extracts all meshes from the model and combines them.
 */
function cloneModelGeometry(modelScene: THREE.Group): THREE.BufferGeometry {
	const geometries: THREE.BufferGeometry[] = []

	// Ensure child.matrixWorld includes all parent transforms from the GLB hierarchy.
	modelScene.updateMatrixWorld(true)

	modelScene.traverse((child) => {
		const maybeMesh = child as THREE.Mesh
		if (!maybeMesh.isMesh) {
			return
		}

		const clonedGeo = (maybeMesh.geometry as THREE.BufferGeometry).clone()
		// Use world transform so nested/scaled parent nodes are exported correctly.
		clonedGeo.applyMatrix4(maybeMesh.matrixWorld)
		geometries.push(clonedGeo)
	})

	if (geometries.length === 0) {
		throw new Error("No mesh geometries found in model")
	}

	// Merge all geometries
	return mergeGeometries(geometries, false)
}

async function buildExportScene(config: BuilderCheckoutDraft) {
	const scene = new THREE.Scene()
	const modelAssets = loadModelAssets()

	// Load platform model
	const platformModelPath = modelAssets[config.platformId]
	if (!platformModelPath) {
		throw new Error(`Platform model not found in assets: ${config.platformId}`)
	}

	const platformModelScene = await loadGlbModel(platformModelPath)
	const platformMesh = new THREE.Mesh(
		cloneModelGeometry(platformModelScene),
	)
	platformMesh.position.set(0, 0, 0)
	platformMesh.scale.set(...getPlatformModelScaleVector(config.platformSize))
	scene.add(platformMesh)

	// Load and add each decoration model
	for (const deco of config.decorations) {
		const modelPath = modelAssets[deco.assetId]
		if (!modelPath) {
			console.warn(`Decoration model not found in assets: ${deco.assetId}, skipping`)
			continue
		}

		try {
			const decoModelScene = await loadGlbModel(modelPath)
			const decoGeometry = cloneModelGeometry(decoModelScene)
			const decoMesh = new THREE.Mesh(decoGeometry)

			// Apply transformations: position, rotation, scale
			decoMesh.position.set(deco.position[0], deco.position[1], deco.position[2])
			decoMesh.rotation.y = deco.rotationY
			const decorationScale = getDecorationModelScale(deco.scale)
			decoMesh.scale.set(decorationScale, decorationScale, decorationScale)

			scene.add(decoMesh)
		} catch (error) {
			console.warn(`Failed to load decoration model ${deco.assetId}:`, error)
		}
	}

	scene.updateMatrixWorld(true)
	return scene
}

function collectTriangleMeshData(scene: THREE.Scene) {
	// 3MF is written in millimeters. Our working units are centimeters (1 unit = 10 mm).
	const MM_PER_UNIT = 10
	const vertices: Array<[number, number, number]> = []
	const triangles: Array<[number, number, number]> = []

	scene.traverse((node) => {
		const mesh = node as THREE.Mesh
		if (!mesh.isMesh) return

		const baseGeometry = mesh.geometry as THREE.BufferGeometry
		const geometry = baseGeometry.index ? baseGeometry.toNonIndexed() : baseGeometry.clone()
		geometry.applyMatrix4(mesh.matrixWorld)

		const positionAttr = geometry.getAttribute("position")
		if (!positionAttr) return

		for (let i = 0; i < positionAttr.count; i += 3) {
			const a: [number, number, number] = [
				positionAttr.getX(i) * MM_PER_UNIT,
				positionAttr.getY(i) * MM_PER_UNIT,
				positionAttr.getZ(i) * MM_PER_UNIT,
			]
			const b: [number, number, number] = [
				positionAttr.getX(i + 1) * MM_PER_UNIT,
				positionAttr.getY(i + 1) * MM_PER_UNIT,
				positionAttr.getZ(i + 1) * MM_PER_UNIT,
			]
			const c: [number, number, number] = [
				positionAttr.getX(i + 2) * MM_PER_UNIT,
				positionAttr.getY(i + 2) * MM_PER_UNIT,
				positionAttr.getZ(i + 2) * MM_PER_UNIT,
			]

			const start = vertices.length
			vertices.push(a, b, c)
			triangles.push([start, start + 1, start + 2])
		}
	})

	return { vertices, triangles }
}

function create3mfModelXml(scene: THREE.Scene) {
	const { vertices, triangles } = collectTriangleMeshData(scene)
	if (vertices.length === 0 || triangles.length === 0) {
		throw new Error("No mesh triangles found for 3MF export")
	}

	const verticesXml = vertices
		.map(([x, y, z]) => `<vertex x="${x.toFixed(5)}" y="${y.toFixed(5)}" z="${z.toFixed(5)}"/>`)
		.join("")

	const trianglesXml = triangles
		.map(([v1, v2, v3]) => `<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`)
		.join("")

	return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>${verticesXml}</vertices>
        <triangles>${trianglesXml}</triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1"/>
  </build>
</model>`
}

async function export3mf(orderId: string, scene: THREE.Scene) {
	const zip = new JSZip()

	zip.file(
		"[Content_Types].xml",
		`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`,
	)

	zip.folder("_rels")?.file(
		".rels",
		`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`,
	)

	zip.folder("3D")?.file("3dmodel.model", create3mfModelXml(scene))

	const data = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
	const filename = `order-${orderId}.3mf`
	fs.writeFileSync(path.join(PRINT_FILES_DIR, filename), data)
	return filename
}

async function exportStl(orderId: string, scene: THREE.Scene) {
	const exporter = new STLExporter()
	const stlContent = exporter.parse(scene, { binary: false })
	const filename = `order-${orderId}.stl`
	fs.writeFileSync(path.join(PRINT_FILES_DIR, filename), stlContent)
	return filename
}

/**
 * Generates a print file for the given builder config and saves it
 * to the private directory.
 *
 * Loads actual GLB geometries for all models (platform + decorations),
 * applies correct transformations, and exports to 3MF or STL format.
 *
 * Primary output: 3MF (modern slicers prefer, smaller files)
 * Fallback output: STL (universal compatibility)
 */
export async function generateAndSavePrintFile(orderId: string, config: BuilderCheckoutDraft): Promise<string> {
	fs.mkdirSync(PRINT_FILES_DIR, { recursive: true })
	const scene = await buildExportScene(config)

	try {
		return await export3mf(orderId, scene)
	} catch (error) {
		console.warn("[builder-print-export] 3MF export failed, falling back to STL:", error)
		return await exportStl(orderId, scene)
	}
}

/**
 * Returns the absolute path for a stored print file by filename.
 * Throws if the file does not exist.
 */
export function getPrintFilePath(filename: string): string {
	const filepath = path.join(PRINT_FILES_DIR, filename)
	if (!fs.existsSync(filepath)) {
		throw new Error(`Print file not found: ${filename}`)
	}
	return filepath
}