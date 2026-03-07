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
*   Add your Firebase API keys (Found in your Firebase Console project settings):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_google_ai_key
```
*Note: Never share this file or upload it to GitHub.*

### 5. Run the Development Server
Start the website in development mode:
```bash
npm run dev
```
*   The terminal will show a message like: `ready - started server on [::]:9002`
*   Open your browser and navigate to: `http://localhost:9002`

---

## 🛠 Useful Commands

*   `npm run build`: Prepares the application for production (compiles and minifies).
*   `npm run start`: Starts the production build.
*   `npm run lint`: Checks the code for errors and formatting issues.

## 🔒 Security Note
This project uses **Next.js Server Actions** to protect core logic. When running locally, the browser will not be able to see the source code of functions located in `src/lib/actions.ts`. This keeps your database structure and business logic safe from inspection.

---
© 2024 Nexus University Alumni Network. All rights reserved.