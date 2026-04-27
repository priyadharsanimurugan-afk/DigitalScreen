// app/admin/layout-studio.tsx
import React from 'react';
import { useWindowDimensions } from 'react-native';
import AdminLayoutStudioWeb from './layouts'; // Your web version
import AdminLayoutStudioMobile from './mobileLayout'; // Your mobile version

const BREAKPOINT = 768; // Tablet breakpoint

export default function LayoutStudioEntry() {
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINT;
  
  // Render mobile version on small screens, web version on larger screens
  return isMobile ? <AdminLayoutStudioMobile /> : <AdminLayoutStudioWeb />;
}