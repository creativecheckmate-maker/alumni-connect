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
The **Gemini 2.5 Flash** engine is live. All AI features (Recommendations, Reputation Audit, Moderation) are pre-configured with the provided key.

---

## 🛠️ Troubleshooting & Fixes

### 1. Git "Divergent Branches" Error
If you see an error saying "Need to specify how to reconcile divergent branches" or see `1 ↓ 7 ↑` in your status bar:
*   Open the **Terminal**.
*   Run: `git config pull.rebase false`
*   Click the **Sync/Publish** button again. This tells Git to merge changes automatically.

### 2. Vercel Build Fixes (ENOENT)
If you encounter `ENOENT: page_client-reference-manifest.js` during a Vercel build, it is usually due to Git case-sensitivity issues with the `(main)` route group.
*   **CRITICAL FIX**: Run these commands in your local VS Code terminal to reset Git's file index:
    ```bash
    git rm -r --cached .
    git add .
    git commit -m "Fixing file casing and manifest conflicts for deployment"
    git push
    ```
*   **Environment Variables**: Ensure all keys from the `.env` file are added to **Vercel Project Settings**.

---

## 🛡️ Security & Protection
*   **Logic Shield**: Critical operations (Profile Restoration, Feedback Math) are hidden in Server Actions and are invisible to browser inspection.
*   **Proprietary License**: All rights reserved. Unauthorized redistribution or reverse engineering is prohibited.

---
© 2024 Nexus University Alumni Network. Internal Development Build.
