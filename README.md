# Exercise Resolute Synergy 2026 — Entry Control System

A professional, real-time entry clearance and personnel registration portal built for the **Ghana Armed Forces (GAF)** joint tabletop command post exercise: *“Enhancing Preparedness Through Joint Training”*. 

This system handles secure self-service registration, instant QR code card generation, and automated or manual entry verification at GAF entry control points.

---

## 🚀 Key Features

*   **Secure Self-Service Registration** — Responsive registration form collects Service Number, Rank, Gender, Unit, and contact details with optional fields stripped dynamically.
*   **Prevent Duplicate Registrations** — Built-in uniqueness validation prevents multiple submissions using the same Service Number, Email, or Phone.
*   **Automatic QR Code & unique ID Card** — Generates printable/downloadable entry passes immediately upon registration.
*   **Sleek Print Formatting** — Media query styles isolate only the QR code, Unique ID, and basic details on printed passes, hiding nav links and background colors automatically.
*   **Command Control Dashboard** — Monitor total stats (Pending, Approved, Entered, Rejected) with search queries and category filters.
*   **Clean Manual Verification** — Search and check-in personnel at the gate using case-insensitive, hyphen-agnostic matching.
*   **Secure Admin Sign-In** — Control room dashboard access is protected by env-secured credentials checking (`SokoAerial` / `soko123`).
*   **Vercel Serverless integration** — Communicates with Firestore, sends Vynfy SMS notifications via serverless APIs, and resolves local networking variables.

---

## 🛠️ Tech Stack

*   **Frontend Framework:** React 19 (TypeScript, Vite)
*   **Styling Engine:** Tailwind CSS + custom print CSS
*   **Database:** Serverless Google Cloud Firestore
*   **Serverless APIs:** Vercel Functions (Node.js/TypeScript)
*   **Messaging System:** Vynfy SMS Aggregator Gateway

---

## ⚙️ Local Development Setup

### 1. Clone the project
```bash
git clone https://github.com/kingsleyweb-tech/mil.entry-system.git
cd mil.entry-system/client
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Local Environment Variables
Create a `.env` file in the `client/` folder:
```env
# Local network IP (allows opening QR codes on mobile via local Wi-Fi)
VITE_APP_BASE_URL=http://your-local-ip:5173

# Firebase Config Keys
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id


# Local Dev Admin Login credentials (avoids 404s on dev server)
VITE_DEV_ADMIN_USERNAME=your_dev_admin_username
VITE_DEV_ADMIN_PASSWORD=your_dev_admin_password
```

### 4. Run Vite Server
```bash
npm run dev -- --host
```


## 📄 License

This system is custom built for security clearance and administration during GAF tabletop command operations. Unauthorized access, distribution, or reproduction of control assets is prohibited.
