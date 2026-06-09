# Full Stack Project Documentation

This document describes the three main folders in the repository:

- `backend`
- `frontend`
- `mobile_app`

It explains the structure, purpose, main technologies, and how to run each part.

---

## 1. Backend

### Purpose
The `backend` folder contains the REST API server for the MultiBill application.
It handles authentication, user management, bill records, payments, notifications, reports, categories, admin actions, and scheduled jobs.

### Main technologies
- Node.js
- Express
- MongoDB (via Mongoose)
- Firebase Admin
- JWT authentication
- Multer file uploads
- Node-cron scheduler
- PDF generation and QR code generation

### Important files and folders
- `server.js` — main app entry point. Configures middleware, database connection, static file serving, API routes, and cron jobs.
- `package.json` — backend package metadata and scripts.
- `.env` — environment variables (not committed, should contain database and auth config).
- `config/db.js` — MongoDB connection logic.
- `controllers/` — business logic for each resource.
- `routes/` — HTTP route definitions and route mounting.
- `models/` — Mongoose schemas for data entities.
- `middleware/authMiddleware.js` — request authentication for protected endpoints.
- `utils/cronJobs.js` — scheduled tasks setup.
- `utils/pdfGenerator.js` — helper for PDF generation.
- `utils/upload.js` — file upload helper.
- `uploads/` — folder for storing uploaded files.
- `seed.js` — initial data seeding script.

### API endpoints
The server mounts these route groups under `/api`:
- `/api/auth` — login, registration, MFA, auth flows
- `/api/users` — user management CRUD
- `/api/bills` — bill creation, listing, update, deletion
- `/api/payments` — payment actions and confirmations
- `/api/notifications` — push or app notifications
- `/api/reports` — analytics and report generation
- `/api/admin` — admin-specific actions
- `/api/categories` — bill category management

### Run backend locally
1. Open terminal in `backend/`
2. Install dependencies:
   - `npm install`
3. Start server:
   - `npm run dev` (with `nodemon`)
   - or `npm start`
4. The API runs on `http://localhost:5000` by default.

> Ensure environment variables are configured in `.env` before starting.

---

## 2. Frontend

### Purpose
The `frontend` folder contains the web admin/dashboard interface built with React.
It is the admin portal for managing bills, users, payments, reports, reminders, security settings, and more.

### Main technologies
- React 19
- Vite
- Tailwind CSS
- Zustand state management
- React Router DOM
- Axios for API requests
- Recharts for dashboard charts
- Framer Motion for animations

### Important files and folders
- `src/App.jsx` — main routing and protected route layout.
- `src/pages/` — page components for Login, Dashboard, Users, Bills, Payments, Reports, Security, and settings.
- `src/components/` — reusable components like `Layout`, `Sidebar`, `Topbar`, and `ProtectedRoute`.
- `src/services/api.js` — API HTTP client.
- `src/store/useStore.js` — global state management.
- `src/context/I18nContext.jsx` — internationalization / translations provider.
- `src/i18n/translations.js` — text labels and localization values.
- `public/` — static assets, app icons, and HTML template.
- `vite.config.js` — Vite build configuration.
- `tailwind.config.js` and `postcss.config.js` — Tailwind setup.

### Run frontend locally
1. Open terminal in `frontend/`
2. Install dependencies:
   - `npm install`
3. Start the development server:
   - `npm run dev`
4. Visit the local URL displayed by Vite (usually `http://localhost:5173`).

---

## 3. Mobile App

### Purpose
The `mobile_app` folder contains the Flutter mobile application for the MultiBill project.
It includes a native mobile interface for login, dashboards, bill tracking, notifications, and payments.

### Main technologies
- Flutter / Dart
- Provider state management
- Firebase Core and Firebase Messaging
- Local notifications
- Secure storage
- HTTP client (`http` package)
- Shared preferences
- Platform-specific support for Android, iOS, web, Windows, macOS, and Linux

### Important files and folders
- `lib/main.dart` — Flutter app entry point and route configuration.
- `lib/screens/` — screen views such as `login_screen.dart`, `welcome_screen.dart`, `dashboard_screen.dart`, `register_screen.dart`, and `reports_screen.dart`.
- `lib/providers/` — state providers for auth, bills, notifications, and language.
- `lib/services/notification_service.dart` — push notification initialization.
- `lib/utils/` — optional app utilities.
- `pubspec.yaml` — Flutter package dependencies and metadata.
- `android/`, `ios/`, `web/`, `macos/`, `windows/`, `linux/` — platform-specific directories for building.

### Run mobile app locally
1. Open terminal in `mobile_app/`
2. Fetch packages:
   - `flutter pub get`
3. Launch on a device or emulator:
   - `flutter run`
4. If building for a specific platform, choose:
   - `flutter run -d chrome` for web
   - `flutter run -d emulator-5554` for Android emulator
   - `flutter run -d <device-id>` for other connected devices

> For Firebase features, ensure `google-services.json` is added to `android/app/` and Firebase is configured correctly.

---

## Overall architecture

This repository is organized as a full-stack solution:

- `backend` provides the API and data layer.
- `frontend` is the web admin panel.
- `mobile_app` is the mobile client.

They are separate projects but are designed to work together through the backend API.

### Data flow

- The mobile app and frontend both communicate with the `backend` via HTTP APIs.
- Authentication is handled in the backend and exposed through `/api/auth`.
- The backend stores data in MongoDB and serves uploaded files from `/uploads`.
- The mobile app uses Firebase for push messages and local notification management.

---

## Notes and recommendations

- If you want to add features, start by extending the backend routes/controllers and then wire them into the frontend or mobile app.
- Keep the API base URL consistent in both `frontend/src/services/api.js` and `mobile_app/lib/providers/auth_provider.dart`.
- Because the backend uses `express.json()` and CORS, both web and mobile clients can connect easily.
- Use `nodemon` for backend development and `vite` for hot reload in the frontend.

---

## File summary

### Backend folder structure
- `config/db.js`
- `controllers/` (admin, auth, bills, categories, notifications, payments, reports, users)
- `middleware/authMiddleware.js`
- `models/` (AuditLog, Bill, Category, Notification, Payment, User)
- `routes/` (adminRoutes, authRoutes, billRoutes, categoryRoutes, notificationRoutes, paymentRoutes, reportRoutes, userRoutes)
- `utils/` (cronJobs, encryption, pdfGenerator, upload, waafiPay)
- `seed.js`
- `server.js`

### Frontend folder structure
- `src/App.jsx`
- `src/components/` (Layout, ProtectedRoute, Sidebar, Topbar)
- `src/context/I18nContext.jsx`
- `src/i18n/translations.js`
- `src/pages/` (Dashboard, Login, BillsManagement, BillCategories, Payments, ReportsAnalytics, etc.)
- `src/services/api.js`
- `src/store/`

### Mobile folder structure
- `lib/main.dart`
- `lib/providers/` (auth_provider.dart, bill_provider.dart, language_provider.dart, notification_provider.dart)
- `lib/screens/` (welcome, login, register, dashboard, mfa verify, mfa setup, reports)
- `lib/services/notification_service.dart`
- `android/`, `ios/`, `web/`, `windows/`, `macos/`, `linux/`

---

## Conclusion
This repository is a multi-platform billing management system with:

- a Node/Express backend API,
- a React/Vite admin frontend,
- a Flutter mobile client.

Use `npm run dev` in `backend`, `npm run dev` in `frontend`, and `flutter run` in `mobile_app` to start each piece.
