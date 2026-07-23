import React, { useEffect, useRef } from 'react';
import { useSidebar } from './SidebarContext';
import { SidebarContent } from './SidebarContent';
import { CloseButton } from './ResponsiveSidebar';

export default function MobileDrawer(props) {
  const { sidebarOpen, closeSidebar, isDesktop } = useSidebar();
  const drawerRef = useRef(null);

  // Focus trap & Escape key
  useEffect(() => {
    if (!sidebarOpen || isDesktop) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeSidebar();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = drawerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, isDesktop, closeSidebar]);

  // Auto focus first element on open
  useEffect(() => {
    if (sidebarOpen && !isDesktop) {
      const timer = setTimeout(() => {
        const focusableElements = drawerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [sidebarOpen, isDesktop]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      <div
        ref={drawerRef}
        className={`mobile-drawer ${sidebarOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal={sidebarOpen}
        aria-label="Mobile Navigation Drawer"
      >
        <div className="mobile-drawer-header">
          <CloseButton onClick={closeSidebar} />
        </div>
        <SidebarContent {...props} />
      </div>
    </>
  );
}
