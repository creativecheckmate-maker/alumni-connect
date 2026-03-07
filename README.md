# Nexus Alumni Network - One-Click Deployment Guide

This platform is fully automated for a **Zero-Config, One-Click** development experience. All Firebase database connections and Gemini AI intelligence features are pre-configured and live.

---

## ⚡ One-Click Startup (Automated)

When you open this project folder in **VS Code**, a background task will automatically trigger. 
*   Check the **Terminal** at the bottom of your screen. 
*   Wait for the "Ready" message.
*   The site will be live at: [http://localhost:9002](http://localhost:9002)

---

## 🛠️ Vercel Build & Git Troubleshooting

### 1. Fix: ENOENT: page_client-reference-manifest.js
If you encounter this error during a Vercel build, it is usually due to Git case-sensitivity issues with the `(main)` route group. 

**CRITICAL FIX**: Run these commands in your local VS Code terminal to reset Git's file index:
```bash
git rm -r --cached .
git add .
git commit -m "Fixing file casing and manifest conflicts for deployment"
git push
```

### 2. Git "Divergent Branches" Error
If you see `1 ↓ 7 ↑` in your status bar:
*   Open the **Terminal**.
*   Run: `git config pull.rebase false`
*   Click the **Sync** button again.

---

## 🚀 Deployment Checklist
1. **Environment Variables**: Copy all keys from your local `.env` file into **Vercel Project Settings > Environment Variables**.
2. **Clear Cache**: When redeploying, select the "Redeploy" option and check "Clean Build Cache" to ensure the new manifest structure is applied.

---
© 2024 Nexus University Alumni Network. Internal Development Build.