# Backend Documentation (Somali)

## 1. Ujeedada Backend-ka

`backend` waa qaybta server-ka ee mashruuca. Waxay qabataa:

- Maamulka isticmaaleyaasha
- Aqoonsiga iyo galitaanka (login/register)
- Maamulka biilasha (bills)
- Maamulka lacag-bixinta (payments)
- Digniinaha iyo warbixinada
- Kategoriyada biilasha
- Hawlaha jadwaleysan (cron jobs)
- Kaydinta iyo soo celinta faylasha la soo geliyo

Backend-ka wuxuu u shaqeeyaa sida API u adeega frontend iyo mobile app.

## 2. Teknolojiyada la isticmaalay

- Node.js
- Express
- MongoDB oo la socda Mongoose
- Firebase Admin
- JSON Web Tokens (JWT)
- Multer (file upload)
- Node-cron (jadwaleynta shaqooyinka)
- PDFKit iyo qrcode generation
- Speakeasy (MFA / 2FA)
- Bcryptjs (hashing password)
- CORS iyo dotenv

## 3. Qaab-dhismeedka Folder-ka

```
backend/
  config/
    db.js
  controllers/
    adminController.js
    authController.js
    billController.js
    categoryController.js
    notificationController.js
    paymentController.js
    reportsController.js
    userController.js
  middleware/
    authMiddleware.js
  models/
    AuditLog.js
    Bill.js
    Category.js
    Notification.js
    Payment.js
    User.js
  routes/
    adminRoutes.js
    authRoutes.js
    billRoutes.js
    categoryRoutes.js
    notificationRoutes.js
    paymentRoutes.js
    reportRoutes.js
    userRoutes.js
  utils/
    cronJobs.js
    encryption.js
    pdfGenerator.js
    upload.js
    waafiPay.js
  server.js
  seed.js
  package.json
  uploads/
```

## 4. Models / Tables (MongoDB collections)

Backend-ku wuxuu leeyahay 6 model ama collection oo muhiim ah:

1. `User` — macluumaadka isticmaalaha
2. `Bill` — xogta biilasha
3. `Payment` — taariikhda iyo xaaladda bixitaanka
4. `Category` — noocyada biilasha
5. `Notification` — digniinaha iyo fariimaha
6. `AuditLog` — log ama taariikhda ficillada isticmaalaha

### Faahfaahinta Model-ka

#### User
- `name`, `email`, `phone`, `password`
- `role` (`user` ama `admin`)
- `status` (`active`, `inactive`, `suspended`)
- `mfaSecret`, `mfaEnabled`
- `preferredLanguage`, `notificationsEnabled`
- `fcmToken`, `lastLogin`

#### Bill
- `userId` (soo xigasho User)
- `title`, `amount`, `dueDate`
- `category` (electricity, water, internet, rent, school_fees, mobile_postpaid, tv_subscription, waste_collection, loan_installment, government_license)
- `status` (`paid`, `unpaid`, `overdue`)
- `isRecurring`, `recurringInterval`, `notes`
- `receiptUrl`, `documentUrl`, `language`
- `title` iyo `notes` waxaa lagu kaydiyaa encryption kahor `save()`

#### Payment
- `billId`, `userId`
- `amount`, `method` (`EVC`, `WaafiPay`)
- `status` (`pending`, `success`, `failed`)
- `transactionId`, `referenceId`, `invoiceId`, `requestId`
- `provider`, `providerResponse`
- `paidDate`, `phoneNumber`, `receiverPhone`

#### Category
- Ku saabsan noocyada biilasha iyo maamulka categooriya

#### Notification
- Digniino la diri karo iyo kaydinta fariimaha

#### AuditLog
- Ficillada sida `REGISTER`, `LOGIN`, iwm.
- Taariikhda iyo isticmaalaha sameeyay ficilka

## 5. Route-yada API

API-ga backend-ka waxaa lagu dhigaa `server.js` adigoo ku xira `routes/*.js`.

### `server.js`
- `app.use(express.json())`
- `app.use(cors())`
- `app.use('/uploads', express.static(...))`
- `app.use('/api/auth', require('./routes/authRoutes'))`
- `app.use('/api/users', require('./routes/userRoutes'))`
- `app.use('/api/bills', require('./routes/billRoutes'))`
- `app.use('/api/payments', require('./routes/paymentRoutes'))`
- `app.use('/api/notifications', require('./routes/notificationRoutes'))`
- `app.use('/api/reports', require('./routes/reportRoutes'))`
- `app.use('/api/admin', require('./routes/adminRoutes'))`
- `app.use('/api/categories', require('./routes/categoryRoutes'))`
- `utils/cronJobs.js` ayaa la shaqaaleysiinayaa si loo sameeyo shaqooyinka jadwaleysan

## 6. Sidee backend-ku u shaqeeyaa?

### 6.1 Auth iyo JWT
- `POST /api/auth/register` — diiwaangelinta isticmaalaha
- `POST /api/auth/login` — gelitaanka isticmaalaha
- `GET /api/auth/mfa/setup` — qaabka MFA
- `POST /api/auth/mfa/enable` — dhaqaajinta MFA
- `POST /api/auth/mfa/disable` — damiska MFA

Server-ku wuxuu soo saaraya token JWT oo u oggolaanaya isticmaalaha inuu helo API-yada difaacan.

### 6.2 Bill management
- `GET /api/bills` — liiska biilasha isticmaalaha
- `POST /api/bills` — abuur biil cusub (waxaa lagu lifaaqi karaa dokument)
- `PUT /api/bills/:id` — cusboonaysii biil
- `DELETE /api/bills/:id` — tirtir biil
- `POST /api/bills/voice` — soo gudbi qoraal la turjumay si loo soo jeediyo biil cusub

### 6.3 Payment management
- `POST /api/payments` — samee payment ama xaqiiji
- `GET /api/payments` — liiska payments-ka
- `PUT /api/payments/:id/confirm` — xaqiiji payment
- `PUT /api/payments/:id/reject` — diid payment

### 6.4 Admin iyo categories
- `GET /api/admin/stats` — xog kooban dashboard
- `GET /api/admin/users` — liiska user-ka
- `POST /api/admin/users` — samee user
- `PUT /api/admin/users/:id` — cusboonaysii user
- `DELETE /api/admin/users/:id` — tirtir user
- `GET /api/categories` — liiska categories
- `POST /api/categories` — samee category
- `PUT /api/categories/:id` — cusboonaysii category
- `DELETE /api/categories/:id` — tirtir category

### 6.5 Notifications iyo reports
- `GET /api/notifications` — liiska digniinaha
- `POST /api/notifications` — dir digniin
- `GET /api/reports` — warbixinada iyo analytics

## 7. Sidee loo bilaabaa backend?

1. Fur terminal `backend/`
2. `npm install`
3. Ku samee `.env` feyl dheeraad ah haddii uusan jirin
4. `npm run dev` ama `npm start`
5. Booqo `http://localhost:5000`

## 8. Talooyin

- Backend-ku wuxuu u baahan yahay MongoDB si uu u shaqeeyo.
- Hubi `process.env.JWT_SECRET` iyo `MONGODB_URI` ee `.env`.
- `uploads/` waa meesha faylasha la soo geliyo lagu kaydiyo.
- `utils/encryption.js` ayaa lagu isticmaalaa bill-ka si loo ilaaliyo `title` iyo `notes`.

---

## 9. Xog dheeraad ah oo muhiim ah

Backend-ka wuxuu leeyahay QAAB-DHISME kala duwan oo u oggolaanaya in frontend iyo mobile app labadaba ay ku xirmaan isla API.

- `middleware/authMiddleware.js` ayaa hubiya token-ka JWT
- `controllers/` ayaa kala saaraya hawlaha ganacsi (business logic)
- `routes/` ayaa qeexaya dariiqa HTTP ee la isticmaalo
- `models/` ayaa qeexaya qaababka xogta MongoDB
