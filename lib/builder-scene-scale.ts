export const MODEL_SCALE_MULTIPLIER = 20
export const BASE_PLATFORM_SIZE_CM = 10

export function getPlatformSizeScaleMultiplier(platformSizeCm: number) {
	return platformSizeCm / BASE_PLATFORM_SIZE_CM
}

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

