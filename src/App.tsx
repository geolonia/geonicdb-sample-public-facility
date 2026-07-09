import { useState } from 'react'
import { useFacilities } from './hooks/useFacilities'
import { toPublicFacility } from './types/public-facility'
import { FacilityList } from './components/public-facility/FacilityList'
import { FacilityMapView } from './components/map/FacilityMapView'
import { Attribution } from './components/Attribution'
import { MapSidebarLayout } from './components/layout/MapSidebarLayout'
import './App.css'

function App() {
  const { facilities: rawFacilities, loading, error } = useFacilities('PublicFacility')
  const facilities = rawFacilities.map(toPublicFacility)

  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1 className="app-title">公共施設マップ</h1>
        {loading && <span className="status-loading">読み込み中...</span>}
        {error && <span className="status-error">{error}</span>}
      </header>

      <MapSidebarLayout
        sidebar={{
          label: 'リスト表示',
          content: (
            <FacilityList
              facilities={facilities}
              selectedId={selectedFacilityId}
              onSelect={setSelectedFacilityId}
            />
          ),
        }}
      >
        <FacilityMapView
          facilities={facilities}
          selectedFacilityId={selectedFacilityId}
          onSelect={setSelectedFacilityId}
        />
      </MapSidebarLayout>

      <footer>
        <Attribution />
      </footer>
    </div>
  )
}

export default App
