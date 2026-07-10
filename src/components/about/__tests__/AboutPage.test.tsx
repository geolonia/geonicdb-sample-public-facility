import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutPage } from '../AboutPage';

describe('AboutPage', () => {
  it('renders the architecture doc heading', () => {
    render(<AboutPage />);
    expect(screen.getByRole('heading', { name: /システム構成解説/ })).toBeDefined();
  });

  it('renders section headings from docs/architecture.md', () => {
    render(<AboutPage />);
    expect(screen.getByText(/全体構成/)).toBeDefined();
    expect(screen.getByText(/なぜ匿名 read で成立するか/)).toBeDefined();
    expect(screen.getByText(/カスタマイズ観点/)).toBeDefined();
  });

  it('renders the customization table', () => {
    render(<AboutPage />);
    const tables = document.querySelectorAll('table');
    expect(tables.length).toBeGreaterThan(0);
  });

  it('renders code fences as pre blocks', () => {
    render(<AboutPage />);
    const preBlocks = document.querySelectorAll('pre');
    expect(preBlocks.length).toBeGreaterThan(0);
  });
});
