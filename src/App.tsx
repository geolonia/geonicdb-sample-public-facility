import { useState } from 'react'
import { useFacilities } from './hooks/useFacilities'
import { toPublicFacility } from './types/public-facility'
import { FacilityList } from './components/public-facility/FacilityList'
import { FacilityMapView } from './components/map/FacilityMapView'
import { Attribution } from './components/Attribution'
import { MapSidebarLayout } from './components/layout/MapSidebarLayout'
/* DEMO-ONLY START */
import { AboutPage } from './components/about/AboutPage'
/* DEMO-ONLY END */
import './App.css'

function App() {
  const { facilities: rawFacilities, loading, error } = useFacilities('PublicFacility')
  const facilities = rawFacilities.map(toPublicFacility)

  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)
  /* DEMO-ONLY START */
  const [view, setView] = useState<'main' | 'about'>('main')
  /* DEMO-ONLY END */

  return (
    <div className="app-layout">
      <a href="#app-main" className="skip-link">メインコンテンツへスキップ</a>
      <header className="app-header">
        <h1 className="app-title">公共施設マップ</h1>
        {loading && <span className="status-loading">読み込み中...</span>}
        {error && <span role="alert" className="status-error">{error}</span>}
        {/* DEMO-ONLY START */}
        <button type="button" className="about-link" onClick={() => setView(view === 'about' ? 'main' : 'about')}>
          {view === 'about' ? '地図へ戻る' : 'このデモについて'}
        </button>
        {/* DEMO-ONLY END */}
      </header>

      {/* DEMO-ONLY START */}
      {view === 'about' ? (
        <AboutPage />
      ) : (
      /* DEMO-ONLY END */
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
      /* DEMO-ONLY START */
      )}
      {/* DEMO-ONLY END */}

      <footer>
        <Attribution />
      </footer>
    </div>
  )
}

export default App
