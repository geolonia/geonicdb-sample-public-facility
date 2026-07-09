import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapSidebarLayout } from '../MapSidebarLayout';
import { Drawer } from '../Drawer';

describe('MapSidebarLayout', () => {
  it('renders children (main content area)', () => {
    render(
      <MapSidebarLayout>
        <div data-testid="main-content">メインコンテンツ</div>
      </MapSidebarLayout>
    );
    expect(screen.getByTestId('main-content')).toBeDefined();
  });

  it('renders sidebar content when sidebar prop is provided', () => {
    render(
      <MapSidebarLayout sidebar={{ content: <div data-testid="sidebar-content">サイドバー</div>, label: 'サイドバー' }}>
        <div>main</div>
      </MapSidebarLayout>
    );
    expect(screen.getByTestId('sidebar-content')).toBeDefined();
  });

  it('renders desktop sidebar as aside element', () => {
    const { container } = render(
      <MapSidebarLayout sidebar={{ content: <div>サイドバー内容</div>, label: 'サイドバー' }}>
        <div>main</div>
      </MapSidebarLayout>
    );
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
  });

  it('renders mobile FAB button when sidebar is provided', () => {
    render(
      <MapSidebarLayout sidebar={{ content: <div>サイドバー内容</div>, label: 'リスト表示' }}>
        <div>main</div>
      </MapSidebarLayout>
    );
    const fab = screen.getByRole('button', { name: 'リスト表示' });
    expect(fab).toBeDefined();
  });

  it('renders without sidebar when no sidebar prop', () => {
    const { container } = render(
      <MapSidebarLayout>
        <div data-testid="only-main">only main</div>
      </MapSidebarLayout>
    );
    expect(screen.getByTestId('only-main')).toBeDefined();
    expect(container.querySelector('aside')).toBeNull();
  });

  it('opens Drawer when FAB is clicked', () => {
    render(
      <MapSidebarLayout sidebar={{ content: <div data-testid="drawer-content">ドロワー内容</div>, label: 'リスト' }}>
        <div>main</div>
      </MapSidebarLayout>
    );
    const fab = screen.getByRole('button', { name: 'リスト' });
    fireEvent.click(fab);
    expect(screen.getByRole('dialog')).toBeDefined();
  });
});

describe('Drawer', () => {
  it('renders children inside dialog', () => {
    render(
      <Drawer onClose={vi.fn()}>
        <div data-testid="drawer-child">ドロワー内容</div>
      </Drawer>
    );
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByTestId('drawer-child')).toBeDefined();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <Drawer onClose={onClose}>
        <div>content</div>
      </Drawer>
    );
    const backdrop = screen.getByTestId('drawer-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Drawer onClose={onClose}>
        <div>content</div>
      </Drawer>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
