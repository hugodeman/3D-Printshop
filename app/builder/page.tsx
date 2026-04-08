"use client"

import { Suspense, useMemo, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid, useGLTF } from "@react-three/drei"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Color, type Material, type Mesh, type Object3D } from "three"

import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { H3, P } from "@/components/ui/Typography"
import { saveBuilderCheckoutDraft } from "@/lib/builder-checkout-draft"

import rawModelAssets from "./model-assets.json"

type PartColors = Record<string, string>
type Vec3 = [number, number, number]

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

function GLTFObject({
	modelPath,
	position,
	rotationY,
	scale,
	tintColor,
	partColors,
}: {
	modelPath: string
	position: Vec3
	rotationY?: number
	scale?: number
	tintColor: string
	partColors?: PartColors
}) {
	const gltf = useGLTF(modelPath)

	const scene = useMemo(() => {
		const clone = gltf.scene.clone(true)
		applyModelTint(clone, tintColor, partColors)
		return clone
	}, [gltf.scene, tintColor, partColors])

	return (
		<primitive
			object={scene}
			position={position}
			rotation={[0, rotationY ?? 0, 0]}
			scale={PREVIEW_SCALE_MULTIPLIER * (scale ?? 1)}
		/>
	)
}

export default function BuilderPage() {
	const router = useRouter()
	const [step, setStep] = useState<BuilderStep>(1)
	const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
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

	function addObject(asset: ModelAsset) {
		if (asset.kind !== "decoration") return

		nextId.current += 1
		const instanceId = `${asset.id}-${nextId.current}`

		setPlacedObjects((prev) => {
			const position = asset.spawnPosition ?? DEFAULT_SPAWN_POSITION

			return [
				...prev,
				{
					instanceId,
					assetId: asset.id,
					position,
					rotationY: 0,
					scale: 1,
					color: asset.color,
					partColors: asset.partColors,
				},
			]
		})

		setSelectedId(instanceId)
	}

	function updateSelected(updater: (o: PlacedObject) => PlacedObject) {
		if (!selectedId) return
		setPlacedObjects((prev) => prev.map((o) => (o.instanceId === selectedId ? updater(o) : o)))
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
								<H3>Voeg decoraties toe</H3>
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
											modelPath={asset.modelPath}
											position={obj.position}
											rotationY={obj.rotationY}
											scale={obj.scale}
											tintColor={obj.color}
											partColors={obj.partColors}
										/>
									)
								})}
							</Suspense>

							<OrbitControls makeDefault minDistance={1.5} maxDistance={30} />
						</Canvas>
					</div>
				</div>

				{/* Right Sidebar */}
				<div className="flex flex-col overflow-hidden bg-white/5">
					<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
						<H3>Aanpassen</H3>

						{selectedObject ? (
							<div className="flex flex-col gap-3">
								<P>{selectedObjectAsset?.name}</P>

								<label className="block text-xs">
									Positie X
									<input
										type="range"
										min={-8}
										max={8}
										step={0.1}
										value={selectedObject.position[0]}
										onChange={(e) => {
											const x = Number(e.currentTarget.value)
											updateSelected((o) => ({ ...o, position: [x, o.position[1], o.position[2]] }))
										}}
										className="w-full"
									/>
								</label>

								<label className="block text-xs">
									Positie Z
									<input
										type="range"
										min={-8}
										max={8}
										step={0.1}
										value={selectedObject.position[2]}
										onChange={(e) => {
											const z = Number(e.currentTarget.value)
											updateSelected((o) => ({ ...o, position: [o.position[0], o.position[1], z] }))
										}}
										className="w-full"
									/>
								</label>

								<label className="block text-xs">
									Rotatie Y
									<input
										type="range"
										min={-3.14}
										max={3.14}
										step={0.01}
										value={selectedObject.rotationY}
										onChange={(e) => {
											const rotationY = Number(e.currentTarget.value)
											updateSelected((o) => ({ ...o, rotationY }))
										}}
										className="w-full"
									/>
								</label>

								<label className="block text-xs">
									Schaal
									<input
										type="range"
										min={0.5}
										max={3}
										step={0.05}
										value={selectedObject.scale}
										onChange={(e) => {
											const scale = Number(e.currentTarget.value)
											updateSelected((o) => ({ ...o, scale }))
										}}
										className="w-full"
									/>
								</label>

								<button
									type="button"
									onClick={removeSelected}
									className="w-full rounded-md border border-red-400/50 bg-red-500/20 px-3 py-2 text-sm text-red-100"
								>
									Verwijder
								</button>
							</div>
						) : (
							<div className="mt-10 text-center text-white/40">
								<Icon name="Sliders" size={24} />
								<P className="mt-2 text-sm">Selecteer een object om te bewerken</P>
							</div>
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