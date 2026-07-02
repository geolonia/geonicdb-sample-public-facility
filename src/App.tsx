import { useCallback, useEffect, useState } from 'react'
import {
  listEntities,
  createEntity,
  deleteEntity,
  getVersion,
  type Attribute,
  type Entity,
  type VersionInfo,
} from './lib/ngsi'
import './App.css'

function App() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [version, setVersion] = useState<VersionInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [entityId, setEntityId] = useState('urn:ngsi-ld:Sensor:001')
  const [entityType, setEntityType] = useState('Sensor')
  const [attrName, setAttrName] = useState('temperature')
  const [attrType, setAttrType] = useState('Number')
  const [attrValue, setAttrValue] = useState('25.5')

  const fetchEntities = useCallback(async () => {
    try {
      const data = await listEntities({ limit: 100 })
      setEntities(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entities')
    }
  }, [])

  const fetchVersion = useCallback(async () => {
    try {
      const data = await getVersion()
      setVersion(data)
    } catch {
      // GeonicDB might not be ready yet
    }
  }, [])

  useEffect(() => {
    fetchVersion()
    fetchEntities()
    const interval = setInterval(fetchVersion, 10000)
    return () => clearInterval(interval)
  }, [fetchVersion, fetchEntities])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let parsedValue: Attribute['value'] = attrValue
      if (attrType === 'Number') {
        parsedValue = Number(attrValue)
        if (isNaN(parsedValue as number)) throw new Error('Number 型の値が不正です')
      } else if (attrType === 'Boolean') {
        parsedValue = attrValue === 'true'
      }

      await createEntity({
        id: entityId,
        type: entityType,
        [attrName]: { type: attrType, value: parsedValue },
      })
      await fetchEntities()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entity')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await deleteEntity(id)
      await fetchEntities()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>GeonicDB Template App</h1>
        <div className="status">
          {version ? (
            <span className="status-online">
              GeonicDB v{version.orion.version}
            </span>
          ) : (
            <span className="status-offline">GeonicDB: connecting...</span>
          )}
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="create-form">
        <h2>Create Entity</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              Entity ID
              <input
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="urn:ngsi-ld:Sensor:001"
                required
              />
            </label>
            <label>
              Entity Type
              <input
                type="text"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                placeholder="Sensor"
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Attribute Name
              <input
                type="text"
                value={attrName}
                onChange={(e) => setAttrName(e.target.value)}
                placeholder="temperature"
                required
              />
            </label>
            <label>
              Attribute Type
              <select value={attrType} onChange={(e) => setAttrType(e.target.value)}>
                <option value="Number">Number</option>
                <option value="Text">Text</option>
                <option value="Boolean">Boolean</option>
              </select>
            </label>
            <label>
              Value
              <input
                type="text"
                value={attrValue}
                onChange={(e) => setAttrValue(e.target.value)}
                placeholder="25.5"
                required
              />
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Entity'}
          </button>
        </form>
      </section>

      <section className="entity-list">
        <h2>
          Entities
          <button className="refresh-btn" onClick={fetchEntities} disabled={loading}>
            ↻
          </button>
        </h2>
        {entities.length === 0 ? (
          <p className="empty">No entities yet. Create one above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Attributes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => {
                const attrs = Object.entries(entity).filter(
                  ([key]) => key !== 'id' && key !== 'type',
                )
                return (
                  <tr key={entity.id}>
                    <td className="entity-id">{entity.id}</td>
                    <td>{entity.type}</td>
                    <td className="attrs">
                      {attrs.map(([key, val]) => (
                        <span key={key} className="attr-badge">
                          {key}:{' '}
                          {JSON.stringify(
                            typeof val === 'object' && val !== null && 'value' in val
                              ? val.value
                              : val,
                          )}
                        </span>
                      ))}
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(entity.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default App
