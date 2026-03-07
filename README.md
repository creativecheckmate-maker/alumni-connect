# Nexus Alumni Network - One-Click Deployment Guide

This platform is fully automated for a **Zero-Config, One-Click** development experience. All Firebase database connections and Gemini AI intelligence features are pre-configured and live.

---

## ⚡ One-Click Startup (Automated)

You do not need to enter any credentials or run manual commands.

### 1. The Automated Method
When you open this project folder in **VS Code**, a background task will automatically trigger. 
*   Check the **Terminal** at the bottom of your screen. 
*   Wait for the "Ready" message.
*   The site will be live at: [http://localhost:9002](http://localhost:9002)

### 2. The "Play Button" Method (Manual Start)
If the auto-start doesn't trigger for any reason:
*   Open the **Explorer** (left sidebar).
*   Scroll to the bottom to find the **NPM SCRIPTS** section.
*   Click the **Play icon (▶️)** next to **dev**.

---

## 🚀 Pre-Configured Services

### 🔒 Firebase Database & Auth
The system is already connected to the Nexus production database. User registration, profile management, and the community feed are active.

### 🧠 Nexus AI (Gemini)
The **Gemini 2.5 Flash** engine is live. The following features are currently active:
*   **Personalized Recommendations**: Career and event suggestions on your dashboard.
*   **Faculty Reputation Audit**: AI-driven ranking of faculty based on sentiment.
*   **Content Moderation**: Automatic shielding against unprofessional content.

---

## 🛠️ Vercel Deployment & Build Fixes

If you encounter an error like `ENOENT: page_client-reference-manifest.js` during a Vercel build, follow these steps:

### 1. Fix File Casing (Git Cache)
Vercel is case-sensitive. If you renamed folders (e.g., `Firebase` to `firebase`), Git might still remember the old name. Run these commands in your terminal:
```bash
git rm -r --cached .
git add .
git commit -m "Fixing file casing for deployment"
git push
```

### 2. Environment Variables
Ensure all keys from the `.env` file are added to your **Vercel Project Settings > Environment Variables**. Redeploy with the "Clear Cache" option if needed.

### 3. Server vs. Client Components
All pages using Firebase hooks must start with `"use client";`. We have already configured this for you, but keep this in mind if adding new pages.

---

## 🛡️ Security & Protection
*   **Logic Shield**: Critical operations (Profile Restoration, Feedback Math) are hidden in Server Actions and are invisible to browser inspection.
*   **Proprietary License**: All rights reserved. Unauthorized redistribution or reverse engineering is prohibited.

---
© 2024 Nexus University Alumni Network. Internal Development Build.
