import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FacilityCard } from '../FacilityCard';
import type { PublicFacility } from '../../../types/public-facility';

function makeFacility(overrides: Partial<PublicFacility> = {}): PublicFacility {
  return {
    id: 'PublicFacility:itabashi:001',
    name: '板橋区立中央図書館',
    nameKana: '',
    location: [139.709, 35.751],
    address: '東京都板橋区板橋2-66-1',
    phone: '(03)3964-1111',
    facilityType: '図書館',
    municipality: '板橋区',
    openDays: '月火水木金土',
    openTime: '09:00',
    closeTime: '20:00',
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

describe('FacilityCard', () => {
  it('renders facility name and type badge', () => {
    render(<FacilityCard facility={makeFacility()} />);
    expect(screen.getByText('板橋区立中央図書館')).toBeDefined();
    expect(screen.getByText('図書館')).toBeDefined();
  });

  it('renders address', () => {
    render(<FacilityCard facility={makeFacility()} />);
    expect(screen.getByText('東京都板橋区板橋2-66-1')).toBeDefined();
  });

  it('renders phone number', () => {
    render(<FacilityCard facility={makeFacility()} />);
    expect(screen.getByText('(03)3964-1111')).toBeDefined();
  });

  it('renders operating hours', () => {
    render(<FacilityCard facility={makeFacility()} />);
    expect(screen.getByText('09:00 - 20:00')).toBeDefined();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const facility = makeFacility();
    render(<FacilityCard facility={facility} onClick={onClick} />);

    const card = screen.getByText('板橋区立中央図書館').closest('[id]')!;
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledWith(facility);
  });

  it('applies selected styling', () => {
    render(<FacilityCard facility={makeFacility()} selected />);
    const card = screen.getByText('板橋区立中央図書館').closest('[id]')!;
    expect(card.className).toContain('border-brand-400');
    expect(card.className).toContain('ring-2');
  });

  it('renders website link when URL present', () => {
    render(<FacilityCard facility={makeFacility({ websiteUrl: 'https://example.com' })} />);
    const link = document.querySelector('a[href="https://example.com"]');
    expect(link).toBeDefined();
  });

  it('does not render accessibility icons when none set', () => {
    render(<FacilityCard facility={makeFacility()} />);
    expect(document.querySelector('[title="車椅子可"]')).toBeNull();
  });

  it('is keyboard accessible (role=button, tabIndex, Enter/Space)', () => {
    const onClick = vi.fn();
    const facility = makeFacility();
    render(<FacilityCard facility={facility} onClick={onClick} />);

    const card = screen.getByText('板橋区立中央図書館').closest('[role="button"]')!;
    expect(card.getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
