# Nexus Alumni Network - Development Guide

This is a modern Alumni Management System built with **Next.js**, **Firebase**, and **Tailwind CSS**. It is pre-configured for a **Zero-Config** start.

---

## ⚡ One-Click Startup (Already Set Up)

This project is fully automated. You do not need to enter Firebase credentials manually.

### 1. Automated Start
When you open this folder in VS Code, a background task will automatically run the development server. Check the **Terminal** at the bottom of your screen. 

### 2. The "Play Button"
*   Open the **Explorer** (left sidebar).
*   At the bottom, expand the **NPM SCRIPTS** section.
*   Click the **Play icon (▶️)** next to **dev**.

---

## 🚀 Environment Details

### Firebase (Pre-Configured)
The Firebase connection is already live. I have pre-filled the `.env` and `src/firebase/config.ts` files with the necessary keys. 

### Gemini AI (Optional)
To enable AI-powered recommendations and reputation audits:
1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Get your API key.
3.  Open the `.env` file in this folder and paste it into `GEMINI_API_KEY=`.

---

## 🔒 Security & Protection
*   **Logic Shield**: Critical database operations (like profile restoration and ratings) are handled via Server Actions (`src/lib/actions.ts`) and are invisible to the browser.
*   **License**: This software is protected by a Proprietary License. Unauthorized redistribution is prohibited.

---
© 2024 Nexus University Alumni Network. All rights reserved.