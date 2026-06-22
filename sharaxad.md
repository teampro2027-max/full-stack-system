# Sharaxaadda Systemka MultiBill (Documentation)

Halkan waxaa ku qoran jawaabaha iyo sharaxaadda buuxda ee systemkaaga sidaad u codsatay:

## 1. Maxaa isticmasheen? (Technologies Used)
Systemkan waa **Full-Stack** dhamaystiran, waxaana loo adeegsaday teknoolojiyadahan casriga ah:
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), iyo Firebase Admin.
- **Frontend:** React 19, Vite, Tailwind CSS, iyo Zustand (State Management).
- **Mobile App:** Flutter iyo Dart, oo ku xiran Firebase Core & Messaging.

## 2. RACK END (Backend)
Backend-ka waxaa lagu dhisay **Node.js** iyo **Express**, wuxuuna shaqadiisu tahay inuu xakameeyo API-yada (REST API). Xogta waxaa lagu kaydiyaa **MongoDB**. Waxyaabaha uu backend-ka qabto waxaa kamid ah:
- Authentication (JWT iyo MFA) iyo hubinta OTP.
- Xogta Bills-ka, Payments-ka, iyo Users-ka.
- Node-cron (jadwalynta shaqooyinka).
- Abuurista PDF iyo QR code.
- La falgalka WaafiPay ee lacag bixinta.

## 3. FRONT END
Frontend-ka waa qaybta Admin-ka (Web Dashboard), waxaana lagu dhisay **React 19**.
- Waxaa loo isticmaalay **Tailwind CSS** si naqshad qurux badan loo helo.
- Wuxuu leeyahay charts/reports (Recharts) iyo animations (Framer Motion).
- Waa meesha uu maamulaha (Admin) ka xakameeyo systemka oo dhan.

## 4. Sharax systemka
Systemkani waa **MultiBill Management System**, waa nidaam loo sameeyay in si casri ah loogu maamulo biilasha kala duwan, macaamiisha, lacag bixinta (payments), iyo ogeysiisyada. Wuxuu fududaynayaa in maamulku la socdo xisaabaadka, macaamiishuna ay biilashooda kala socdaan mobilkooda, lacagtana si toos ah u bixiyaan.

## 5. SYSTEMKINA MEQA FEATURE KA KOBAN?
Systemku wuxuu ka kooban yahay dhowr features oo waaweyn:
1. **User Management:** Maamulida macaamiisha iyo admin-yada.
2. **Bill Management:** Abuurista, bixinta, iyo dabagalka biilasha.
3. **Payment Processing:** La socoshada bixinta lacagaha iyo xaqiijintooda (WaafiPay).
4. **Notifications:** Dirida farriimaha ogeysiiska ah (Push notifications / SMS / Email).
5. **Reports & Analytics:** Warbixinada xisaabaadka (charts iyo PDF generation).
6. **Authentication & Security:** Login, is-diiwaangelin, OTP, iyo MFA.
7. **Categories:** Kala soocidda noocyada biilasha.

## 6. SYSTEMKINA MEQA NUC KA KOBAN?
Wuxuu ka kooban yahay **3 Qaybood (Types)** oo wada shaqeynaya:
1. **Backend API:** Qaybta xogta kaydisa ee dhexe.
2. **Web Admin Dashboard:** Qaybta kombuyuutarka ee maamulka (React).
3. **Mobile Application:** Qaybta moobilka ee macaamiisha (Flutter).

## 7. ADMIN MAXO QAWAN KARA?
Admin-ku (Maamulaha) wuxuu leeyahay awood buuxda, wuxuuna qaban karaa:
- Inuu arko dhammaan xogta systemka iyo warbixinada (Dashboard Analytics).
- Inuu diiwaangeliyo, bedelo, ama tirtiro isticmaalayaasha (Users).
- Inuu soo saaro biilal cusub kana dalbado macaamiisha.
- Inuu xaqiijiyo lacagaha la bixiyay kana dhigo 'Paid'.
- Inuu diro farriimo ogeysiis ah (Notifications) guud ama kuwo gaar ah.
- Inuu soo dejisto warbixinada isagoo PDF ah.

## 8. USER MAXO QAWAN KARA?
User-ka (Macaamiilka) wuxuu ku isticmaali karaa Mobile App-ka amaba Web-ka waxaana u furan:
- Inuu is-diiwaangeliyo oo uu login ku soo galo OTP/MFA.
- Inuu arko biilasha lagu leeyahay iyo kuwii uu horay u bixiyay (History).
- Inuu iska bixiyo biilka isagoo adeegsanaya nidaamka lacag bixinta.
- Inuu helo farriimo (Notifications) marka biil loo soo qoro ama lacag ka go'do.
- Inuu arko macluumaadkiisa gaarka ah oo uu habayn karo.

## 9. Systemkina maxo ka anfaca?
Wuxuu aad ugu fiican yahay shirkadaha ama hay'adaha bixiya adeegyada bilaha ah (sida Korontada, Biyaha, Internet-ka, Iskuulada, iwm). Wuxuu yareynayaa shaqadii gacanta, warqadihii biilasha, wuxuuna fududaynayaa in macaamiilka mobilkiisa loogu diro biilka, isna uu isla mobilkiisa uga bixiyo.

## 10. Kaliya lacag bixin miyaa?
**Maya.** Kaliya ma ahan lacag bixin. Waa nidaam xisaabaad (Accounting) oo dhamaystiran. Wuxuu leeyahay:
- Kaydinta xogta macaamiisha.
- Xasuusin (Reminders) - in macmiilka la xasuusiyo biilka kahor inta uusan dhicin.
- Warbixino dhaqaale oo charts ah iyo PDF ah oo maamulka u sahlaya go'aan qaadashada.

## 11. NB : IN MOBILE KINA KA KACSAN YAHAY
**Haa**, Mobile App-ka aad buu u kacsan yahay (waa active). Waxaa lagu dhisay **Flutter**, wuxuuna ku shaqeynayaa Android iyo iOS labadaba. Wuxuu ku xiran yahay Firebase si uu u helo Live Notifications, wuxuuna toos xogta uga akhrisanayaa Backend-ka.

## 12. NEXT DAY MOBILE APP?
Mobile app-ka waa mid diyaarsan oo la soo saari karo ("Next Day Mobile App" wuu noqon karaa haddii deegaamaynta iyo server-ka la diyaariyo). Koodhka moobilka waa dhamaystiran yahay, waxaana laga dhex heli karaa galka `mobile_app`.

## 13. NB IN QOFKA MARKA LADIWAN KALINAYO IN VERIFICATION LOO DIRO
**Haa, waa lagu daray.** Systemka waxaa ku jirta qaybta xaqiijinta (Verification). Marka qofku is-diiwaangelinayo, waxaa loo dirayaa koodka xaqiijinta (OTP) si loo xaqiijiyo sax ahaanshaha email-kiisa ama nambarkiisa, sidoo kale wuxuu leeyahay MFA (Multi-Factor Authentication).

## 14. NB MARKA QOFKA OO GMAIL OTP KUSO GALO IN MAR 2 WAD LA ISKU DIWAN GALIN KARIN
**Waa la xaliyay.** Backend-ka (qaybta `authRoutes` iyo `controllers`) ayaa hubinaya in hal Email (Gmail) ama hal nambar aan laba jeer la isku diiwaangelin karin. Haddii uu emailkaasi hore u jiray, systemku wuxuu usheegayaa inuu horay u diiwaangashanaa ee uu Login sameeyo, kumana celinayo diiwaangelin labaad.

## 15. Payment questions?
Nidaamka lacag bixinta waxaa loo sameeyay qaab casri ah. Waxaa ku dhex jira isku-xirka (Integration) bixiyeyaasha lacagaha sida **WaafiPay** (eeg `utils/waafiPay`). Lacag bixinta marka la sameeyo, API-ga ayaa hubinaya, kadibna Bill-ka status-kiisa u bedelaya "Paid". Waxaa sidoo kale diyaar ah liiska "Payment History" si loo dabagalo dhammaan lacagihii soo xarooday.

## 16. Back end into yaala?
Koodhka Backend-ku wuxuu ku jiraa galka `backend/` ee project-ga. Xagga ciwaanka (Hosting), systemku wuxuu diyaar u yahay in la saaro Cloud Servers sida Render, Heroku, ama VPS. Sida muuqata, waxaad haysataa file-ka `render.yaml` kaas oo tusinaya in si fudud loogu host-gareyn karo **Render**.

## 17. Systemkina sido udhisan yahay?
Systemku wuxuu u dhisanyahay nidaam loo yaqaan **API-Driven Architecture**:
- Backend-ka waa dhexdhexaadiyaha (Central API Server) wuxuuna ku hadlaa luqada JSON.
- Frontend-ka (React) iyo Mobile App-ka (Flutter) waxay "Request" (Dalab) u dirayaan Backend-ka si ay u helaan ama u diraan xogta.
- Haddii la rabo mustaqbalka nidaam kale (tusaale, shirkad kale) in lagu xiro, API-ga ayuun bay isticmaalayaan. Waa nidaam furfuran oo la kordhin karo (Scalable).

## 18. Shaqooyinka oo qabanayo systemkina
- Maamulida Account-yada iyo amniga (Login, Register, MFA).
- Diiwaangelinta Bill-asha cusub bil kasta.
- Isku-xirka lacag bixinta casriga ah (Mobile Money).
- Ogeysiin otomaatig ah (Automated Reminders) maalmaha lacag bixintu dhowdahay (CronJobs ayaa qabanaya).
- Kaydinta diiwaanka lacag bixinta iyo abuurista warqad caddayn ah (PDF Invoices).

## 19. Featur kasta maxa hoos imanaya
- **Authentication:** Waxaa hoos yimaada Register, Login, Verify OTP, MFA Setup.
- **Bill Management:** Waxaa hoos yimaada Create Bill, Update Bill, Delete Bill, Filter Bills by Status (Paid, Pending).
- **Users (Admin Only):** Waxaa hoos yimaada Create User, Block/Unblock User, View User History.
- **Reports:** Waxaa hoos yimaada Total Revenue, Unpaid Bills, Monthly Charts, PDF Report Export.
- **Categories:** Waxaa hoos yimaada abuurista qaybaha biilasha (Biyo, Koronto, iwm).
- **Notifications:** Waxaa hoos yimaada in farriin Push ah ama Alert loo diro user-ka.

## 20. Ugu danbeen codeka ina fahan santahay
Koodhku aad buu u habeysan yahay oo waan wada fahansanahay. Faylasha muhiimka ah sida `server.js` waxay si fiican isugu xirayaan Routes-ka iyo Database-ka. Nidaamka Middleware-ka ayaa hubinaya in waddooyinka (Routes) la xafiday (Protected). Web Frontend-ku waa gooni, Mobile-kuna waa gooni, labadooduna backend-ka ayay si nabadgelyo ah (secure) uga shaqeeyaan. Systemkani waa mid xirfadaysan oo si fiican loo dhisay!
