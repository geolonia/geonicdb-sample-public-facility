import { useState } from 'react';
import { Drawer } from './Drawer';

export interface SidebarConfig {
  content: React.ReactNode;
  position?: 'left' | 'right';
  width?: string;
  label: string;
  icon?: React.ReactNode;
  desktopHidden?: boolean;
}

export interface MapSidebarLayoutProps {
  children: React.ReactNode;
  sidebar?: SidebarConfig;
  secondarySidebar?: SidebarConfig;
}

export function MapSidebarLayout({
  children,
  sidebar,
  secondarySidebar,
}: MapSidebarLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Apply default positions before splitting: sidebar→'left', secondarySidebar→'right'
  const sidebarWithDefault = sidebar
    ? { ...sidebar, position: sidebar.position ?? ('left' as const) }
    : undefined;
  const secondarySidebarWithDefault = secondarySidebar
    ? { ...secondarySidebar, position: secondarySidebar.position ?? ('right' as const) }
    : undefined;

  const allSidebars = [sidebarWithDefault, secondarySidebarWithDefault].filter(
    (s): s is SidebarConfig & { position: 'left' | 'right' } => s != null
  );
  const leftSidebar = allSidebars.find((s) => s.position === 'left');
  const rightSidebar = allSidebars.find((s) => s.position === 'right');

  return (
    <div className="map-sidebar-root">
      {/* Desktop: left sidebar */}
      {leftSidebar && !leftSidebar.desktopHidden && (
        <aside
          className="map-sidebar-desktop map-sidebar-desktop--left"
          style={{ width: leftSidebar.width ?? '20rem' }}
        >
          {leftSidebar.content}
        </aside>
      )}

      {/* Main content */}
      <main className="map-sidebar-main">
        {children}
      </main>

      {/* Desktop: right sidebar */}
      {rightSidebar && !rightSidebar.desktopHidden && (
        <aside
          className="map-sidebar-desktop map-sidebar-desktop--right"
          style={{ width: rightSidebar.width ?? '18rem' }}
        >
          {rightSidebar.content}
        </aside>
      )}

      {/* Mobile: FAB + Drawer (left) */}
      {leftSidebar && (
        <>
          <button
            type="button"
            className="map-sidebar-fab map-sidebar-fab--left"
            onClick={() => setLeftOpen(true)}
            aria-label={leftSidebar.label}
          >
            {leftSidebar.icon ?? '☰'}
          </button>
          {leftOpen && (
            <Drawer
              position="left"
              width={leftSidebar.width}
              ariaLabel={leftSidebar.label}
              onClose={() => setLeftOpen(false)}
            >
              {leftSidebar.content}
            </Drawer>
          )}
        </>
      )}

      {/* Mobile: FAB + Drawer (right) */}
      {rightSidebar && (
        <>
          <button
            type="button"
            className="map-sidebar-fab map-sidebar-fab--right"
            onClick={() => setRightOpen(true)}
            aria-label={rightSidebar.label}
          >
            {rightSidebar.icon ?? '☰'}
          </button>
          {rightOpen && (
            <Drawer
              position="right"
              width={rightSidebar.width}
              ariaLabel={rightSidebar.label}
              onClose={() => setRightOpen(false)}
            >
              {rightSidebar.content}
            </Drawer>
          )}
        </>
      )}
    </div>
  );
}
