"use client"

import { Suspense, useMemo, useRef, useState, useEffect, useCallback } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Grid, useGLTF } from "@react-three/drei"
import { EffectComposer, Outline } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { type Mesh, type Object3D, Raycaster, Vector2, type Group as THREE_Group } from "three"
import * as THREE from "three"

import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import {H2, H3, P} from "@/components/ui/Typography"
import { SliderInput } from "@/components/builder/SliderInput"
import { ColorInput } from "@/components/builder/ColorInput"
import { StepButtons } from "@/components/builder/StepButtons"
import { BuilderIntroModal } from "@/components/builder/BuilderIntroModal"
import { BuilderResetConfirmModal } from "@/components/builder/BuilderResetConfirmModal"
import {DeleteSceneButton} from "@/components/builder/DeleteSceneButton";
import ImageTo3D from "@/components/builder/ImageTo3D"
import CustomObject from "@/components/builder/CustomObject"
import { MeasurementTool, MeasurementDisplay } from "@/components/builder/MeasurementTool"
import {GLTFObject} from "@/components/builder/GLTFObject";

import { saveBuilderCheckoutDraft } from "@/lib/builder-checkout-draft"
import {BASE_PLATFORM_SIZE_CM, getPlatformModelScaleVector,} from "@/lib/builder-scene-scale"
import { useBuilderStore, type PlacedObject } from "@/lib/builder-store"
import {assetsById, decorationAssets, modelAssets, platformAssets} from "@/lib/builder-model-assets";
import {degreesToRadians, getAssetScaleLimits, normalizeHexColor, radiansToDegrees, clamp} from "@/lib/builder-scene-utils";
import { ModelAsset } from "@/types/BuilderConfig"

const POSITION_STEP = 0.05
const ROTATION_MIN = 0
const ROTATION_MAX = 2 * Math.PI
const ROTATION_STEP = 0.02
const SCALE_STEP = 0.05
const DEFAULT_PLATFORM_COLOR = "#228B22"
const BUILDER_INTRO_SEEN_KEY = "builder-intro-seen-v1"

for (const asset of modelAssets) {
	useGLTF.preload(asset.modelPath)
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
	const addCustomObjectToStore = useBuilderStore((state) => state.addCustomObject)
	const updateSelectedInStore = useBuilderStore((state) => state.updateSelected)
	const removeSelectedFromStore = useBuilderStore((state) => state.removeSelected)
	const setSelectedId = useBuilderStore((state) => state.setSelectedId)
	const resetScene = useBuilderStore((state) => state.resetScene)
	// UI-only state
	const [selectedPlatformColorInput, setSelectedPlatformColorInput] = useState(selectedPlatformColor)
	const [selectedPartColorInputs, setSelectedPartColorInputs] = useState<Record<string, string>>({})
	const [outlineSelection, setOutlineSelection] = useState<Object3D[] | null>(null)
	const [hierarchyOpen, setHierarchyOpen] = useState(true)
	const [isCapturing, setIsCapturing] = useState(false)
	const [showGrid, setShowGrid] = useState(true)
	const [isIntroOpen, setIsIntroOpen] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [isClearModalOpen, setIsClearModalOpen] = useState(false)
	const [captureCanvas, setCaptureCanvas] = useState<(() => string | null) | null>(null)
	const [measurementActive, setMeasurementActive] = useState(false)
	const [lastMeasurement, setLastMeasurement] = useState<number | null>(null)
	const handleCaptureReady = useCallback((nextCapture: (() => string | null) | null) => {
		// Store function-as-value, not as updater
		setCaptureCanvas(() => nextCapture)
	}, [])

	useEffect(() => {
		const hasSeenIntro = window.localStorage.getItem(BUILDER_INTRO_SEEN_KEY)
		const hasSeenControls = window.localStorage.getItem(BUILDER_INTRO_SEEN_KEY)
		if (!hasSeenIntro) setIsIntroOpen(true)
		if (!hasSeenControls) setIsOpen(true)
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

			const asset = assetsById.get(obj.assetId)
			const name = asset?.name ?? "Figurine"

			return {
				instanceId: obj.instanceId,
				label: `${name} ${currentCount}`,
			}
		})
	}, [placedObjects])

	const canGoToStep2 = Boolean(selectedPlatformId)
	const canGoToCheckout = canGoToStep2 && placedObjects.filter((obj) => obj.assetId !== 'custom-object').length > 0
	const canClearScene = Boolean(selectedPlatformId) || placedObjects.length > 0
	const selectedScaleLimits = getAssetScaleLimits(selectedObjectAsset)
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
		const colorToUse = selectedPlatformColor ?? normalizedColor;

		selectPlatformInStore(asset.id, colorToUse)
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

	const handleClearScene = useCallback(() => {
		setIsClearModalOpen(true)
	}, [])

	const confirmClearScene = useCallback(() => {
		resetScene()
		setOutlineSelection(null)
		setSelectedPartColorInputs({})
		setSelectedPlatformColorInput(DEFAULT_PLATFORM_COLOR)
		setIsClearModalOpen(false)
	}, [resetScene])

	type HelpItem = {
		icon: string
		label: string
		iconWidthClassName?: string
	}

	const helpItems = useMemo<HelpItem[]>(() => [
		{ icon: "Mouse", label: "Linker muisklik + slepen: scene draaien" },
		{ icon: "SquareChevronUp", label: "Ctrl + klik + slepen: scene schuiven" },
		{ icon: "MoveVertical", label: "Scrollen: zoomen" },
		{ icon: "MousePointerClick", label: "Klik op modellen om te selecteren" },
		{ icon: "Sliders", label: "Gebruik sliders om het model aan te passen" },
		{ icon: "Paintbrush2", label: "Gebruik kleurbalken om kleur aan te passen" },
		{ icon: "Ruler", label: "Zet measure aan om 2 punten te meten" },
	], [])

	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) return null

	async function goToCheckoutOverview() {
		if (!selectedPlatform) return

		let previewImage: string | undefined
		try {
			// Hide the grid, wait 2 frames so R3F renders a clean frame without it, then capture
			setSelectedId(null)
			setOutlineSelection(null)
			setIsCapturing(true)

			await new Promise<void>((resolve) => {
				requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
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
			platformSize: selectedPlatformSize,
			platformColor: selectedPlatformColor,
			decorations: placedObjects
				.filter((obj) => obj.assetId !== 'custom-object') // Exclude custom objects from checkout
				.map((obj) => ({
					instanceId: obj.instanceId,
					assetId: obj.assetId,
					name: assetsById.get(obj.assetId)?.name ?? "Onbekend",
					position: obj.position,
					rotationY: obj.rotationY,
					scale: obj.scale,
					color: obj.color,
					partColors: obj.partColors,
				})),
			totalItems: placedObjects.filter((obj) => obj.assetId !== 'custom-object').length, // Exclude custom objects from count
			createdAt: new Date().toISOString(),
			previewImage,
		})

		router.push("/checkout/overview")
	}

	return (
		<main className="h-[calc(100vh-120px)] bg-[#1A1C1E] text-white">
			<BuilderIntroModal isOpen={isIntroOpen} onCloseAction={closeIntro} />
			<BuilderResetConfirmModal
				isOpen={isClearModalOpen}
				onCancelAction={() => setIsClearModalOpen(false)}
				onConfirmAction={confirmClearScene}
			/>
			<div className="grid h-full grid-cols-[260px_1fr_300px] gap-4">

				{/* Left Sidebar */}
				<div className="flex flex-col overflow-hidden bg-white/5">
					{/* Hierarchy */}
					<div className="shrink-0 border-b border-white/10">
						<button
							type="button"
							onClick={() => setHierarchyOpen((o) => !o)}
							className="flex w-full items-center justify-between p-3 text-left hover:cursor-pointer"
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
								<P className="text-white/80">Platform: {selectedPlatform?.name ?? "Nog niet gekozen"}</P>
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
												className={`block w-full rounded px-2 py-1 text-left hover:cursor-pointer ${
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
											className={`rounded-lg border p-2 text-left transition hover:cursor-pointer ${active
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
								{/* Image to 3D Upload */}
								<div className="border-b border-white/10 mt-2 pb-4 mb-4">
									<ImageTo3D onAddToScene={addCustomObjectToStore} />
								</div>

								<H2>Voeg decoraties toe</H2>
								<div className="grid grid-cols-2 gap-2">
									{decorationAssets.map((asset) => (
										<button
											key={asset.id}
											type="button"
											onClick={() => addObject(asset)}
											className="rounded-lg border border-white/20 p-2 transition hover:border-[#98CEAA] hover:cursor-pointer"
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
						<StepButtons
							steps={stepItems}
							onInfoClick={() => setIsIntroOpen(true)}
						/>
					</div>

				{/* Canvas */}
				<div className="relative flex-1">
					<MeasurementDisplay distance={lastMeasurement} isActive={measurementActive} />
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
										scaleVector={getPlatformModelScaleVector(selectedPlatformSize)}
										tintColor={selectedPlatformColor}
									/>
								)}

								{/* Measurement Tool */}
								{step === 2 && (
									<MeasurementTool
										enabled={measurementActive}
										onMeasure={setLastMeasurement}
									/>
								)}

								{placedObjects.map((obj) => {
									const asset = assetsById.get(obj.assetId)
									if (asset) {
										// Regular GLTF object
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
									} else if (obj.customGeometry) {
										// Custom object from image
										const geometry = new THREE.BufferGeometry()
										geometry.setAttribute('position', new THREE.Float32BufferAttribute(obj.customGeometry.vertices, 3))
										if (obj.customGeometry.indices) {
											geometry.setIndex(obj.customGeometry.indices)
										}
										if (obj.customGeometry.normals) {
											geometry.setAttribute('normal', new THREE.Float32BufferAttribute(obj.customGeometry.normals, 3))
										}
										if (obj.customGeometry.uvs) {
											geometry.setAttribute('uv', new THREE.Float32BufferAttribute(obj.customGeometry.uvs, 2))
										}
										geometry.computeBoundingBox()
										geometry.computeVertexNormals()

										return (
											<CustomObject
												key={obj.instanceId}
												geometry={geometry}
												position={obj.position}
												rotationY={obj.rotationY}
												rotationZ={obj.rotationZ}
												scaleXY={obj.scaleXY}
												scaleZ={obj.scaleZ}
												color={obj.color}
												instanceId={obj.instanceId}
												onReady={selectedId === obj.instanceId ? setOutlineSelection : undefined}
											/>
										)
									}
									return null
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

						{isOpen && (
							<div className="absolute top-3 right-3 z-20 w-[min(92vw,28rem)] rounded-2xl border border-white/20 bg-[#1F2126]/95 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.45)] backdrop-blur-sm">
								<div className="mb-4 flex items-center justify-between">
									<div className="ml-2 flex items-center gap-6">
										<Icon name="Info" size={20} color="#98CEAA" />
										<H2>Controls</H2>
									</div>
									<button
										type="button"
										onClick={() => setIsOpen(false)}
										className="rounded-md px-2 py-1 hover:cursor-pointer"
										aria-label="Sluit hulp"
									>
										<Icon name="X" size={30} color="#FFFFFF" />
									</button>
								</div>

								<div className="space-y-5">
									{helpItems.map((item) => (
										<div key={item.label} className="flex items-center gap-3">
											<div className={`flex h-10 ${item.iconWidthClassName ?? "w-10"} items-center justify-center rounded-lg bg-white/5`}>
												<Icon name={item.icon} size={20} color="#98CEAA" />
											</div>
											<H3 className="text-white/90">{item.label}</H3>
										</div>
									))}
								</div>
							</div>
						)}

						{/*Interaction buttons*/}
						<div className="absolute z-10 bottom-[clamp(0.75rem,2vh,1.5rem)] right-[clamp(0.75rem,2vw,1.5rem)] flex flex-col gap-5">
							<button
								type="button"
								onClick={() => setIsOpen((prev) => !prev)}
								className="flex items-center justify-center rounded-full border border-[#98CEAA]/60 bg-black/20 backdrop-blur-sm transition hover:bg-[#2A2D31] hover:cursor-pointer h-[clamp(3rem,6vmin,5rem)] w-[clamp(3rem,6vmin,5rem)]"
								aria-label={isOpen ? "Verberg hulp" : "Toon hulp"}
								title={isOpen ? "Verberg hulp" : "Toon hulp"}
							>
								<Icon
									name="CircleQuestionMark"
									size={25}
									color={isOpen ? "#98CEAA" : "#d0e3d3"}
									className="h-[clamp(1.25rem,3vmin,1.75rem)] w-[clamp(1.25rem,3vmin,1.75rem)]"
								/>
							</button>

							<button
								type="button"
								onClick={() => setMeasurementActive((prev) => !prev)}
								className="flex items-center justify-center rounded-full border border-[#98CEAA]/60 bg-black/20 backdrop-blur-sm transition hover:bg-[#2A2D31] hover:cursor-pointer bottom-[clamp(0.75rem,2vh,1.5rem)] right-[clamp(5.5rem,11vw,6.5rem)] h-[clamp(3rem,6vmin,5rem)] w-[clamp(3rem,6vmin,5rem)]"
								aria-label={measurementActive ? "Meet modus uit" : "Meet modus aan"}
								title={measurementActive ? "Meet modus uit" : "Meet modus aan"}
								disabled={step !== 2}
							>
								<Icon name="Ruler" size={25} color={measurementActive ? "#98CEAA" : "#d0e3d3"} className="h-[clamp(1.25rem,3vmin,1.75rem)] w-[clamp(1.25rem,3vmin,1.75rem)]" />
							</button>

							<button
								type="button"
								onClick={() => setShowGrid((prev) => !prev)}
								className="flex items-center justify-center rounded-full border border-[#98CEAA]/60 bg-black/20 backdrop-blur-sm transition hover:bg-[#2A2D31] hover:cursor-pointer bottom-[clamp(0.75rem,2vh,1.5rem)] right-[clamp(0.75rem,2vw,1.5rem)] h-[clamp(3rem,6vmin,5rem)] w-[clamp(3rem,6vmin,5rem)]"
								aria-label={showGrid ? "Verberg grid" : "Toon grid"}
								title={showGrid ? "Verberg grid" : "Toon grid"}
							>
								<Icon name="Grid" size={25} color={showGrid ? "#d0e3d3" : "#98CEAA"} className="h-[clamp(1.25rem,3vmin,1.75rem)] w-[clamp(1.25rem,3vmin,1.75rem)]" />
							</button>
						</div>
                        <div className={"absolute z-10 bottom-[clamp(0.75rem,2vh,1.5rem)] left-[clamp(0.75rem,2vw,1.5rem)]"}>
                            <DeleteSceneButton onClearClick={handleClearScene} clearDisabled={!canClearScene}></DeleteSceneButton>
                        </div>
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
										<H3 className="max-w-55">Kies een platform en selecteer je maat</H3>
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
										<H3 className={"border-t border-white/10 pt-6"}>Kies maat:</H3>
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
									<H3>{selectedObjectAsset?.name ?? "Figurine"}</H3>
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

								{/* Y Positie — alleen voor custom objects */}
								{selectedObject.assetId === 'custom-object' && (
									<SliderInput
										label="Positie Y"
										value={selectedObject.position[1]}
										onChange={(y) => {
											const clamped = clamp(y, -2, 4)
											updateSelected((o) => ({ ...o, position: [o.position[0], clamped, o.position[2]] }))
										}}
										min={-2}
										max={4}
										step={POSITION_STEP}
									/>
								)}

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

								{/* Rotatie Z — alleen voor custom objects */}
								{selectedObject.assetId === 'custom-object' && (
									<SliderInput
										label="Rotatie Z"
										value={selectedObject.rotationZ ?? 1}
										onChange={(rotationZ) => {
										const clamped = clamp(rotationZ, ROTATION_MIN, ROTATION_MAX)
										updateSelected((o) => ({ ...o, rotationZ: clamped }))
									}}
										min={ROTATION_MIN}
										max={ROTATION_MAX}
										step={ROTATION_STEP}
										displayFormat={(rad) => radiansToDegrees(rad).toString()}
										parseDisplay={(deg) => degreesToRadians(Number(deg))}
										displayMinMax={(v) => (v === ROTATION_MIN ? "0°" : "360°")}
									/>
								)}

								{/* Schaal — gesplitst voor custom objects, uniform voor normale */}
								{selectedObject.assetId === 'custom-object' ? (
									<>
										<SliderInput
											label="Schaal"
											value={selectedObject.scaleXY ?? 0}
											onChange={(v) => updateSelected((o) => ({ ...o, scaleXY: clamp(v, selectedScaleLimits.min, selectedScaleLimits.max) }))}
											min={selectedScaleLimits.min}
											max={selectedScaleLimits.max}
											step={SCALE_STEP}
										/>

										<SliderInput
											label="Schaal Z"
											value={selectedObject.scaleZ ?? 0}
											onChange={(v) => updateSelected((o) => ({ ...o, scaleZ: clamp(v, selectedScaleLimits.min, selectedScaleLimits.max) }))}
											min={selectedScaleLimits.min}
											max={selectedScaleLimits.max}
											step={SCALE_STEP}
										/>
									</>
								) : (
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
								)}

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
									className="w-full rounded-md border border-red-400/50 bg-red-500/20 px-3 py-2 text-sm text-red-100 mt-10 hover:cursor-pointer"
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
								<H3 className="max-w-55">Selecteer een model om deze aan te passen</H3>
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
