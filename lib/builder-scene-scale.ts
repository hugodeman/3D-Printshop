/**
 * Scene-to-print scaling utilities.
 *
 * Three.js scene units do not directly correspond to
 * printable real-world dimensions.
 *
 * These helpers convert builder dimensions to consistent
 * scene scales so exported models maintain the expected
 * physical size when printed.
 */

export const MODEL_SCALE_MULTIPLIER = 20
export const BASE_PLATFORM_SIZE_CM = 10

export function getPlatformSizeScaleMultiplier(platformSizeCm: number) {
	return platformSizeCm / BASE_PLATFORM_SIZE_CM
}

/**
 * Calculates the platform scale vector for a platform size.
 *
 * Platform height remains constant while width and depth
 * scale according to the selected platform diameter.
 */

export function getPlatformModelScaleVector(platformSizeCm: number): [number, number, number] {
	const sizeMultiplier = getPlatformSizeScaleMultiplier(platformSizeCm)
	return [
		MODEL_SCALE_MULTIPLIER * sizeMultiplier,
		MODEL_SCALE_MULTIPLIER,
		MODEL_SCALE_MULTIPLIER * sizeMultiplier,
	]
}

export function getDecorationModelScale(scale = 1) {
	return MODEL_SCALE_MULTIPLIER * scale
}

