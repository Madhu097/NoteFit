# NoteFit — Deployment & Android Guide

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → Name it "NoteFit"
3. Disable Google Analytics (optional) → Create project

### 2. Enable Authentication
1. Build → Authentication → Get Started
2. Enable **Email/Password** sign-in provider

### 3. Create Firestore Database
1. Build → Firestore Database → Create database
2. Choose **production mode** → Select region (e.g., `asia-south1`)
3. Add these Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /workouts/{workoutId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      match /exercises/{exerciseId} {
        allow read, write: if request.auth != null;
      }
    }
    match /notes/{noteId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
    match /progress/{progressId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

### 4. Get Firebase Config
1. Project Settings → General → Your apps → Web app
2. Click the `</>` icon → Register app "NoteFit Web"
3. Copy the config values

### 5. Update `.env.local`
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=notfit-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=notfit-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=notfit-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX
```

---

## 🌐 Web Deployment (Vercel)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Build and deploy
vercel

# 3. Add environment variables in Vercel dashboard
# Project Settings → Environment Variables → Add all NEXT_PUBLIC_FIREBASE_* vars
```

> **Note**: For Vercel deployment, change `output: 'export'` to nothing in `next.config.ts`
> (static export is needed for Capacitor, but Vercel handles SSR/SSG automatically)

---

## 📱 Android (Play Store via Capacitor)

### Prerequisites
- Android Studio installed
- Java JDK 17+
- Android SDK

### Steps

```bash
# 1. Build Next.js static export
npm run build
# This creates the `out/` directory

# 2. Add Android platform
npx cap add android

# 3. Sync web assets to Android
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

### In Android Studio
1. **Build** → **Generate Signed Bundle/APK**
2. Choose **Android App Bundle** (for Play Store)
3. Create a new keystore or use existing
4. Build release variant

### Play Store Upload
1. Go to [play.google.com/console](https://play.google.com/console)
2. Create new app → "NoteFit"
3. Upload the `.aab` file in **Production** → **Releases**
4. Complete store listing (screenshots, description)
5. Submit for review

### App Icons & Splash Screen
Replace in `android/app/src/main/res/`:
- `mipmap-*/ic_launcher.png` — App icons (48×48 to 192×192)
- `drawable/splash.png` — Splash screen (1024×1024)

---

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Build for production (Vercel)
npm run build

# Build for Capacitor (static export)
npm run build  # generates out/
npx cap sync   # sync to android/

# Open Android in Studio
npx cap open android
```

---

## 📁 Project Structure

```
notfit/
├── src/
│   ├── app/
│   │   ├── (auth)/        # Login, Signup, Onboarding
│   │   └── (app)/         # Protected app pages
│   ├── components/
│   │   └── layout/        # AppShell, Sidebar, BottomNav
│   ├── hooks/             # Custom React hooks
│   ├── lib/
│   │   ├── firebase/      # Firebase service layer
│   │   ├── validations/   # Zod schemas
│   │   └── utils.ts       # Utility functions
│   ├── providers/         # AuthProvider
│   └── types/             # TypeScript interfaces
├── public/
├── capacitor.config.ts
└── next.config.ts
```

---

## ✅ Firestore Indexes Required

Add these composite indexes in Firebase Console → Firestore → Indexes:

| Collection | Fields | Direction |
|-----------|--------|-----------|
| workouts | userId ASC, date DESC | Composite |
| notes | userId ASC, createdAt DESC | Composite |
| tasks | userId ASC, createdAt DESC | Composite |
| progress | userId ASC, date DESC | Composite |
