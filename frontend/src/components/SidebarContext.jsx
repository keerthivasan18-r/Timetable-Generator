import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWidth(window.innerWidth);
      }, 50);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const isMobile = width < 768;
  const isSmallMobile = width < 480;
  const isLargeMobile = width >= 576 && width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isLaptop = width >= 1024 && width < 1440;
  const isDesktop = width >= 1024;
  const isLargeDesktop = width >= 1536;
  const isUltrawide = width >= 1920;

  // Lock body scroll when drawer is open on mobile or tablet
  useEffect(() => {
    if (!isDesktop && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDesktop, sidebarOpen]);

  // Auto-close overlay drawer when window resizes to desktop screen
  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        tabletExpanded,
        setTabletExpanded,
        isMobile,
        isSmallMobile,
        isLargeMobile,
        isTablet,
        isLaptop,
        isDesktop,
        isLargeDesktop,
        isUltrawide,
        windowWidth: width,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

