import { vi, describe, it, expect, beforeEach } from 'vitest'

// vi.hoisted ensures these run before vi.mock() factory, even after hoisting
const mockGetEntities = vi.hoisted(() => vi.fn())
const mockCreateEntity = vi.hoisted(() => vi.fn())
const mockDeleteEntity = vi.hoisted(() => vi.fn())

vi.mock('@geolonia/geonicdb-sdk/ngsi-v2', () => ({
  NgsiV2Client: vi.fn(function (this: Record<string, unknown>) {
    this.getEntities = mockGetEntities
    this.createEntity = mockCreateEntity
    this.deleteEntity = mockDeleteEntity
  }),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { listEntities, createEntity, deleteEntity, getVersion } = await import('./ngsi')

describe('ngsi.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listEntities', () => {
    it('delegates to SDK getEntities with provided params', async () => {
      const entities = [{ id: 'urn:ngsi-ld:Sensor:001', type: 'Sensor' }]
      mockGetEntities.mockResolvedValueOnce(entities)

      const result = await listEntities({ limit: 10, type: 'Sensor' })

      expect(mockGetEntities).toHaveBeenCalledWith({ limit: 10, type: 'Sensor' })
      expect(result).toEqual(entities)
    })

    it('delegates to SDK getEntities with no params when called without args', async () => {
      mockGetEntities.mockResolvedValueOnce([])

      await listEntities()

      expect(mockGetEntities).toHaveBeenCalledWith(undefined)
    })

    it('propagates errors from the SDK', async () => {
      mockGetEntities.mockRejectedValueOnce(new Error('Network error'))

      await expect(listEntities()).rejects.toThrow('Network error')
    })
  })

  describe('createEntity', () => {
    it('delegates to SDK createEntity with the entity', async () => {
      const entity = {
        id: 'urn:ngsi-ld:Sensor:001',
        type: 'Sensor',
        temperature: { type: 'Number', value: 25.5 },
      }
      mockCreateEntity.mockResolvedValueOnce(undefined)

      await createEntity(entity)

      expect(mockCreateEntity).toHaveBeenCalledWith(entity)
    })

    it('propagates errors from the SDK', async () => {
      mockCreateEntity.mockRejectedValueOnce(new Error('Already exists'))

      await expect(createEntity({ id: 'x', type: 'y' })).rejects.toThrow('Already exists')
    })
  })

  describe('deleteEntity', () => {
    it('delegates to SDK deleteEntity with the entity ID', async () => {
      mockDeleteEntity.mockResolvedValueOnce(undefined)

      await deleteEntity('urn:ngsi-ld:Sensor:001')

      expect(mockDeleteEntity).toHaveBeenCalledWith('urn:ngsi-ld:Sensor:001')
    })

    it('propagates errors from the SDK', async () => {
      mockDeleteEntity.mockRejectedValueOnce(new Error('Not found'))

      await expect(deleteEntity('nonexistent')).rejects.toThrow('Not found')
    })
  })

  describe('getVersion', () => {
    it('fetches /version and returns parsed JSON', async () => {
      const versionData = { orion: { version: '3.10.1' } }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(versionData),
      })

      const result = await getVersion()

      expect(mockFetch).toHaveBeenCalledWith('/version')
      expect(result).toEqual(versionData)
    })

    it('throws when the response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })

      await expect(getVersion()).rejects.toThrow('GET /version failed: 503')
    })
  })
})
