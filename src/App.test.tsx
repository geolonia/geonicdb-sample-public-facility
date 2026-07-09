import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import App from './App'

vi.mock('./hooks/useFacilities', () => ({
  useFacilities: vi.fn().mockReturnValue({
    facilities: [],
    loading: false,
    error: null,
  }),
}))

vi.mock('./components/map/FacilityMapView', () => ({
  FacilityMapView: () => <div data-testid="facility-map-view">Map</div>,
}))

describe('App', () => {
  it('renders the page title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('公共施設マップ')
  })

  it('renders list view by default', () => {
    render(<App />)
    expect(screen.getByTestId('facility-search-input')).toBeDefined()
  })

  it('renders MapSidebarLayout with mobile FAB for list', () => {
    render(<App />)
    // mobile FAB button (hidden on desktop via CSS, always rendered)
    expect(screen.getByRole('button', { name: 'リスト表示' })).toBeDefined()
  })

  it('renders both list and map simultaneously (no tab switching)', () => {
    render(<App />)
    expect(screen.getByTestId('facility-search-input')).toBeDefined()
    expect(screen.getByTestId('facility-map-view')).toBeDefined()
  })
})
