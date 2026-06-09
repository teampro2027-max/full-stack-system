# Frontend Documentation (Somali)

## 1. Ujeedada Frontend-ka

`frontend` waa qaybta webka ee maamulka mashruuca. Waxay tilmaantaa bogga admin-ka halkaas oo lagu maareeyo:

- dashboard-ka
- isticmaaleyaasha
- biilasha
- lacag-bixinta
- xaqiijinta lacag-bixinta
- xasuusinada
- warbixinada
- nidaamyada amniga
- luqadda iyo settings

Waxay isticmaashaa API-ga backend si ay xogta u hesho uuna u kaydiyo.

## 2. Teknolojiyada la isticmaalay

- React 19
- Vite
- Tailwind CSS
- Zustand
- React Router DOM
- Axios
- Recharts
- Framer Motion

## 3. Qaab-dhismeedka Folder-ka

```
frontend/
  public/
  src/
    App.jsx
    assets/
    components/
      Layout.jsx
      ProtectedRoute.jsx
      Sidebar.jsx
      Topbar.jsx
    context/
      I18nContext.jsx
    i18n/
      translations.js
    pages/
      BillCategories.jsx
      BillsManagement.jsx
      Dashboard.jsx
      EVCPlus.jsx
      ExpenseTracking.jsx
      LanguageSettings.jsx
      Login.jsx
      PaymentConfirmations.jsx
      Payments.jsx
      ReminderManagement.jsx
      ReportsAnalytics.jsx
      RolesPermissions.jsx
      Security.jsx
      SystemSettings.jsx
      UserManagement.jsx
    services/
      api.js
    store/
      useStore.js
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  README.md
```

## 4. Sida frontend-ku u shaqeeyo

### 4.1 Wadada App-ka (`src/App.jsx`)

- `BrowserRouter` ayaa isticmaalaha u gudbiya bogagga
- `Routes` ayaa qeexaya xiriirada
- `/login` waxa uu tusaa `Login` page
- `ProtectedRoute` wuxuu ilaaliyaa bogagga gudaha sida dashboard, users, bills, iwm.
- `Layout` ayaa ku dara sidebar iyo topbar marka user uu galo
- route-yada gudaha waxaa ka mid ah:
  - `/` => `Dashboard`
  - `/users` => `UserManagement`
  - `/categories` => `BillCategories`
  - `/bills` => `BillsManagement`
  - `/payments` => `Payments`
  - `/payment-confirmations` => `PaymentConfirmations`
  - `/reminders` => `ReminderManagement`
  - `/reports` => `ReportsAnalytics`
  - `/expenses` => `ExpenseTracking`
  - `/security` => `Security`
  - `/language` => `LanguageSettings`
  - `/settings` => `SystemSettings`
  - `/evc-plus` => `EVCPlus`
  - `/roles` => `RolesPermissions`

### 4.2 ProtectedRoute

- `ProtectedRoute.jsx` wuxuu hubiyaa haddii token jiro
- haddii token ma jiro, user waa loo celinayaa `/login`
- haddii uu jiro, bogagga gudaha waa la ogol yahay

### 4.3 I18nContext

`src/context/I18nContext.jsx` wuxuu maamulaa tarjumaadda luqadda.
`src/i18n/translations.js` wuxuu ka kooban yahay qoraalada Ingiriis iyo Somali.

### 4.4 API Service

`src/services/api.js` waa meesha laga abuuro axios client.

- `baseURL` waa `http://localhost:5000/api`
- Token JWT waxaa lagu darayaa `Authorization` header request kasta
- API endpoint-yada muhiimka ah:
  - `loginAdmin` (`/auth/login`)
  - `getDashboardStats` (`/admin/stats`)
  - `getAdminUsers`, `createAdminUser`, `updateAdminUser`, `deleteAdminUser`
  - `getAdminBills`, `createAdminBill`, `updateAdminBill`, `deleteAdminBill`
  - `getAdminPayments`, `confirmPayment`, `rejectPayment`
  - `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`

## 5. Bogagga muhiimka ah

### 5.1 Login
- `src/pages/Login.jsx`
- Bogga login wuxuu soo qaataa email iyo password
- Waxaa la isticmaalaa `loginAdmin` API si loo galo
- Marka login guuleysto, token-ka waxaa lagu keydiyaa state ama local storage

### 5.2 Dashboard
- `src/pages/Dashboard.jsx`
- Waxay muujisaa warbixinno kooban iyo jaantusyo
- Waxay isticmaashaa API-ga backend si ay u hesho xogta dashboard

### 5.3 UserManagement
- `src/pages/UserManagement.jsx`
- Liiska isticmaaleyaasha admin
- Awood u leh in la abuuro, la cusbooneysiiyo, la tirtiro users

### 5.4 BillsManagement
- `src/pages/BillsManagement.jsx`
- Maamulka biilasha
- Abuur, cusbooneysii, tirtir biilasha

### 5.5 Payments & Confirmations
- `src/pages/Payments.jsx`
- `src/pages/PaymentConfirmations.jsx`
- Muujinaya xogta lacag-bixinta iyo xaqiijinta

### 5.6 ReportsAnalytics
- `src/pages/ReportsAnalytics.jsx`
- Warbixino iyo jaantusyo analytics

### 5.7 Settings iyo Security
- `src/pages/SystemSettings.jsx`
- `src/pages/Security.jsx`
- `src/pages/LanguageSettings.jsx`
- Maamulka amniga iyo luqadda

## 6. Qaab-dhismeedka Xogta iyo Isku-xirka

Frontend-ku wuxuu u diraa codsiyada backend sidii JSON.

- Token JWT waxaa lagu kaydiyaa localStorage
- Axios interceptor-ka ayaa ku dara `Authorization: Bearer TOKEN`
- Haddii JSON response uu muujiyo khalad, bogga login wuxuu user-ka u celin karaa

## 7. Sidee loo bilaabaa frontend?

1. Fur terminal `frontend/`
2. `npm install`
3. `npm run dev`
4. Booqo `http://localhost:5173`

## 8. Talooyin

- Haddii aad rabto in aad bedesho API URL, `src/services/api.js` ka beddel `baseURL`.
- Haddii `login` ama `protected routes` uusan shaqayn, hubi `localStorage` iyo `token` key-ga.
- Font-ka iyo style-ka waxaa lagu maamulaa `tailwind.config.js` iyo `postcss.config.js`.
- Haddii aad rabto in aad isticmaasho `dark mode`, `src/store/useStore.js` ayaa xaqiijinaya theme-ka.

## 9. Qaybaha Frontend ee Ugu Muhiimsan

- `Layout.jsx` — qaabdhismeedka guud ee admin panel-ka
- `Sidebar.jsx` — menu hoostiisa
- `Topbar.jsx` — bar sare oo muujinaya user-ka iyo profile
- `ProtectedRoute.jsx` — hubinta authorization

## 10. Xog dheeraad ah

Frontend-ka ayaa si gaar ah loogu talagalay in uu noqdo admin panel oo kaliya; maaha mobile UI.
Waxa uu ku xiran yahay backend API-ga si uu u helo xogta isticmaaleyaasha, biilasha, iyo lacag-bixinta.
