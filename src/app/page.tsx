'use client';

import HomePage from './(main)/page';

/**
 * Root page serving the home component.
 * We rely on the App Router's folder-based layout system to handle MainLayout wrapping automatically.
 */
export default function RootPage() {
  return <HomePage />;
}