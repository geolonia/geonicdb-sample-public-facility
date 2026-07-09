import { useState } from 'react'
import { useFacilities } from './hooks/useFacilities'
import { toPublicFacility } from './types/public-facility'
import type { PublicFacility } from './types/public-facility'
import { FacilityList } from './components/public-facility/FacilityList'
import { FacilityMapView } from './components/map/FacilityMapView'
import { FacilityDetail } from './components/public-facility/FacilityDetail'
import { Attribution } from './components/Attribution'
import './App.css'

type View = 'list' | 'map'

function App() {
  const { facilities: rawFacilities, loading, error } = useFacilities('PublicFacility')
  const facilities = rawFacilities.map(toPublicFacility)

  const [view, setView] = useState<View>('list')
  const [selectedFacility, setSelectedFacility] = useState<PublicFacility | null>(null)
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null)

  const handleFacilityClick = (facility: PublicFacility) => {
    setSelectedFacility(facility)
    if (facility.location) {
      setFlyToTarget(facility.location)
      setView('map')
    }
  }

  const handleDetailClose = () => {
    setSelectedFacility(null)
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1 className="app-title">公共施設マップ</h1>
        <div className="view-tabs">
          <button
            className={`tab-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            リスト
          </button>
          <button
            className={`tab-btn ${view === 'map' ? 'active' : ''}`}
            onClick={() => setView('map')}
          >
            地図
          </button>
        </div>
        {loading && <span className="status-loading">読み込み中...</span>}
        {error && <span className="status-error">{error}</span>}
      </header>

      <main className="app-main">
        {view === 'list' && (
          <FacilityList
            facilities={facilities}
            selectedFacilityId={selectedFacility?.id ?? null}
            onFacilityClick={handleFacilityClick}
          />
        )}
        {view === 'map' && (
          <div className="map-container">
            <FacilityMapView
              facilities={facilities}
              selectedFacilityId={selectedFacility?.id ?? null}
              flyToTarget={flyToTarget}
              onFacilityClick={setSelectedFacility}
            />
            {selectedFacility && (
              <FacilityDetail
                facility={selectedFacility}
                onClose={handleDetailClose}
              />
            )}
          </div>
        )}
      </main>
      <footer>
        <Attribution />
      </footer>
    </div>
  )
}

export default App
