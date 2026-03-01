
'use client';

import MainLayout from './(main)/layout';
import HomePage from './(main)/page';

/**
 * The root page component.
 * To ensure the sidebar and header are visible on the landing page, 
 * we explicitly wrap the homepage content with the MainLayout.
 */
export default function RootPage() {
  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  );
}
