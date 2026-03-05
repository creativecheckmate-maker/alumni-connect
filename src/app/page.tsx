'use client';

import HomePage from './(main)/page';
import MainLayout from './(main)/layout';

/**
 * Root page serving the home component.
 * We wrap HomePage in MainLayout to ensure consistent sidebar/header navigation 
 * and prevent route conflicts between the root and group layouts.
 */
export default function RootPage() {
  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  );
}