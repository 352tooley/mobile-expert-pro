
# Mobile Expert Commission Pro - Deployment Plan

This mobile-friendly web app is designed to persist data using browser `localStorage`. To make this available to your whole district, follow this plan to host it for free on GitHub.

## 1. Create a GitHub Account
If you don't have one, sign up at [github.com](https://github.com).

## 2. Create a New Repository
1. Log in to GitHub.
2. Click the **+** icon in the top right and select **New repository**.
3. Name it `mobile-expert-pro`.
4. Set it to **Public**.
5. Click **Create repository**.

## 3. Upload the Code
1. On your computer, put `index.html`, `index.tsx`, `App.tsx`, `types.ts`, `constants.tsx`, and the folders `components/` and `services/` into a single folder.
2. In your new GitHub repository, click **uploading an existing file**.
3. Drag and drop all the files and folders into GitHub.
4. Click **Commit changes**.

## 4. Deploy with GitHub Pages
1. In your repository, go to **Settings**.
2. Click **Pages** in the left sidebar.
3. Under **Build and deployment > Branch**, select `main` (or `master`) and click **Save**.
4. Wait 1-2 minutes. GitHub will provide a URL like `https://yourusername.github.io/mobile-expert-pro/`.

## 5. Persistence (Memory) Strategy
Because this app uses `localStorage`, data is saved *on the specific phone* being used. 
To sync the "Roster" and "Quiz Questions" across the whole team:
1. One DM or Leader should go to the **Management > System Memory** tab.
2. Set up the roster and questions.
3. Click **Export System Data** to save the `.json` file.
4. Distribute this file to your team (via email or group chat).
5. Experts can then log in and use **Import System Data** to sync their phone's memory with the master list.

For a true "live" database that syncs automatically without file sharing, you would eventually need to connect this to a service like Firebase or Supabase, but the Export/Import tool provided here is the best way to handle this for a simple front-end deployment.
