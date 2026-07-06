import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FacilityList } from '../FacilityList';
import type { PublicFacility } from '../../../types/public-facility';

function makeFacility(overrides: Partial<PublicFacility> = {}): PublicFacility {
  return {
    id: 'PublicFacility:itabashi:001',
    name: '板橋区立中央図書館',
    nameKana: '',
    location: [139.709, 35.751],
    address: '東京都板橋区板橋2-66-1',
    phone: '',
    facilityType: '図書館',
    municipality: '板橋区',
    openDays: '',
    openTime: '',
    closeTime: '',
    openTimeNote: '',
    accessibility: {
      wheelchair: false,
      wheelchairRental: false,
      accessibleToilet: false,
      slopeElevator: false,
      braille: false,
      guideDog: false,
      nursingRoom: false,
      diaperChanging: false,
      priorityParking: false,
      ostomyToilet: false,
    },
    description: '',
    websiteUrl: '',
    postalCode: '',
    rawEntity: { id: 'PublicFacility:itabashi:001', type: 'PublicFacility' },
    ...overrides,
  };
}

const facilities: PublicFacility[] = [
  makeFacility({ id: 'f1', name: '中央図書館', facilityType: '図書館' }),
  makeFacility({ id: 'f2', name: '板橋体育館', facilityType: '体育館' }),
  makeFacility({ id: 'f3', name: '東板橋体育館', facilityType: '体育館', address: '東京都板橋区加賀1' }),
  makeFacility({ id: 'f4', name: '赤塚公民館', facilityType: '公民館' }),
];

describe('FacilityList', () => {
  it('renders all facilities', () => {
    render(
      <FacilityList
        facilities={facilities}
        selectedFacilityId={null}
        onFacilityClick={vi.fn()}
      />,
    );

    expect(screen.getByText('中央図書館')).toBeDefined();
    expect(screen.getByText('板橋体育館')).toBeDefined();
    expect(screen.getByText('東板橋体育館')).toBeDefined();
    expect(screen.getByText('赤塚公民館')).toBeDefined();
  });

  it('displays total count', () => {
    render(
      <FacilityList
        facilities={facilities}
        selectedFacilityId={null}
        onFacilityClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId('facility-count').getAttribute('data-count')).toBe('4');
  });

  it('renders type filter buttons with counts', () => {
    render(
      <FacilityList
        facilities={facilities}
        selectedFacilityId={null}
        onFacilityClick={vi.fn()}
      />,
    );

    // "All" button should show 4
    const allButton = screen.getByTestId('facility-filter-all');
    expect(allButton.textContent).toContain('4');
  });

  it('filters by text search', () => {
    render(
      <FacilityList
        facilities={facilities}
        selectedFacilityId={null}
        onFacilityClick={vi.fn()}
      />,
    );

    const input = screen.getByTestId('facility-search-input');
    fireEvent.change(input, { target: { value: '体育館' } });

    expect(screen.getByText('板橋体育館')).toBeDefined();
    expect(screen.getByText('東板橋体育館')).toBeDefined();
    expect(screen.queryByText('中央図書館')).toBeNull();
    expect(screen.queryByText('赤塚公民館')).toBeNull();
  });

  it('filters by facility type', () => {
    render(
      <FacilityList
        facilities={facilities}
        selectedFacilityId={null}
        onFacilityClick={vi.fn()}
      />,
    );

    // Click the 図書館 filter (actual <button>, not a FacilityCard div[role=button])
    const filterButtons = screen.getAllByRole('button', { name: /図書館/ });
    const libraryButton = filterButtons.find((el) => el.tagName === 'BUTTON')!;
    fireEvent.click(libraryButton);

    expect(screen.getByText('中央図書館')).toBeDefined();
    expect(screen.queryByText('板橋体育館')).toBeNull();
  });

  it('shows empty state when no matches', () => {
    render(
      <FacilityList
        facilities={facilities}
        selectedFacilityId={null}
        onFacilityClick={vi.fn()}
      />,
    );

    const input = screen.getByTestId('facility-search-input');
    fireEvent.change(input, { target: { value: 'xxxxxxx' } });

    expect(screen.getByTestId('facility-no-results')).toBeDefined();
  });

  it('calls onFacilityClick when card is clicked', () => {
    const onClick = vi.fn();
    render(
      <FacilityList
        facilities={facilities}
        selectedFacilityId={null}
        onFacilityClick={onClick}
      />,
    );

    fireEvent.click(screen.getByText('中央図書館'));

    expect(onClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'f1', name: '中央図書館' }),
    );
  });

  it('searches by address', () => {
    render(
      <FacilityList
        facilities={facilities}
        selectedFacilityId={null}
        onFacilityClick={vi.fn()}
      />,
    );

    const input = screen.getByTestId('facility-search-input');
    fireEvent.change(input, { target: { value: '加賀' } });

    expect(screen.getByText('東板橋体育館')).toBeDefined();
    expect(screen.queryByText('中央図書館')).toBeNull();
  });

  it('renders search input', () => {
    render(
      <FacilityList
        facilities={facilities}
        selectedFacilityId={null}
        onFacilityClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId('facility-search-input')).toBeDefined();
  });
});
