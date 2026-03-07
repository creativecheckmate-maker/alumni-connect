import React from 'react';
import { MainClientShell } from '@/components/layout/main-client-shell';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// NOTE: This is a Server Component. We fetch initial site configuration 
// here to pass down to the client shell, ensuring a stable Vercel build.

async function getSiteData(id: string, defaultData: any) {
  try {
    let firebaseApp;
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
    const db = getFirestore(firebaseApp);
    const snap = await getDoc(doc(db, 'siteContent', id));
    return snap.exists() ? snap.data()?.data : defaultData;
  } catch (e) {
    // If permission rules haven't propagated or SDK fails on server, 
    // we return default values to prevent a full-page crash.
    console.warn(`Failed to fetch site data for ${id}:`, e);
    return defaultData;
  }
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const header = await getSiteData('global_header', {
    logoPart1: "Alumni",
    logoPart2: "Connect",
    searchPlaceholder: "Search anything...",
    loginButton: "Log In",
    signupButton: "Join Today"
  });

  const footer = await getSiteData('global_footer', {
    copyright: "© 2024 Nexus University Alumni Network",
    tagline: "Empowering our global community.",
    link1: "Privacy Policy",
    link2: "Terms of Service"
  });

  const config = await getSiteData('global_config', {
    isBlocked: false,
    hideProfessors: false
  });

  return (
    <MainClientShell 
      header={header} 
      footer={footer} 
      isPlatformLocked={config.isBlocked}
      adminEditDialog={null} 
      footerEditDialog={null}
    >
      {children}
    </MainClientShell>
  );
}