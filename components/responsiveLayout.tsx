import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Navbar from '../app/navbar';
import BottomTabs from '../app/bottomTabs';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // Mobile breakpoint

  return (
    <View style={styles.container}>
      {/* Top Navbar - Always visible */}
      <Navbar showBottomTabs={isMobile} />
      
      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* Bottom Tabs - Only on mobile */}
      {isMobile && <BottomTabs />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    flex: 1,
  },
});