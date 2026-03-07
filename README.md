# Nexus Alumni Network - Development Guide

This is a modern Alumni Management System built with **Next.js**, **Firebase**, and **Tailwind CSS**. Follow the instructions below to run this project on your local machine using Visual Studio Code (VS Code).

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your laptop:

1.  **Node.js (LTS Version)**: [Download Node.js](https://nodejs.org/)
2.  **Visual Studio Code**: [Download VS Code](https://code.visualstudio.com/)
3.  **Git**: [Download Git](https://git-scm.com/) (Optional, but recommended)

---

## 🚀 Step-by-Step Setup

### 1. Open the Project in VS Code
*   Launch Visual Studio Code.
*   Go to `File > Open Folder...` and select the root directory of this project.

### 2. Open the Terminal
*   In VS Code, go to the top menu and select `Terminal > New Terminal`. This will open a command line at the bottom of your window.

### 3. Install Dependencies
Run the following command to download and install all necessary libraries:
```bash
npm install
```

### 4. Configure Environment Variables
To connect to the database, you need to create a `.env.local` file in the root folder.
*   Create a new file named `.env.local`.
*   Copy the following block and replace the placeholders with your actual keys (See the "How to Find Credentials" section below):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_google_ai_key
```

### 5. Run the Development Server
Start the website in development mode:
```bash
npm run dev
```
*   The terminal will show a message like: `ready - started server on [::]:9002`
*   Open your browser and navigate to: `http://localhost:9002`

---

## 🔑 How to Find Your Credentials

### A. Finding Firebase Credentials
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (or create a new one).
3.  Click the **Project Settings** (gear icon) in the top-left sidebar.
4.  Scroll down to the **Your apps** section.
5.  If you haven't created a Web App, click the **Web icon (</>)** to register one.
6.  Once registered, find the **SDK setup and configuration** section and select the **Config** radio button.
7.  You will see an object containing `apiKey`, `authDomain`, `projectId`, etc. Copy these values into your `.env.local` file.

### B. Finding Gemini API Key
1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Sign in with your Google Account.
3.  In the left sidebar, click on **Get API key**.
4.  Click **Create API key in new project** (or copy an existing one).
5.  Paste this into the `GEMINI_API_KEY` field in your `.env.local`.

---

## 🔒 Security & Protection
*   **Source Code Shield**: Core database logic and math are hidden in `src/lib/actions.ts` (Server Actions) and cannot be inspected via the browser.
*   **License**: This software is protected by a Proprietary License. Unauthorized redistribution is prohibited.
*   **Git**: Never upload your `.env.local` file to GitHub or any public repository.

---
© 2024 Nexus University Alumni Network. All rights reserved.