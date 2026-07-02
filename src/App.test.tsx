import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import App from './App'

vi.mock('./lib/ngsi', () => ({
  listEntities: vi.fn().mockResolvedValue([]),
  createEntity: vi.fn().mockResolvedValue(undefined),
  deleteEntity: vi.fn().mockResolvedValue(undefined),
  getVersion: vi.fn().mockResolvedValue({ orion: { version: '3.10.1' } }),
}))

describe('App', () => {
  it('renders the page title', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('GeonicDB Template App')
  })

  it('renders the create entity form section', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.getAllByText('Create Entity').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: 'Create Entity' })).toBeInTheDocument()
  })

  it('renders the entities list section', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByRole('heading', { name: /Entities/ })).toBeInTheDocument()
    expect(screen.getByText('No entities yet. Create one above.')).toBeInTheDocument()
  })

  it('renders the refresh button in the entities section', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.getByRole('button', { name: '↻' })).toBeInTheDocument()
  })
})
