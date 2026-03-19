# Team Activity Tracker
> Username + Password Login · React + Firebase · GitHub Pages

---

## 🔐 How Login Works

- Team members log in with a **username** (like `john`) + **password**
- **You are the admin** — you create all accounts
- Behind the scenes, each username is linked to a hidden email in Firebase

---

## 🚀 Full Setup Guide

### STEP 1 — Create a Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add project"** → Name it → **Create project**

---

### STEP 2 — Enable Email/Password Sign-In
1. Firebase → **Authentication** → **Get started**
2. **Sign-in method** → **Email/Password** → Toggle **Enable** → Save

---

### STEP 3 — Create Firestore Database
1. Firebase → **Firestore Database** → **Create database**
2. Choose **"Start in test mode"** → Pick a region → **Enable**

---

### STEP 4 — Set Firestore Rules (important!)
In Firestore → **Rules** tab, paste this and click **Publish**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
This allows the username lookup on login, but protects all other data.

---

### STEP 5 — Register your Web App
1. Project Settings (⚙️ gear) → **Your apps** → click **`</>`**
2. Give a nickname → **Register app** → copy the `firebaseConfig`

---

### STEP 6 — Paste Firebase Config
Open `src/lib/firebase.js` and fill in your values:
```js
const firebaseConfig = {
  apiKey: "paste here",
  authDomain: "paste here",
  projectId: "paste here",
  storageBucket: "paste here",
  messagingSenderId: "paste here",
  appId: "paste here"
};
```

---

### STEP 7 — Add GitHub Pages to Authorized Domains
1. Firebase → **Authentication** → **Settings** tab
2. **Authorized domains** → **Add domain**
3. Add: `your-github-username.github.io`

---

### STEP 8 — Build and Push to GitHub
```bash
npm install
npm run build
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

### STEP 9 — GitHub Actions Deploy File
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

### STEP 10 — Enable GitHub Pages
1. GitHub repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** → **/ (root)** → Save

---

### ✅ Live at:
```
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME
```

---

## 👥 How to Add a Team Member (2 steps)

Every new user needs TWO things created:

### Part A — Create them in Firebase Authentication
1. Firebase → **Authentication** → **Users** tab → **Add user**
2. Email: use a fake email like `john@myteam.com` (they never see this)
3. Password: choose a password for them
4. Click **Add user** → copy the **User UID** shown

### Part B — Add their username to Firestore
1. Firebase → **Firestore Database** → click **"+ Start collection"** (first time only)
   - Collection ID: `users` → click Next
2. For each user, click **Add document** → **Auto ID**
3. Add these fields:
   | Field | Type | Value |
   |-------|------|-------|
   | `uid` | string | (paste the User UID from Part A) |
   | `username` | string | `john` (what they type to login) |
   | `email` | string | `john@myteam.com` (same fake email from Part A) |
4. Click **Save**

Now that person can log in with:
- Username: `john`
- Password: whatever you set in Part A ✅

---

## 🗑️ How to Remove a User
1. Firebase → **Authentication** → find them → 3 dots → **Delete user**
2. Firebase → **Firestore** → `users` collection → delete their document

---

## 📁 Project Structure
```
src/
  lib/
    firebase.js       ← Your Firebase config (fill this in!)
    db.js             ← Firestore database functions
    AuthContext.jsx   ← Username → email lookup + login
  pages/
    LoginPage.jsx     ← Username + password form
    DashboardPage.jsx
    TeamLogsPage.jsx
    ReportsPage.jsx
    SettingsPage.jsx
  components/
    AppLayout.jsx     ← Sidebar (shows username)
```
