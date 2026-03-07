# Nexus Alumni Network - Development Guide

This is a modern Alumni Management System built with **Next.js**, **Firebase**, and **Tailwind CSS**. It is fully automated for a **Zero-Config, One-Click** start.

---

## ⚡ One-Click Startup (Already Set Up)

This project is fully automated. You do not need to enter any credentials manually.

### 1. Automated Start
When you open this folder in VS Code, a background task will automatically run the development server. Check the **Terminal** at the bottom of your screen. 

### 2. The "Play Button"
*   Open the **Explorer** (left sidebar).
*   At the bottom, expand the **NPM SCRIPTS** section.
*   Click the **Play icon (▶️)** next to **dev**.

---

## 🚀 Environment Details

### Firebase & Gemini AI (Live)
The platform is pre-configured with all necessary keys.
*   **Database**: Connection to Firebase Firestore and Auth is live.
*   **AI Engine**: Nexus AI (Gemini) is active for recommendations and audits.

### 🌐 Accessing the Site
Once the terminal shows "Ready," you can view the platform at:
[http://localhost:9002](http://localhost:9002)

---

## 🔒 Security & Protection
*   **Logic Shield**: Critical database operations (like profile restoration and ratings) are handled via Server Actions (`src/lib/actions.ts`) and are invisible to the browser.
*   **License**: This software is protected by a Proprietary License. Unauthorized redistribution is prohibited.

---
© 2024 Nexus University Alumni Network. All rights reserved.