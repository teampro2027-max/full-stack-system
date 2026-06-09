# Mobile App Documentation (Somali)

## 1. Ujeedada Mobile App-ka

`mobile_app` waa qaybta Flutter ee mashruuca. Waa app-ka mobile-ka ee MultiBill oo bixiya:

- Login iyo register
- Welcome screen
- Dashboard iyo biilasha
- Taariikhda lacag-bixinta
- Xasuusinada iyo ogeysiisyada
- MFA (Multi-factor Authentication)
- Warbixinada
- Settings iyo profile

## 2. Teknolojiyada la isticmaalay

- Flutter / Dart
- Provider (state management)
- Firebase Core
- Firebase Messaging
- flutter_secure_storage
- http
- shared_preferences
- flutter_local_notifications
- url_launcher
- open_file_plus
- path_provider
- flutter_advanced_drawer

## 3. Qaab-dhismeedka Folder-ka

```
mobile_app/
  android/
  ios/
  web/
  macos/
  windows/
  linux/
  lib/
    main.dart
    providers/
      auth_provider.dart
      bill_provider.dart
      language_provider.dart
      notification_provider.dart
    screens/
      add_bill_screen.dart
      dashboard_screen.dart
      login_screen.dart
      mfa_setup_screen.dart
      mfa_verify_screen.dart
      notification_screen.dart
      payment_history_screen.dart
      payment_screen.dart
      profile_screen.dart
      register_screen.dart
      reports_screen.dart
      settings_screen.dart
      splash_screen.dart
      welcome_screen.dart
    services/
      notification_service.dart
  pubspec.yaml
  pubspec.lock
  README.md
  analysis_options.yaml
  payment_screen_doc.md
```

## 4. Sidee mobile app-ku u shaqeeyaa?

### 4.1 `lib/main.dart`

- Waa galka ugu weyn ee app-ka
- Waxaa lagu bilaabaa `Firebase.initializeApp()`
- Waxaa lagu xiraa `NotificationService.initialize()`
- `MultiProvider` ayaa ku daraya provider-yo: AuthProvider, BillProvider, NotificationProvider, LanguageProvider
- `MaterialApp` wuxuu leeyahay `initialRoute: '/welcome'`
- Routes-ka muhiimka ah:
  - `/` => SplashScreen
  - `/welcome` => WelcomeScreen
  - `/login` => LoginScreen
  - `/register` => RegisterScreen
  - `/dashboard` => DashboardScreen
  - `/mfa-setup` => MfaSetupScreen
  - `/mfa-verify` => MfaVerifyScreen
  - `/reports` => ReportsScreen

### 4.2 Welcome Screen

- `lib/screens/welcome_screen.dart`
- Waxay muujisaa interface qurux badan oo leh labo button:
  - `Login`
  - `Sign Up`
- Waxay siisaa user-ka muuqaalka ugu horreeya ee app-ka

### 4.3 Login Screen

- `lib/screens/login_screen.dart`
- Waxay isticmaashaa `AuthProvider.login()`
- Haddii user uu leeyahay MFA, waxaa loo direyaa `/mfa-verify`
- Password iyo email waxaa la xaqiijiyaa ka hor inta aan la dirin request

### 4.4 Register Screen

- `lib/screens/register_screen.dart`
- Diiwaangelinta user cusub
- Email, password, phone iyo magac ayaa la qoreyaa
- Markii registration guuleysto, user ayaa lagu gudbiyaa dashboard ama login

### 4.5 Splash Screen

- `lib/screens/splash_screen.dart`
- Waxa uu hubiyaa haddii user hore loo galay iyo token jira
- Haddii user hore loo galay, wuxuu u boodaa `/dashboard`
- Haddii kale, wuxuu u gudbaa `/welcome`

### 4.6 Dashboard iyo Screen-nada kale

- `dashboard_screen.dart` — Dashboard-ka ugu weyn
- `payment_screen.dart` — Qaabka lacag bixinta
- `payment_history_screen.dart` — Taariikhda lacag bixinta
- `notification_screen.dart` — Ogeysiisyada
- `profile_screen.dart` — Macluumaadka user-ka
- `register_screen.dart` — Diiwaangelinta
- `mfa_setup_screen.dart` iyo `mfa_verify_screen.dart` — MFA setup iyo verification
- `reports_screen.dart` — Warbixinada
- `settings_screen.dart` — Dejinta guud
- `add_bill_screen.dart` — Ku dar biil cusub

## 5. Provider-yada iyo State Management

### 5.1 AuthProvider

`lib/providers/auth_provider.dart`

- Wuxuu maamulaa token, user, iyo loading state
- Endpoint-ka backend:
  - `POST /auth/login`
  - `POST /auth/register`
- Waxa uu keydiyaa token JWT iyo user data `flutter_secure_storage`
- Haddii login uu u baahdo MFA, wuxuu soo celiyaa `requiresMfa`
- Wuxuu sidoo kale cusboonaysiiyaa FCM token server-ka

### 5.2 BillProvider

- Waxaa ku jira state-ka biilasha iyo hawlaha biilabka
- Waxaa loo isticmaali karaa in la xakameeyo data-ka bills gudaha dashboard

### 5.3 NotificationProvider

- Maamula ogaysiisyada iyo fariimaha app-ka
- Waxay ka caawisaa soo dejinta push notifications

### 5.4 LanguageProvider

- Waxay maamushaa luqadda app-ka (tusaale `en` ama `so`)
- Waxay badali kartaa qoraalada iyo interface-ka luqad kale

## 6. Xiriirka API ee Mobile

Mobile app-ka wuxuu `AuthProvider` ka isticmaalaa URL:

- Web: `http://localhost:5000/api`
- Android emulator: `http://10.0.2.2:5000/api`

API-yada muhiimka ah ee uu waco:
- `/auth/login`
- `/auth/register`
- `/auth/login` (MFA)

## 7. Firebase iyo Ogeysiinta

- `firebase_core` waxaa loo isticmaalaa in la bilaabo Firebase
- `firebase_messaging` waxaa loo isticmaalaa push notification
- `NotificationService.initialize()` ayaa diyaarinaya ogeysiisyada
- `flutter_local_notifications` ayaa loo isticmaalaa in la muujiyo ogeysiisyada gudaha qalabka

## 8. Sidee loo bilaabaa mobile app-ka?

1. Fur terminal `mobile_app/`
2. `flutter pub get`
3. `flutter run`
4. Haddii aad rabto web, `flutter run -d chrome`
5. Haddii aad rabto emulator Android, `flutter run -d emulator-5554`

## 9. Talooyin

- DHCP-ga mobile emulator-ka wuxuu isticmaalaa `10.0.2.2` si uu uga xiro `localhost` backend.
- Hubi in `google-services.json` uu ku jiro `android/app/` haddii aad rabto Firebase.
- Haddii app-ku uusan helin token, `flutter_secure_storage` ayaa keydineysa JWT.
- `SplashScreen` ayaa go'aamisa haddii user uu hore u galay ama uu u gudbo welcome.

## 10. Qaybaha ugu muhiimsan ee Mobile App

- `main.dart` — bilowga app-ka iyo route configuration
- `lib/screens/` — dhammaan shaashadaha app-ka
- `lib/providers/` — state management iyo auth flow
- `lib/services/notification_service.dart` — adeegga notification
- `pubspec.yaml` — dependencies iyo metadata

## 11. Nuxurka ugu weyn ee app-ka

Mobile app-ka wuxuu la shaqeeyaa backend si uu u helo auth, biilasha, iyo payments.
Waxay isticmaashaa `Provider` si ay u maamusho state oo ay u xirnaato UI-ga.

Tani waa sida mashruucan u kala qaybsan yahay:
- `backend` = API server iyo database
- `frontend` = admin web interface
- `mobile_app` = mobile client oo Flutter ah
