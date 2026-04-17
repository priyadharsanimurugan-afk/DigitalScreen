import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Navbar from '../app/navbar';
import BottomTabs from '../app/bottomTabs';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { width } = useWindowDimensions();

  // Show bottom tabs on mobile AND tablet (everything below desktop)
  const showBottomTabs = width < 1024;



  return (
    <View style={styles.container}>
      {/* Top Navbar - Always visible */}
      <Navbar showBottomTabs={showBottomTabs} />

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Bottom Tabs - Mobile & Tablet */}
      {showBottomTabs && <BottomTabs />}
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