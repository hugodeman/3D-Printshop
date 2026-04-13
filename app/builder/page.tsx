"use client"

import { Suspense, useMemo, useRef, useState, useEffect, useCallback } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Grid, useGLTF } from "@react-three/drei"
import { EffectComposer, Outline } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Color, type Material, type Mesh, type Object3D, Raycaster, Vector2, type Group as THREE_Group } from "three"

import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import {H2, H3, P} from "@/components/ui/Typography"
import { SliderInput } from "@/components/builder/SliderInput"
import { ColorInput } from "@/components/builder/ColorInput"
import { SceneHelp } from "@/components/builder/SceneHelp"
import { StepButtons } from "@/components/builder/StepButtons"
import { BuilderIntroModal } from "@/components/builder/BuilderIntroModal"

import { saveBuilderCheckoutDraft } from "@/lib/builder-checkout-draft"
import { useBuilderStore } from "@/lib/builder-store"

import rawModelAssets from "./model-assets.json"

type PartColors = Record<string, string>
type Vec3 = [number, number, number]
type ScaleLimits = { min: number; max: number }

type ModelAsset = {
	dimensions: string;
	id: string
	name: string
	thumbnail: string
	kind: "platform" | "decoration"
	modelPath: string
	color: string
	partColors?: PartColors
	spawnPosition?: Vec3
	scaleLimits?: ScaleLimits
}

type PlacedObject = {
	instanceId: string
	assetId: string
	position: Vec3
	rotationY: number
	scale: number
	color: string
	partColors?: PartColors
}

const PREVIEW_SCALE_MULTIPLIER = 20
const POSITION_STEP = 0.05
const ROTATION_MIN = 0
const ROTATION_MAX = 2 * Math.PI
const ROTATION_STEP = 0.02
const SCALE_MIN = 0.5
const SCALE_MAX = 3
const SCALE_STEP = 0.05
const BASE_PLATFORM_SIZE_CM = 10
const DEG_PER_RAD = 180 / Math.PI
const DEFAULT_PLATFORM_COLOR = "#228B22"
const BUILDER_INTRO_SEEN_KEY = "builder-intro-seen-v1"

function radiansToDegrees(rad: number) {
	return Math.round(rad * DEG_PER_RAD)
}

function degreesToRadians(deg: number) {
	return deg / DEG_PER_RAD
}

const modelAssets = rawModelAssets as unknown as ModelAsset[]
const platformAssets = modelAssets.filter((asset) => asset.kind === "platform")
const decorationAssets = modelAssets.filter((asset) => asset.kind === "decoration")
const assetsById = new Map(modelAssets.map((asset) => [asset.id, asset]))

for (const asset of modelAssets) {
	useGLTF.preload(asset.modelPath)
}

// Clones a material and applies a tint color if possible
function tintMaterial(material: Material, color: string) {
	const clone = material.clone() as Material & { color?: Color }
	if (clone.color) clone.color.set(color)
	return clone
}

// Traverses a model's scene graph and applies tinting to all mesh materials based on the provided colors
function applyModelTint(root: Object3D, defaultColor: string, partColors?: PartColors) {
	root.traverse((node) => {
		const mesh = node as Mesh
		if (!mesh.isMesh || !mesh.material) return

		const color = partColors?.[node.name] ?? defaultColor
		if (Array.isArray(mesh.material)) {
			mesh.material = mesh.material.map((m) => tintMaterial(m, color))
		} else {
			mesh.material = tintMaterial(mesh.material, color)
		}
	})
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max)
}

function normalizeHexColor(value: string) {
	const withHash = value.startsWith("#") ? value : `#${value}`
	const isHex = /^#[0-9a-fA-F]{6}$/.test(withHash)
	return isHex ? withHash.toUpperCase() : null
}

function getAssetScaleLimits(asset: ModelAsset | null | undefined): ScaleLimits {
	const min = asset?.scaleLimits?.min ?? SCALE_MIN
	const max = asset?.scaleLimits?.max ?? SCALE_MAX
	return { min: Math.min(min, max), max: Math.max(min, max) }
}

function GLTFObject({
	modelPath,
	position,
	rotationY,
	scale,
	scaleVector,
	tintColor,
	partColors,
	instanceId,
	onReady,
}: {
	modelPath: string
	position: Vec3
	rotationY?: number
	scale?: number
	scaleVector?: Vec3
	tintColor: string
	partColors?: PartColors
	instanceId?: string
	onReady?: (objects: Object3D[] | null) => void
}) {
	const gltf = useGLTF(modelPath)
	const groupRef = useRef<THREE_Group>(null)

	const scene = useMemo(() => {
		const clone = gltf.scene.clone(true)
		applyModelTint(clone, tintColor, partColors)

		// Add userData for raycasting
		if (instanceId) {
			clone.traverse((node) => {
				const n = node as unknown as { userData: Record<string, string> }
				n.userData.decorationInstanceId = instanceId
			})
		}

		return clone
	}, [gltf.scene, tintColor, partColors, instanceId])

	useEffect(() => {
		if (!onReady || !groupRef.current) return

		const meshes: Object3D[] = []
		groupRef.current.traverse((child) => {
			const maybeMesh = child as Mesh
			if (maybeMesh.isMesh) meshes.push(maybeMesh)
		})

		onReady(meshes.length > 0 ? meshes : null)

		return () => {
			onReady(null)
		}
	}, [onReady, scene])

	const previewScale: number | Vec3 = scaleVector
		? [
				PREVIEW_SCALE_MULTIPLIER * scaleVector[0],
				PREVIEW_SCALE_MULTIPLIER * scaleVector[1],
				PREVIEW_SCALE_MULTIPLIER * scaleVector[2],
			]
		: PREVIEW_SCALE_MULTIPLIER * (scale ?? 1)

	return (
		<group
			ref={groupRef}
			position={position}
			rotation={[0, rotationY ?? 0, 0]}
			scale={previewScale}
		>
			<primitive object={scene} />
		</group>
	)
}

// Registers a canvas capture function via a ref so the parent can take a screenshot
function CanvasCaptureSetup({
	onReady,
}: {
	onReady: (capture: (() => string | null) | null) => void
}) {
	const { gl } = useThree()

	useEffect(() => {
		// PNG keeps the captured preview lossless and avoids JPEG blur artifacts.
		onReady(() => gl.domElement.toDataURL("image/png"))
		return () => {
			onReady(null)
		}
	}, [gl, onReady])

	return null
}

function ClickHandler({
	placedObjects,
	onSelectDecoration,
	onClearSelection,
}: {
	placedObjects: PlacedObject[]
	onSelectDecoration: (instanceId: string) => void
	onClearSelection: () => void
}) {
	const { camera, gl, scene } = useThree()
	const raycaster = useRef(new Raycaster())
	const mouse = useRef(new Vector2())
	const pointerStart = useRef<{ x: number; y: number } | null>(null)
	const CLICK_MOVE_THRESHOLD = 5

	useEffect(() => {
		const pickAtPointer = (event: PointerEvent) => {
			const canvas = gl.domElement
			const rect = canvas.getBoundingClientRect()
			mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
			mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

			raycaster.current.setFromCamera(mouse.current, camera)

			// Get all meshes from decoration objects
			const allMeshes: Mesh[] = []

			placedObjects.forEach((obj) => {
				scene.traverse((node) => {
					const mesh = node as Mesh
					if (!mesh.isMesh || !mesh.userData?.decorationInstanceId) return
					if (mesh.userData.decorationInstanceId === obj.instanceId) {
						allMeshes.push(mesh)
					}
				})
			})

			// Check for intersections
			const intersects = raycaster.current.intersectObjects(allMeshes, true)

			if (intersects.length > 0) {
				// Find which decoration was hit
				const hitMesh = intersects[0].object as Mesh
				for (const obj of placedObjects) {
					let found = false
					scene.traverse((node) => {
						const mesh = node as Mesh
						if (!mesh.isMesh) return
						if (mesh.userData?.decorationInstanceId === obj.instanceId) {
							if (hitMesh === mesh || mesh.children.includes(hitMesh as unknown as THREE_Group)) {
								onSelectDecoration(obj.instanceId)
								found = true
							}
						}
					})
					if (found) break
				}
			} else {
				onClearSelection()
			}
		}

		const handlePointerDown = (event: PointerEvent) => {
			if (event.button !== 0) return
			if (event.target !== gl.domElement) return
			pointerStart.current = { x: event.clientX, y: event.clientY }
		}

		const handlePointerUp = (event: PointerEvent) => {
			if (event.button !== 0) return
			if (!pointerStart.current) return

			const dx = event.clientX - pointerStart.current.x
			const dy = event.clientY - pointerStart.current.y
			const distance = Math.sqrt(dx * dx + dy * dy)
			pointerStart.current = null

			// Treat only near-stationary mouse actions as a click.
			if (distance > CLICK_MOVE_THRESHOLD) return
			if (event.target !== gl.domElement) return

			pickAtPointer(event)
		}

		const canvas = gl.domElement
		canvas.addEventListener("pointerdown", handlePointerDown, { capture: false })
		canvas.addEventListener("pointerup", handlePointerUp, { capture: false })

		return () => {
			canvas.removeEventListener("pointerdown", handlePointerDown, false)
			canvas.removeEventListener("pointerup", handlePointerUp, false)
		}
	}, [camera, scene, placedObjects, gl.domElement, onSelectDecoration, onClearSelection])

	return null
}

export default function BuilderPage() {
	const router = useRouter()
	// Scene state (Zustand)
	const step = useBuilderStore((state) => state.step)
	const selectedPlatformId = useBuilderStore((state) => state.selectedPlatformId)
	const selectedPlatformColor = useBuilderStore((state) => state.selectedPlatformColor)
	const selectedPlatformSize = useBuilderStore((state) => state.selectedPlatformSize)
	const placedObjects = useBuilderStore((state) => state.placedObjects)
	const selectedId = useBuilderStore((state) => state.selectedId)
	const setStep = useBuilderStore((state) => state.setStep)
	const selectPlatformInStore = useBuilderStore((state) => state.selectPlatform)
	const setSelectedPlatformColor = useBuilderStore((state) => state.setSelectedPlatformColor)
	const setSelectedPlatformSize = useBuilderStore((state) => state.setSelectedPlatformSize)
	const addObjectToStore = useBuilderStore((state) => state.addObject)
	const updateSelectedInStore = useBuilderStore((state) => state.updateSelected)
	const removeSelectedFromStore = useBuilderStore((state) => state.removeSelected)
	const setSelectedId = useBuilderStore((state) => state.setSelectedId)
	// UI-only state
	const [selectedPlatformColorInput, setSelectedPlatformColorInput] = useState(selectedPlatformColor)
	const [selectedPartColorInputs, setSelectedPartColorInputs] = useState<Record<string, string>>({})
	const [outlineSelection, setOutlineSelection] = useState<Object3D[] | null>(null)
	const [hierarchyOpen, setHierarchyOpen] = useState(true)
	const [isCapturing, setIsCapturing] = useState(false)
	const [showGrid, setShowGrid] = useState(true)
	const [isIntroOpen, setIsIntroOpen] = useState(false)
	const [captureCanvas, setCaptureCanvas] = useState<(() => string | null) | null>(null)
	const handleCaptureReady = useCallback((nextCapture: (() => string | null) | null) => {
		// Store function-as-value, not as updater
		setCaptureCanvas(() => nextCapture)
	}, [])
	useEffect(() => {
		const hasSeenIntro = window.localStorage.getItem(BUILDER_INTRO_SEEN_KEY)
		if (!hasSeenIntro) setIsIntroOpen(true)
	}, [])
	const closeIntro = useCallback(() => {
		window.localStorage.setItem(BUILDER_INTRO_SEEN_KEY, "1")
		setIsIntroOpen(false)
	}, [])

	useEffect(() => {
		if (step !== 1) return
		setSelectedId(null)
		setOutlineSelection(null)
	}, [step, setSelectedId])

	const selectedPlatform = selectedPlatformId ? (assetsById.get(selectedPlatformId) ?? null) : null
	const selectedObject = placedObjects.find((o) => o.instanceId === selectedId) ?? null
	const selectedObjectAsset = selectedObject ? assetsById.get(selectedObject.assetId) : null

	const hierarchyRows = useMemo(() => {
		const countsByAssetId = new Map<string, number>()

		return placedObjects.map((obj) => {
			const currentCount = (countsByAssetId.get(obj.assetId) ?? 0) + 1
			countsByAssetId.set(obj.assetId, currentCount)

			return {
				instanceId: obj.instanceId,
				label: `${assetsById.get(obj.assetId)?.name ?? "Onbekend"} ${currentCount}`,
			}
		})
	}, [placedObjects])

	const canGoToStep2 = Boolean(selectedPlatformId)
	const canGoToCheckout = canGoToStep2 && placedObjects.length > 0
	const selectedScaleLimits = getAssetScaleLimits(selectedObjectAsset)
	const platformSizeScaleMultiplier = selectedPlatformSize / BASE_PLATFORM_SIZE_CM
	const positionMin = -(selectedPlatformSize / BASE_PLATFORM_SIZE_CM) + 0.1
	const positionMax = (selectedPlatformSize / BASE_PLATFORM_SIZE_CM) - 0.1
	const stepItems = [
		{
			id: 1,
			label: "Platform",
			done: step > 1,
			isCurrent: step === 1,
			onClick: () => setStep(1),
			disabled: false,
		},
		{
			id: 2,
			label: "Decoraties",
			done: step > 2,
			isCurrent: step === 2,
			onClick: () => setStep(2),
			disabled: !canGoToStep2,
		},
		{
			id: 3,
			label: "Bestellen",
			done: false,
			isCurrent: false,
			onClick: goToCheckoutOverview,
			disabled: !canGoToCheckout,
		},
	]

	function selectPlatform(asset: ModelAsset) {
		const normalizedColor = normalizeHexColor(asset.color) ?? DEFAULT_PLATFORM_COLOR
		selectPlatformInStore(asset.id, normalizedColor)
		setSelectedPlatformColorInput(normalizedColor)
	}

	function addObject(asset: ModelAsset) {
		if (asset.kind !== "decoration") return
		addObjectToStore(asset.id)
	}

	function updateSelected(updater: (o: PlacedObject) => PlacedObject) {
		if (!selectedId) return
		updateSelectedInStore(updater)
	}

	function removeSelected() {
		removeSelectedFromStore()
		setOutlineSelection(null)
	}

	async function goToCheckoutOverview() {
		if (!selectedPlatform) return

		let previewImage: string | undefined
		try {
			// Hide the grid, wait 2 frames so R3F renders a clean frame without it, then capture
			setIsCapturing(true)
			await new Promise<void>((resolve) => {
				requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
			})

			previewImage = captureCanvas?.() ?? undefined
		} catch {
			// If capture fails, continue to checkout without preview image
			previewImage = undefined
		} finally {
			setIsCapturing(false)
		}

		saveBuilderCheckoutDraft({
			platformId: selectedPlatform.id,
			platformName: selectedPlatform.name,
			decorations: placedObjects.map((obj) => ({
				instanceId: obj.instanceId,
				assetId: obj.assetId,
				name: assetsById.get(obj.assetId)?.name ?? "Onbekend",
				position: obj.position,
				rotationY: obj.rotationY,
				scale: obj.scale,
				color: obj.color,
			})),
			totalItems: placedObjects.length,
			createdAt: new Date().toISOString(),
			previewImage,
		})

		router.push("/checkout/overview")
	}

	return (
		<main className="h-[calc(100vh-120px)] bg-[#1A1C1E] text-white">
			<BuilderIntroModal isOpen={isIntroOpen} onCloseAction={closeIntro} />
			<div className="grid h-full grid-cols-[260px_1fr_300px] gap-4">

				{/* Left Sidebar */}
				<div className="flex flex-col overflow-hidden bg-white/5">
					{/* Hierarchy */}
					<div className="shrink-0 border-b border-white/10 ">
						<button
							type="button"
							onClick={() => setHierarchyOpen((o) => !o)}
							className="flex w-full items-center justify-between p-3 text-left"
						>
							<P className="font-medium text-white/90">Hierarchy</P>
							<Icon
								name="ChevronDown"
								size={14}
								color="#ffffff99"
								className={`transition-transform duration-200 ${hierarchyOpen ? "rotate-180" : ""}`}
							/>
						</button>

						{hierarchyOpen && (
							<div className="max-h-64 overflow-y-auto overscroll-contain border-t border-white/10 px-3 pb-3 pt-2 scrollbar-hide">
								<P className="text-white/60">Platform: {selectedPlatform?.name ?? "Nog niet gekozen"}</P>
								<div className="mt-2 space-y-1">
									{hierarchyRows.length === 0 ? (
										<P className="text-white/40">- Geen decoraties</P>
									) : (
										hierarchyRows.map((row) => (
											<button
												key={row.instanceId}
												type="button"
													onClick={() => step === 2 && setSelectedId(row.instanceId)}
													disabled={step !== 2}
												className={`block w-full rounded px-2 py-1 text-left ${
													selectedId === row.instanceId
														? "bg-[#98CEAA] text-black"
															: "bg-black/25 text-white/80"
												}`}
											>
												- {row.label}
											</button>
										))
									)}
								</div>
							</div>
						)}
					</div>

					<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain scrollbar-hide p-4">

						{step === 1 && (
							<div className="flex flex-col gap-3">
								<H3>Kies een platform</H3>
								{platformAssets.map((asset) => {
									const active = selectedPlatformId === asset.id
									return (
										<button
											key={asset.id}
											type="button"
											onClick={() => selectPlatform(asset)}
											className={`rounded-lg border p-2 text-left transition ${active
												? "border-[#98CEAA] bg-[#98CEAA]/10"
												: "border-white/10 hover:border-white/30"}`}
										>
											<Image
												src={asset.thumbnail}
												alt={asset.name}
												width={300}
												height={200}
												className="h-auto w-full rounded object-cover"/>
											<div className={"flex flex-col gap-3 mt-1"}>
												<P className="mt-2 text-sm">{asset.name}</P>
												<P className={"text-white/60"}>{asset.dimensions} cm</P>
											</div>
										</button>
									)
								})}
							</div>
						)}

						{step === 2 && (
							<div className="flex flex-col gap-3">
								<H2>Voeg decoraties toe</H2>
								<div className="grid grid-cols-2 gap-2">
									{decorationAssets.map((asset) => (
										<button
											key={asset.id}
											type="button"
											onClick={() => addObject(asset)}
											className="rounded-lg border border-white/10 p-2 transition hover:border-[#98CEAA]"
										>
											<Image
												src={asset.thumbnail}
												alt={asset.name}
												width={200}
												height={120}
												className="h-20 w-full rounded object-cover"
											/>
											<P className="mt-1 text-xs">{asset.name}</P>
										</button>
									))}
								</div>
							</div>
						)}
					</div>

					{/* nav button */}
					{step === 2 && (
						<div className="border-t border-white/10 p-4">
							<Button variant="secondary" onClick={() => setStep(1)} className="w-full">
								Terug
							</Button>
						</div>
					)}
				</div>

				{/* Center */}
				<div className="mb-5 flex flex-col overflow-hidden rounded-xl bg-[#1A1C1E]">

					{/* Step Buttons */}
					<div className="flex justify-center p-4">
						<StepButtons steps={stepItems} onInfoClick={() => setIsIntroOpen(true)} />
					</div>

					{/* Canvas */}
					<div className="relative flex-1">
						<Canvas
							camera={{ position: [4.5, 4.5, 4.5], fov: 46 }}
							dpr={1}
							gl={{ preserveDrawingBuffer: true }}
						>
							<color attach="background" args={["#1F2126"]} />
							<ambientLight intensity={0.5} />
							<directionalLight position={[6, 9, 4]} intensity={1.2} />

							<CanvasCaptureSetup
								onReady={handleCaptureReady}
							/>

							{!isCapturing && showGrid && (
								<Grid
									args={[20, 20]}
									cellSize={0.2}
									cellThickness={0.5}
									sectionSize={1}
									sectionThickness={1}
									fadeDistance={18}
									fadeStrength={1}
									infiniteGrid
								/>
							)}

							<Suspense fallback={null}>
								{selectedPlatform && (
									<GLTFObject
										modelPath={selectedPlatform.modelPath}
										position={selectedPlatform.spawnPosition ?? [0, 0, 0]}
										scaleVector={[platformSizeScaleMultiplier, 1, platformSizeScaleMultiplier]}
										tintColor={selectedPlatformColor}
									/>
								)}

								{placedObjects.map((obj) => {
									const asset = assetsById.get(obj.assetId)
									if (!asset) return null
									return (
										<GLTFObject
											key={obj.instanceId}
											instanceId={obj.instanceId}
											modelPath={asset.modelPath}
											position={obj.position}
											rotationY={obj.rotationY}
											scale={obj.scale}
											tintColor={obj.color}
											partColors={obj.partColors}
											onReady={selectedId === obj.instanceId ? setOutlineSelection : undefined}
										/>
									)
								})}

								{step === 2 && (
									<ClickHandler
										placedObjects={placedObjects}
										onSelectDecoration={setSelectedId}
										onClearSelection={() => {
											setSelectedId(null)
											setOutlineSelection(null)
										}}
									/>
								)}
							</Suspense>

							<EffectComposer multisampling={4} autoClear={false}>
								<Outline
									selection={outlineSelection ?? []}
									edgeStrength={5}
									visibleEdgeColor={0x673f11}
									hiddenEdgeColor={0x673f11}
									blendFunction={BlendFunction.ALPHA}
									blur
									xRay={true}
								/>
							</EffectComposer>

							<OrbitControls makeDefault minDistance={1.5} maxDistance={30} />
						</Canvas>

						{/*help knop*/}
						<SceneHelp />

						<button
							type="button"
							onClick={() => setShowGrid((prev) => !prev)}
							className="absolute z-10 flex items-center justify-center rounded-full border border-white/20 bg-[#1F2126]/80 backdrop-blur-sm transition hover:bg-[#2A2D31] bottom-[clamp(0.75rem,2vh,1.5rem)] right-[clamp(0.75rem,2vw,1.5rem)] h-[clamp(2.75rem,5vmin,3.75rem)] w-[clamp(2.75rem,5vmin,3.75rem)]"
							aria-label={showGrid ? "Verberg grid" : "Toon grid"}
							title={showGrid ? "Verberg grid" : "Toon grid"}
						>
							<Icon name="Grid" size={22} color={showGrid ? "#FFFFFF" : "#98CEAA"} className="h-[clamp(1rem,2.2vmin,1.4rem)] w-[clamp(1rem,2.2vmin,1.4rem)]" />
						</button>
					</div>
				</div>

				{/* Right Sidebar */}
				<div className="flex flex-col overflow-hidden bg-white/5">
					<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
						<H2>Aanpassen</H2>

						{step === 1 ? (
							<div className="flex flex-1 flex-col">
								{!selectedPlatform ? (
									<div className="flex flex-1 flex-col items-center justify-center text-center text-white/70">
										<div className="mb-4 flex h-22 w-22 items-center justify-center rounded-full border border-white/20 bg-[#D9D9D9]/25">
											<Icon name="Box" size={34} color="#1F2126" />
										</div>
										<P className="max-w-55 text-sm">Kies een platform en selecteer je maat</P>
									</div>
								) : (
									<div className="flex flex-col gap-3">
										<div className={"flex justify-between mr-2 mt-3 mb-5"}>
											<H3>Geselecteerd:</H3>
											<H3>{selectedPlatform.name}</H3>
										</div>
										<div className="rounded-lg border border-white/10 bg-black/20 p-3 mb-5">
											<P className="text-white/60">Afmetingen</P>
											<div className={"flex items-baseline gap-1"}>
												<H2 className="mt-1 font-medium">{selectedPlatformSize} x {selectedPlatformSize} x 1</H2>
												<P className="text-white/60">cm</P>
											</div>
										</div>
										<div className="grid grid-cols-3 gap-2">
											{[
												{ label: "M", value: 10 as const },
												{ label: "L", value: 15 as const },
												{ label: "XL", value: 20 as const },
											].map((size) => (
												<Button
													key={size.value}
													variant={selectedPlatformSize === size.value ? "primary" : "secondary"}
													onClick={() => setSelectedPlatformSize(size.value)}
													className="w-full"
												>
													{size.label}
												</Button>
											))}
										</div>

										<div className="mt-3 border-t border-white/10 pt-4">
											<H3 className="mb-5 mt-3 ">Kleur platform</H3>
											<ColorInput
												label=""
												value={selectedPlatformColor}
												onChange={setSelectedPlatformColor}
												inputValue={selectedPlatformColorInput}
												onInputChange={setSelectedPlatformColorInput}
												onBlur={() => setSelectedPlatformColorInput(selectedPlatformColor)}
											/>
										</div>
									</div>
								)}
							</div>
						) : (
							// step 2, selected
							<>
								{/* Sliders */}
								{selectedObject ? (
							<div className="flex flex-col gap-5">
								<div className={"flex justify-between mr-2 mb-8 mt-3"}>
									<H3>Geselecteerd:</H3>
									<H3>{selectedObjectAsset?.name}</H3>
								</div>

								<SliderInput
									label="Positie X"
									value={selectedObject.position[0]}
									onChange={(x) => {
										const clamped = clamp(x, positionMin, positionMax)
										updateSelected((o) => ({ ...o, position: [clamped, o.position[1], o.position[2]] }))
									}}
									min={positionMin}
									max={positionMax}
									step={POSITION_STEP}
								/>

								<SliderInput
									label="Positie Z"
									value={selectedObject.position[2]}
									onChange={(z) => {
										const clamped = clamp(z, positionMin, positionMax)
										updateSelected((o) => ({ ...o, position: [o.position[0], o.position[1], clamped] }))
									}}
									min={positionMin}
									max={positionMax}
									step={POSITION_STEP}
								/>

								<SliderInput
									label="Rotatie Y"
									value={selectedObject.rotationY}
									onChange={(rotationY) => {
										const clamped = clamp(rotationY, ROTATION_MIN, ROTATION_MAX)
										updateSelected((o) => ({ ...o, rotationY: clamped }))
									}}
									min={ROTATION_MIN}
									max={ROTATION_MAX}
									step={ROTATION_STEP}
									displayFormat={(rad) => radiansToDegrees(rad).toString()}
									parseDisplay={(deg) => degreesToRadians(Number(deg))}
									displayMinMax={(v) => (v === ROTATION_MIN ? "0°" : "360°")}
								/>

								<SliderInput
									label="Schaal"
									value={selectedObject.scale}
									onChange={(scale) => {
										const clamped = clamp(scale, selectedScaleLimits.min, selectedScaleLimits.max)
										updateSelected((o) => ({ ...o, scale: clamped }))
									}}
									min={selectedScaleLimits.min}
									max={selectedScaleLimits.max}
									step={SCALE_STEP}
								/>
								{/* colors */}
								{selectedObjectAsset?.partColors && Object.keys(selectedObjectAsset.partColors).length > 0 && (
									<div className="border-t border-white/10 pt-5 mt-5 ">
										<H3 className="mb-3 font-medium">Kleuren</H3>
										<div className="space-y-3">
											{Object.entries(selectedObjectAsset.partColors).map(([partName, defaultColor]) => {
												const currentColor = selectedObject.partColors?.[partName] ?? defaultColor
												const inputKey = `${selectedObject.instanceId}:${partName}`
												const inputValue = selectedPartColorInputs[inputKey] ?? currentColor.toUpperCase()
												return (
													<ColorInput
														key={partName}
														label={partName}
														value={currentColor}
														onChange={(next) => {
															const newPartColors = {
																...selectedObject.partColors,
																[partName]: next,
															}
															updateSelected((o) => ({ ...o, partColors: newPartColors }))
														}}
														inputValue={inputValue}
														onInputChange={(raw) => {
															setSelectedPartColorInputs((prev) => ({ ...prev, [inputKey]: raw }))
														}}
														onBlur={() => {
															const stable = (selectedObject.partColors?.[partName] ?? defaultColor).toUpperCase()
															setSelectedPartColorInputs((prev) => ({ ...prev, [inputKey]: stable }))
														}}
													/>
												)
											})}
										</div>
									</div>
								)}

								<button
									type="button"
									onClick={removeSelected}
									className="w-full rounded-md border border-red-400/50 bg-red-500/20 px-3 py-2 text-sm text-red-100 mt-10"
								>
									Verwijder
								</button>
							</div>
						) : (
							// unselected display
							<div className="flex flex-1 flex-col items-center justify-center text-center text-white/70">
								<div className="mb-4 flex h-22 w-22 items-center justify-center rounded-full bg-[#D9D9D9]/35 border border-white/20">
									<Icon name="MousePointerClick" size={34} color="#1F2126" />
								</div>
								<P className="max-w-55 text-sm">Selecteer een model om deze aan te passen</P>
							</div>
						)}
							</>
						)}
					</div>

					{/* nav buttons */}
					<div className="border-t border-white/10 p-4">
						{step === 1 && (
							<Button onClick={() => setStep(2)} disabled={!canGoToStep2} className="w-full">
								Naar decoraties
							</Button>
						)}
						{step === 2 && (
							<Button onClick={goToCheckoutOverview} disabled={!canGoToCheckout} className="w-full">
								Naar checkout
							</Button>
						)}
					</div>
				</div>
			</div>
		</main>
	)
}