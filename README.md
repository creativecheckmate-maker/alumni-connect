# Nexus Alumni Network - Development Guide

This is a modern Alumni Management System built with **Next.js**, **Firebase**, and **Tailwind CSS**. Follow the instructions below to run this project on your local machine using Visual Studio Code (VS Code).

---

## ⚡ One-Click Startup (Recommended)

This project is pre-configured for a seamless experience in VS Code.

### 1. Automated Start
When you open this folder in VS Code, a background task will automatically attempt to run the development server. Check the **Terminal** at the bottom of your screen to see the progress.

### 2. The "NPM Scripts" Panel (True One-Click)
VS Code has a built-in "Play Button" for this project:
*   Open the **Explorer** (left sidebar).
*   At the bottom, look for the **NPM SCRIPTS** section.
*   Find the word **dev** and click the **Play icon (▶️)** next to it.

---

## 🚀 Standard Setup

### 1. Install Dependencies
Open the terminal in VS Code (`Terminal > New Terminal`) and run:
```bash
npm install
```

### 2. Configure Credentials
To connect to the database, create a `.env.local` file in the root folder and paste your keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_google_ai_key
```

### 3. Run the Server
If the automated task didn't start, run:
```bash
npm run dev
```
*   Open your browser to: `http://localhost:9002`

---

## 🔑 How to Find Your Credentials

### A. Finding Firebase Credentials
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project.
3.  Click the **Project Settings** (gear icon).
4.  In the **General** tab, scroll to **Your apps**.
5.  Select the **Config** radio button to see the object containing your keys.

### B. Finding Gemini API Key
1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Click **Get API key** in the sidebar.
3.  Copy your key into the `GEMINI_API_KEY` field in `.env.local`.

---

## 🔒 Security & Protection
*   **Logic Shield**: Sensitive database operations are handled via Server Actions (`src/lib/actions.ts`) and are invisible to the browser.
*   **License**: This software is protected by a Proprietary License. Unauthorized redistribution is prohibited.

---
© 2024 Nexus University Alumni Network. All rights reserved.