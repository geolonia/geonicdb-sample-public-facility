import {
  NgsiV2Client,
  type NgsiV2Entity,
  type NgsiV2Attribute,
  type NgsiV2QueryOptions,
} from '@geolonia/geonicdb-sdk/ngsi-v2'

// Re-export SDK types under the names App.tsx expects
export type Entity = NgsiV2Entity
export type Attribute = NgsiV2Attribute

const baseUrl = (import.meta.env.VITE_GEONICDB_URL as string ?? '').replace(/\/+$/, '')

const client = new NgsiV2Client({ baseUrl })

export interface VersionInfo {
  orion: {
    version: string
    [key: string]: unknown
  }
}

// getVersion: no equivalent in SDK — keep as raw fetch against Orion's /version endpoint
export async function getVersion(): Promise<VersionInfo> {
  const res = await fetch(`${baseUrl}/version`)
  if (!res.ok) throw new Error(`GET /version failed: ${res.status}`)
  return res.json() as Promise<VersionInfo>
}

export async function listEntities(params?: NgsiV2QueryOptions): Promise<NgsiV2Entity[]> {
  return client.getEntities(params)
}

export async function createEntity(entity: NgsiV2Entity): Promise<void> {
  return client.createEntity(entity)
}

export async function deleteEntity(entityId: string): Promise<void> {
  return client.deleteEntity(entityId)
}
