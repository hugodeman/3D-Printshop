"use client"

import { Suspense, useMemo, useRef, useState, useEffect } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Grid, useGLTF } from "@react-three/drei"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Color, type Material, type Mesh, type Object3D, Raycaster, Vector2, type Group as THREE_Group } from "three"

import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import {H2, H3, P} from "@/components/ui/Typography"
import { saveBuilderCheckoutDraft } from "@/lib/builder-checkout-draft"

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

type BuilderStep = 1 | 2

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
const DEFAULT_SPAWN_POSITION: Vec3 = [0, 0, 0]
const POSITION_MIN = -1
const POSITION_MAX = 1
const POSITION_STEP = 0.05
const ROTATION_MIN = -3.14
const ROTATION_MAX = 3.14
const ROTATION_STEP = 0.02
const SCALE_MIN = 0.5
const SCALE_MAX = 3
const SCALE_STEP = 0.05
const BASE_PLATFORM_SIZE_CM = 10

const modelAssets = rawModelAssets as ModelAsset[]

for (const asset of modelAssets) {
	useGLTF.preload(asset.modelPath)
}

function tintMaterial(material: Material, color: string) {
	const clone = material.clone() as Material & { color?: Color }
	if (clone.color) clone.color.set(color)
	return clone
}

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

function toNumber(value: string) {
	const next = Number(value)
	return Number.isFinite(next) ? next : null
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
	isSelected,
	instanceId,
}: {
	modelPath: string
	position: Vec3
	rotationY?: number
	scale?: number
	scaleVector?: Vec3
	tintColor: string
	partColors?: PartColors
	isSelected?: boolean
	instanceId?: string
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

		// Add orange glow if selected
		if (isSelected) {
			clone.traverse((node) => {
				const mesh = node as Mesh
				if (!mesh.isMesh || !mesh.material) return

				const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
				materials.forEach((mat) => {
					const m = mat as Material & { emissive?: Color; emissiveIntensity?: number }
					if (m.emissive) {
						m.emissive.set("#FF8C00")
						m.emissiveIntensity = 0.5
					}
				})
			})
		}

		return clone
	}, [gltf.scene, tintColor, partColors, isSelected, instanceId])

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

function ClickHandler({
	placedObjects,
	onSelectDecoration,
}: {
	placedObjects: PlacedObject[]
	onSelectDecoration: (instanceId: string) => void
}) {
	const { camera, gl, scene } = useThree()
	const raycaster = useRef(new Raycaster())
	const mouse = useRef(new Vector2())

	useEffect(() => {
		const handleCanvasClick = (event: PointerEvent) => {
			// Ignore clicks on non-canvas elements (like sliders)
			if (!(event.target instanceof HTMLCanvasElement)) return

			const canvas = event.target as HTMLCanvasElement
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
			}
		}

		const canvas = gl.domElement
		canvas.addEventListener("pointerdown", handleCanvasClick, { capture: false })

		return () => {
			canvas.removeEventListener("pointerdown", handleCanvasClick, false)
		}
	}, [camera, scene, placedObjects, gl.domElement, onSelectDecoration])

	return null
}

export default function BuilderPage() {
	const router = useRouter()
	const [step, setStep] = useState<BuilderStep>(1)
	const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
	const [selectedPlatformSize, setSelectedPlatformSize] = useState<10 | 15 | 20>(10)
	const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([])
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const nextId = useRef(0)

	const platformAssets = useMemo(() => modelAssets.filter((a) => a.kind === "platform"), [])
	const decorationAssets = useMemo(() => modelAssets.filter((a) => a.kind === "decoration"), [])
	const assetsById = useMemo(() => new Map(modelAssets.map((a) => [a.id, a])), [])

	const selectedPlatform = selectedPlatformId ? (assetsById.get(selectedPlatformId) ?? null) : null
	const selectedObject = placedObjects.find((o) => o.instanceId === selectedId) ?? null
	const selectedObjectAsset = selectedObject ? assetsById.get(selectedObject.assetId) : null

	const hierarchyRows = useMemo(
		() =>
			placedObjects.map((obj, i) => ({
				instanceId: obj.instanceId,
				label: `${assetsById.get(obj.assetId)?.name ?? "Onbekend"} ${i + 1}`,
			})),
		[placedObjects, assetsById],
	)

	const canGoToStep2 = Boolean(selectedPlatformId)
	const canGoToCheckout = canGoToStep2 && placedObjects.length > 0
	const selectedScaleLimits = useMemo(() => getAssetScaleLimits(selectedObjectAsset), [selectedObjectAsset])
	const platformSizeScaleMultiplier = selectedPlatformSize / BASE_PLATFORM_SIZE_CM

	function addObject(asset: ModelAsset) {
		if (asset.kind !== "decoration") return

		nextId.current += 1
		const instanceId = `${asset.id}-${nextId.current}`

		setPlacedObjects((prev) => {
			const position = asset.spawnPosition ?? DEFAULT_SPAWN_POSITION
			const scaleLimits = getAssetScaleLimits(asset)

			return [
				...prev,
				{
					instanceId,
					assetId: asset.id,
					position,
					rotationY: 0,
					scale: clamp(1, scaleLimits.min, scaleLimits.max),
					color: asset.color,
					partColors: asset.partColors,
				},
			]
		})

		setSelectedId(instanceId)
	}

	function updateSelected(updater: (o: PlacedObject) => PlacedObject) {
		if (!selectedId) return
		setPlacedObjects((prev) =>
			prev.map((o) => {
				if (o.instanceId !== selectedId) return o
				const next = updater(o)
				const limits = getAssetScaleLimits(assetsById.get(next.assetId) ?? null)
				return { ...next, scale: clamp(next.scale, limits.min, limits.max) }
			}),
		)
	}

	function removeSelected() {
		if (!selectedId) return
		setPlacedObjects((prev) => prev.filter((o) => o.instanceId !== selectedId))
		setSelectedId(null)
	}

	function goToCheckoutOverview() {
		if (!selectedPlatform) return

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
		})

		router.push("/checkout/overview")
	}

	return (
		<main className="h-[calc(100vh-120px)] bg-[#1A1C1E] text-white">
			<div className="grid h-full grid-cols-[260px_1fr_300px] gap-4">

				{/* Left Sidebar */}
				<div className="flex flex-col overflow-hidden bg-white/5">
					<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
						{/* Hierarchy */}
						<div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
							<P className="mb-1 font-medium text-white/90">Hierarchy</P>
							<P className="text-white/60">Platform: {selectedPlatform?.name ?? "Nog niet gekozen"}</P>
							<div className="mt-2 space-y-1">
								{hierarchyRows.length === 0 ? (
									<P className="text-white/40">- Geen decoraties</P>
								) : (
									hierarchyRows.map((row) => (
										<button
											key={row.instanceId}
											type="button"
											onClick={() => setSelectedId(row.instanceId)}
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

						{/* Step 1 */}
						{step === 1 && (
							<div className="flex flex-col gap-3">
								<H3>Kies een platform</H3>
								{platformAssets.map((asset) => {
									const active = selectedPlatformId === asset.id
									return (
										<button
											key={asset.id}
											type="button"
											onClick={() => setSelectedPlatformId(asset.id)}
											className={`rounded-lg border p-2 text-left transition ${
												active
													? "border-[#98CEAA] bg-[#98CEAA]/10"
													: "border-white/10 hover:border-white/30"
											}`}
										>
											<Image
												src={asset.thumbnail}
												alt={asset.name}
												width={300}
												height={200}
												className="h-auto w-full rounded object-cover"
											/>
											<div className={"flex flex-col gap-3 mt-1"}>
												<P className="mt-2 text-sm">{asset.name}</P>
												<P className={"text-white/60"}>{asset.dimensions} cm</P>
											</div>
										</button>
									)
								})}
							</div>
						)}

						{/* Step 2 */}
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
						<div className="mb-2 flex items-center gap-10">
							{[
								{
									id: 1,
									label: "Platform",
									done: step > 1,
									current: step === 1,
									onClick: () => setStep(1),
									disabled: false,
								},
								{
									id: 2,
									label: "Decoraties",
									done: step > 2,
									current: step === 2,
									onClick: () => setStep(2),
									disabled: !canGoToStep2,
								},
								{
									id: 3,
									label: "Bestellen",
									done: false,
									current: false,
									onClick: goToCheckoutOverview,
									disabled: !canGoToCheckout,
								},
							].map((s, index) => {
								const stateClasses = s.done
									? "!bg-[#6D8F78]/80 !text-[#1F2126] hover:!bg-[#6D8F78]"
									: s.current
										? "!bg-[#98CEAA] !text-[#1F2126]"
										: "!bg-[#CAC4D0]/50 !text-[#1F2126]/70"

								return (
									<div key={s.id} className="flex items-center gap-10">
										{index > 0 && <Icon name="Minus" size={30} color="#ffffff99" />}
										<Button
											variant={s.current ? "primary" : "secondary"}
											isActive={s.current}
											disabled={s.disabled}
											onClick={s.onClick}
											className={`flex items-center gap-4 px-3 py-2 rounded-full! text-[#1F2126]! ${stateClasses}`}
											style={
												s.current
													? { boxShadow: "0 10px 15px rgba(179,234,197,0.15)" }
													: undefined
											}
										>
											{s.done && <Icon name="CircleCheck" color="#B3EAC5" size={22} />}
											<H3 className="text-contrast">Stap {s.id}: {s.label}</H3>
										</Button>
									</div>
								)
							})}
						</div>
					</div>

					{/* Canvas */}
					<div className="flex-1">
						<Canvas camera={{ position: [4.5, 4.5, 4.5], fov: 46 }}>
							<color attach="background" args={["#1F2126"]} />
							<ambientLight intensity={0.5} />
							<directionalLight position={[6, 9, 4]} intensity={1.2} />

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

							<Suspense fallback={null}>
								{selectedPlatform && (
									<GLTFObject
										modelPath={selectedPlatform.modelPath}
										position={selectedPlatform.spawnPosition ?? [0, 0, 0]}
										scaleVector={[platformSizeScaleMultiplier, 1, platformSizeScaleMultiplier]}
										tintColor={selectedPlatform.color}
										partColors={selectedPlatform.partColors}
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
											isSelected={selectedId === obj.instanceId}
										/>
									)
								})}

								<ClickHandler
									placedObjects={placedObjects}
									onSelectDecoration={setSelectedId}
								/>
							</Suspense>

							<OrbitControls makeDefault minDistance={1.5} maxDistance={30} />
						</Canvas>
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
									</div>
								)}
							</div>
						) : (
							// step 2, selected
							<>

								{selectedObject ? (
							<div className="flex flex-col gap-5">
								<div className={"flex justify-between mr-2 mb-8 mt-3"}>
									<H3>Geselecteerd:</H3>
									<H3>{selectedObjectAsset?.name}</H3>
								</div>

								<label className="block text-xs">
									<div className="mb-1 mr-2 flex items-center justify-between">
										<P>Positie X</P>
										<input
											type="number"
											min={POSITION_MIN}
											max={POSITION_MAX}
											step={POSITION_STEP}
											value={selectedObject.position[0].toFixed(2)}
											onChange={(e) => {
												const value = toNumber(e.currentTarget.value)
												if (value === null) return
												const x = clamp(value, POSITION_MIN, POSITION_MAX)
												updateSelected((o) => ({ ...o, position: [x, o.position[1], o.position[2]] }))
											}}
											className="w-20 rounded border border-white/15 bg-black/30 px-2 py-1 text-right text-xs"
										/>
									</div>
									<input
										type="range"
										min={POSITION_MIN}
										max={POSITION_MAX}
										step={POSITION_STEP}
										value={selectedObject.position[0]}
										onChange={(e) => {
											const x = Number(e.currentTarget.value)
											updateSelected((o) => ({ ...o, position: [x, o.position[1], o.position[2]] }))
										}}
										className="slider w-full appearance-none rounded-lg bg-[#98CEAA]/65 p-2"
 									/>
								</label>

								<label className="block text-xs">
									<div className="mb-1 mr-2 flex items-center justify-between">
										<P>Positie Z</P>
										<input
											type="number"
											min={POSITION_MIN}
											max={POSITION_MAX}
											step={POSITION_STEP}
											value={selectedObject.position[2].toFixed(2)}
											onChange={(e) => {
												const value = toNumber(e.currentTarget.value)
												if (value === null) return
												const z = clamp(value, POSITION_MIN, POSITION_MAX)
												updateSelected((o) => ({ ...o, position: [o.position[0], o.position[1], z] }))
											}}
											className="w-20 rounded border border-white/15 bg-black/30 px-2 py-1 text-right text-xs"
										/>
									</div>
									<input
										type="range"
										min={POSITION_MIN}
										max={POSITION_MAX}
										step={POSITION_STEP}
										value={selectedObject.position[2]}
										onChange={(e) => {
											const z = Number(e.currentTarget.value)
											updateSelected((o) => ({ ...o, position: [o.position[0], o.position[1], z] }))
										}}
										className="slider w-full appearance-none rounded-lg bg-[#98CEAA]/65 p-2"
 									/>
								</label>

								<label className="block text-xs">
									<div className="mb-1 mr-2 flex items-center justify-between">
										<P>Rotatie Y</P>
										<input
											type="number"
											min={ROTATION_MIN}
											max={ROTATION_MAX}
											step={ROTATION_STEP}
											value={selectedObject.rotationY.toFixed(2)}
											onChange={(e) => {
												const value = toNumber(e.currentTarget.value)
												if (value === null) return
												const rotationY = clamp(value, ROTATION_MIN, ROTATION_MAX)
												updateSelected((o) => ({ ...o, rotationY }))
											}}
											className="w-20 rounded border border-white/15 bg-black/30 px-2 py-1 text-right text-xs"
										/>
									</div>
									<input
										type="range"
										min={ROTATION_MIN}
										max={ROTATION_MAX}
										step={ROTATION_STEP}
										value={selectedObject.rotationY}
										onChange={(e) => {
											const rotationY = clamp(Number(e.currentTarget.value), ROTATION_MIN, ROTATION_MAX)
											updateSelected((o) => ({ ...o, rotationY }))
										}}
										className="slider w-full appearance-none rounded-lg bg-[#98CEAA]/65 p-2"
 									/>
								</label>

								<label className="block text-xs">
									<div className="mb-1 mr-2 flex items-center justify-between">
										<P>Schaal</P>
										<input
											type="number"
											min={selectedScaleLimits.min}
											max={selectedScaleLimits.max}
											step={SCALE_STEP}
											value={selectedObject.scale.toFixed(2)}
											onChange={(e) => {
												const value = toNumber(e.currentTarget.value)
												if (value === null) return
												const scale = clamp(value, selectedScaleLimits.min, selectedScaleLimits.max)
												updateSelected((o) => ({ ...o, scale }))
											}}
											className="w-20 rounded border border-white/15 bg-black/30 px-2 py-1 text-right text-xs"
										/>
									</div>
									<input
										type="range"
										min={selectedScaleLimits.min}
										max={selectedScaleLimits.max}
										step={SCALE_STEP}
										value={selectedObject.scale}
										onChange={(e) => {
											const scale = clamp(Number(e.currentTarget.value), selectedScaleLimits.min, selectedScaleLimits.max)
											updateSelected((o) => ({ ...o, scale }))
										}}
										className="slider w-full appearance-none rounded-lg bg-[#98CEAA]/65 p-2"
 									/>
								</label>

								<button
									type="button"
									onClick={removeSelected}
									className="w-full rounded-md border border-red-400/50 bg-red-500/20 px-3 py-2 text-sm text-red-100 mt-5"
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


