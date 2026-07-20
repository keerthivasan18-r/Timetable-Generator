import React, { Suspense, lazy, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { SidebarContent } from './SidebarContent';

const LazyMobileDrawer = lazy(() => import('./MobileDrawer'));

export const Backdrop = React.memo(({ onClose }) => (
  <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
));

export const HamburgerIcon = React.memo(({ isOpen }) => (
  <div className={`hamburger-icon-wrapper ${isOpen ? 'open' : ''}`}>
    <span className="hamburger-line line-1"></span>
    <span className="hamburger-line line-2"></span>
    <span className="hamburger-line line-3"></span>
  </div>
));

export const FloatingMenuButton = React.memo(() => {
  const { sidebarOpen, toggleSidebar, isMobile } = useSidebar();
  if (!isMobile) return null;

  return (
    <button
      id="floating-hamburger-btn"
      className={`floating-hamburger-btn ${sidebarOpen ? 'open' : ''}`}
      onClick={toggleSidebar}
      aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={sidebarOpen}
    >
      <HamburgerIcon isOpen={sidebarOpen} />
    </button>
  );
});

export const CloseButton = React.memo(({ onClick }) => (
  <button
    className="drawer-close-btn"
    onClick={onClick}
    aria-label="Close menu"
  >
    <X size={20} />
  </button>
));

export const DesktopSidebar = React.memo((props) => {
  return (
    <aside className="sidebar desktop-sidebar slide-in-left" role="navigation" aria-label="Desktop navigation">
      <SidebarContent {...props} />
    </aside>
  );
});

export const TabletSidebar = React.memo((props) => {
  const { tabletExpanded, setTabletExpanded } = useSidebar();

  return (
    <aside
      className={`sidebar tablet-sidebar slide-in-left ${tabletExpanded ? 'toggled-expanded' : ''}`}
      role="navigation"
      aria-label="Tablet navigation"
    >
      <button
        className="sidebar-toggle-btn"
        onClick={() => setTabletExpanded(!tabletExpanded)}
        aria-label={tabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {tabletExpanded ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
      </button>
      <SidebarContent {...props} />
    </aside>
  );
});

export const ResponsiveSidebar = React.memo((props) => {
  const { isDesktop, isTablet, isMobile, sidebarOpen, setSidebarOpen } = useSidebar();

  // Gesture: swipe right to open, swipe left to close
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (!isMobile) return;
      const endX = e.touches[0]?.clientX || e.changedTouches[0]?.clientX;
      const endY = e.touches[0]?.clientY || e.changedTouches[0]?.clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Check if swipe is horizontal and significant
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 80) {
        if (diffX > 0 && !sidebarOpen && startX < 50) {
          // Edge swipe right to open
          setSidebarOpen(true);
        } else if (diffX < 0 && sidebarOpen) {
          // Swipe left to close
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen, isMobile, setSidebarOpen]);

  if (isDesktop) {
    return <DesktopSidebar {...props} />;
  }

  if (isTablet) {
    return <TabletSidebar {...props} />;
  }

  if (isMobile) {
    return (
      <Suspense fallback={null}>
        <LazyMobileDrawer {...props} />
      </Suspense>
    );
  }

  return null;
});
