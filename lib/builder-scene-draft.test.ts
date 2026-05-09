import { describe, it, expect, beforeEach } from 'vitest'
import {
    saveBuilderSceneDraft,
    readBuilderSceneDraft,
    clearBuilderSceneDraft,
    BuilderSceneDraft,
} from './builder-scene-draft'

const mockDraft: BuilderSceneDraft = {
    version: 1,
    step: 1,
    selectedPlatformId: 'platform-1',
    selectedPlatformColor: '#228B22',
    selectedPlatformSize: 10,
    placedObjects: [],
    selectedId: null,
    nextId: 0,
    updatedAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
    localStorage.clear()
})

describe('saveBuilderSceneDraft', () => {
    it('slaat een draft op in localStorage', () => {
        saveBuilderSceneDraft(mockDraft)
        const raw = localStorage.getItem('builder-scene-draft')
        expect(raw).not.toBeNull()
        expect(JSON.parse(raw!)).toEqual(mockDraft)
    })

    it('overschrijft een bestaande draft', () => {
        saveBuilderSceneDraft(mockDraft)
        saveBuilderSceneDraft({ ...mockDraft, selectedPlatformColor: '#FF0000' })
        const result = readBuilderSceneDraft()
        expect(result?.selectedPlatformColor).toBe('#FF0000')
    })
})

describe('readBuilderSceneDraft', () => {
    it('geeft null terug als er niets opgeslagen is', () => {
        expect(readBuilderSceneDraft()).toBeNull()
    })

    it('leest een opgeslagen draft correct terug', () => {
        saveBuilderSceneDraft(mockDraft)
        const result = readBuilderSceneDraft()
        expect(result).toEqual(mockDraft)
    })

    it('geeft null terug bij ongeldige JSON', () => {
        localStorage.setItem('builder-scene-draft', 'dit is geen json {{{')
        expect(readBuilderSceneDraft()).toBeNull()
    })

    it('geeft null terug bij lege string', () => {
        localStorage.setItem('builder-scene-draft', '')
        expect(readBuilderSceneDraft()).toBeNull()
    })
})

describe('clearBuilderSceneDraft', () => {
    it('verwijdert de draft uit localStorage', () => {
        saveBuilderSceneDraft(mockDraft)
        clearBuilderSceneDraft()
        expect(readBuilderSceneDraft()).toBeNull()
    })

    it('doet niets als er geen draft is', () => {
        expect(() => clearBuilderSceneDraft()).not.toThrow()
    })
})

describe('draft met placedObjects', () => {
    it('slaat objecten correct op en leest ze terug', () => {
        const draftMetObjecten: BuilderSceneDraft = {
            ...mockDraft,
            placedObjects: [
                {
                    instanceId: 'tree-1',
                    assetId: 'tree-model',
                    position: [0, 0.2, 0],
                    rotationY: 0,
                    rotationZ: 0,
                    scale: 1,
                    scaleXY: 1,
                    scaleZ: 1,
                    color: '#FFFFFF',
                    partColors: { trunk: '#8B4513', leaves: '#228B22' },
                },
            ],
        }

        saveBuilderSceneDraft(draftMetObjecten)
        const result = readBuilderSceneDraft()

        expect(result?.placedObjects).toHaveLength(1)
        expect(result?.placedObjects[0].instanceId).toBe('tree-1')
        expect(result?.placedObjects[0].partColors).toEqual({
            trunk: '#8B4513',
            leaves: '#228B22',
        })
    })
})