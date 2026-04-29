# Payment Screen Documentation / Dukumeentiga Bogga Lacag-bixinta

This document describes the items and components in the **Payment Screen** UI of the mobile application.
Dokumentigan wuxuu sharraxayaa dhammaan qaybaha iyo walxaha ku jira bogga **Lacag-bixinta** ee app-ka.

---

## 1. Header Section / Qaybta Sare
The header provides a clear overview of the bill being paid.
Qaybta sare waxay ku tusaysaa faahfaahinta biilka aad bixinayso.

- **Bill Title (Magaca Biilka)**: Displays the name of the service or bill (e.g., "Electricity Bill").
- **Amount Card (Sanduuqa Lacagta)**: 
    - **Visual**: A premium gradient background (Indigo color).
    - **Input**: A large, center-aligned field for entering the amount in USD.
    - **Icon**: A monetization icon ($) for clarity.

---

## 2. Payment Methods (Tabs) / Noocyada Lacag-bixinta
Users can switch between two payment methods.
Isticmaaluhu wuxuu kala dooran karaa laba qaab oo lacagta loogu bixiyo.

- **EVC Plus**: Somali mobile money payment provider.
- **Stripe Card**: International credit/debit card payment (Visa, Mastercard).

---

## 3. EVC Plus Features / Adeegga EVC Plus
Items specifically shown when the EVC Plus tab is active.
Waxyaabaha muuqda marka aad doorato EVC Plus.

- **Wallet Indicator**: A green success card showing "EVC Plus Wallet".
- **Registered Phone (Numberka Diiwaangashan)**: Shows the user's phone number as stored in the system.
- **Receiver Input (Numberka Loo Dirayo)**: 
    - **Design**: A clean "Box" style input with an android phone icon.
    - **Purpose**: To enter the destination phone number (e.g., 25261...).
- **Secure PIN (PIN-ka Sirta ah)**: 
    - **Design**: A secure field (obscured text) where only 4 digits can be entered.
    - **Icon**: A lock icon indicating security.
- **Action Button (Badhanka Bixi)**: A prominent Green button labeled **"Pay with EVC Plus"**.

---

## 4. Stripe Card Features / Adeegga Kaarka (Stripe)
Items specifically shown when the Stripe tab is active.
Waxyaabaha muuqda marka aad doorato Stripe Card.

- **Card Providers**: A blue info card showing accepted cards (Visa/Mastercard).
- **Card Fields (Godadka Kaarka)**:
    - **Card Number**: 16-digit field with a credit card icon.
    - **Expiry & CVV**: Two side-by-side fields for card duration and security code.
    - **Cardholder Name**: Name on the card.
- **Action Button (Badhanka Bixi)**: A prominent Indigo button labeled **"Pay with Card"**.

---

## 5. Transaction Result / Natiijada Lacag-bixinta
What appears after a payment attempt.
Waxa soo baxa marka aad gujiso 'Pay'.

- **Status Icon**: A large Check mark (Green) for success or X mark (Red) for failure.
- **Transaction Details**: 
    - **Transaction ID**: Unique identifier for the payment.
    - **Reference ID**: Provider-specific reference.
- **Back Button**: A button to return to the Bills list.

---

> [!TIP]
> All labels and messages are synchronized with the `LanguageProvider` for multi-language support (Somali/English).
