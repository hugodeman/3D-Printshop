"use client"

import { Suspense, useMemo, useState } from "react"
import { Grid, OrbitControls, useGLTF } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import Image from "next/image"
import { Color, type Material, type Mesh, type Object3D } from "three"

// Keys zijn de node/mesh-namen zoals ze in het .glb-bestand staan.
// Tip: open je .glb op https://gltf.report/ of check de console om
// de exacte namen van child-nodes te ontdekken (zie ook het console.log hieronder).
type PartColors = Record<string, string>

type ModelAsset = {
	id: string
	name: string
	thumbnail: string
	kind: "model"
	modelPath: string
	color: string
	partColors?: PartColors
}

type PlacedObject = {
	instanceId: string
	assetId: string
	position: [number, number, number]
	color: string
	partColors?: PartColors
}

const PREVIEW_SCALE_MULTIPLIER = 20
const SCENE_ITEM_SPACING = 3.6

const modelAssets: ModelAsset[] = [
	{
		id: "cylinder-model",
		name: "Cirkel",
		thumbnail: "/object-cards/Cylinder.png",
		kind: "model",
		modelPath: "/models/Cylinder.glb",
		color: "#98CEAA",
	},
	{
		id: "square-model",
		name: "Vierkant",
		thumbnail: "/object-cards/Square.png",
		kind: "model",
		modelPath: "/models/Square.glb",
		color: "#A9B4FF",
	},
	{
		id: "Tree-model",
		name: "Boom",
		thumbnail: "/object-cards/Tree.png",
		kind: "model",
		modelPath: "/models/tree.glb",
		color: "#FFFFFF",
		partColors: {
			trunk:  "#8B4513",
			leaves: "#228B22",
		},
	},
]

useGLTF.preload("/models/Cylinder.glb")
useGLTF.preload("/models/Square.glb")

function tintMaterial(material: Material, color: string) {
	const clone = material.clone() as Material & { color?: Color }
	if (clone.color) {
		clone.color.set(color)
	}
	return clone
}

function applyModelTint(root: Object3D, defaultColor: string, partColors?: PartColors) {
	root.traverse((node) => {
		const mesh = node as Mesh
		if (!mesh.isMesh || !mesh.material) {
			return
		}

		// Zoek de kleur op basis van de node-naam; val terug op de standaardkleur.
		const color = partColors?.[node.name] ?? defaultColor

		if (Array.isArray(mesh.material)) {
			mesh.material = mesh.material.map((mat) => tintMaterial(mat, color))
			return
		}

		mesh.material = tintMaterial(mesh.material, color)
	})
}

function GLTFObject({
	modelPath,
	position,
	tintColor,
	partColors,
}: {
	modelPath: string
	position: [number, number, number]
	tintColor: string
	partColors?: PartColors
}) {
	const gltf = useGLTF(modelPath)
	const clonedScene = useMemo<Object3D>(() => {
		const sceneClone = gltf.scene.clone(true)

		// Dev-hulp: log alle node-namen zodat je weet welke keys je in partColors kunt gebruiken.
		if (process.env.NODE_ENV === "development") {
			const names: string[] = []
			sceneClone.traverse((n) => { if (n.name) names.push(n.name) })
			console.log(`[GLTFObject] node-namen in "${modelPath}":`, names)
		}

		applyModelTint(sceneClone, tintColor, partColors)
		return sceneClone
	}, [gltf.scene, tintColor, partColors, modelPath])

	return (
		<primitive
			object={clonedScene}
			position={position}
			scale={PREVIEW_SCALE_MULTIPLIER}
		/>
	)
}

function SceneObject({ asset, placedObject }: { asset: ModelAsset; placedObject: PlacedObject }) {
	return (
		<GLTFObject
			modelPath={asset.modelPath}
			position={placedObject.position}
			tintColor={placedObject.color}
			partColors={placedObject.partColors}
		/>
	)
}

export default function BuilderPage() {
	const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([])
	const assetLibrary = useMemo<ModelAsset[]>(() => modelAssets, [])
	const assetsById = useMemo(() => new Map(assetLibrary.map((asset) => [asset.id, asset])), [assetLibrary])

	function addObjectToScene(asset: ModelAsset) {
		setPlacedObjects((current) => {
			const column = current.length % 4
			const row = Math.floor(current.length / 4)
			const position: [number, number, number] = [
				column * SCENE_ITEM_SPACING - SCENE_ITEM_SPACING * 1.5,
				0.5,
				row * -SCENE_ITEM_SPACING,
			]

			return [
				...current,
				{
					instanceId: `${asset.id}-${Date.now()}-${current.length}`,
					assetId: asset.id,
					position,
					color: asset.color,
					partColors: asset.partColors, // per-part kleuren overnemen van de asset
				},
			]
		})
	}

	return (
		<main className="grid h-[calc(100vh-120px)] min-h-[520px] w-full grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_1fr]">
			<section className="rounded-md border border-black/20 bg-contrast-2 p-4 text-white">
				<h2 className="text-h2">Modellen</h2>
				<p className="mt-2 text-p text-white/80">
					Plaats .glb bestanden in <code>/public/models</code> en thumbnails in <code>/public/object-cards</code>.
				</p>
				<p className="mt-2 text-p text-white/70">
					Preview is visueel opgeschaald voor duidelijkheid. Printformaat blijft gebaseerd op je echte modelmaten.
				</p>

				<div className="mt-4 grid grid-cols-2 gap-3">
					{assetLibrary.map((asset) => (
						<button
							key={asset.id}
							type="button"
							onClick={() => addObjectToScene(asset)}
							className="rounded-md border border-black/30 bg-black/20 p-2 text-left transition hover:bg-black/35"
						>
							<Image
								src={asset.thumbnail}
								alt={asset.name}
								width={400}
								height={240}
								className="h-24 w-full rounded object-cover"
							/>
							<p className="mt-2 text-p">{asset.name}</p>
						</button>
					))}
				</div>
			</section>

			<section className="rounded-md border border-black/20">
				<Canvas camera={{ position: [4.5, 4.5, 4.5], fov: 46 }}>
					<color attach="background" args={["#1F2126"]} />
					<ambientLight intensity={0.5} />
					<directionalLight position={[6, 9, 4]} intensity={1.2} />

					<Grid
						args={[20, 20]}
						cellSize={0.2}
						cellThickness={0.5}
						// sectionColor={"#D9D9D9"}
						sectionSize={1}
						sectionThickness={1}
						fadeDistance={18}
						fadeStrength={1}
						infiniteGrid
					/>

					<Suspense fallback={null}>
						{placedObjects.map((placedObject) => {
							const asset = assetsById.get(placedObject.assetId)

							if (!asset) {
								return null
							}

							return (
								<SceneObject
									key={placedObject.instanceId}
									asset={asset}
									placedObject={placedObject}
								/>
							)
						})}
					</Suspense>

					<OrbitControls makeDefault minDistance={1.5} maxDistance={30} />
				</Canvas>
			</section>
		</main>
	)
}
