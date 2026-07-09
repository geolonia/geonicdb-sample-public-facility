import { useEffect, useRef } from 'react';

interface DrawerProps {
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  onClose: () => void;
}

export function Drawer({ children, position = 'left', width = '20rem', ariaLabel, ariaLabelledBy, onClose }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const focusable = drawerRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      focusable.focus();
    } else {
      drawerRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const positionStyle: React.CSSProperties = position === 'right'
    ? { right: 0 }
    : { left: 0 };

  return (
    <>
      <div
        data-testid="drawer-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
          zIndex: 40,
        }}
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          width: width,
          maxWidth: 'calc(100vw - 3rem)',
          background: '#fff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          ...positionStyle,
        }}
      >
        {children}
      </div>
    </>
  );
}
