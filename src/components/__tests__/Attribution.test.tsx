import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Attribution } from '../Attribution';

describe('Attribution', () => {
  it('renders CC BY 4.0 text', () => {
    render(<Attribution />);
    expect(screen.getByText(/CC BY 4\.0/)).toBeDefined();
  });

  it('renders 板橋区', () => {
    render(<Attribution />);
    expect(screen.getByText(/板橋区/)).toBeDefined();
  });

  it('renders デジタル庁', () => {
    render(<Attribution />);
    expect(screen.getByText(/デジタル庁/)).toBeDefined();
  });

  it('has a link to CC BY 4.0 license', () => {
    render(<Attribution />);
    const links = screen.getAllByRole('link');
    const ccLink = links.find((l) => l.getAttribute('href')?.includes('creativecommons.org'));
    expect(ccLink).toBeDefined();
  });
});
