# FD Optimization Program

An intelligent, web-based Fixed Deposit optimization and portfolio reallocation application governed by **RBI-Scheduled Commercial Banks** and strictly compliant with **DICGC ₹5,00,000 Deposit Insurance safety limits**.

---

## 🌟 Key Capabilities & Features

### 1. Customer Classification & Drop-down Selector
The app provides a dedicated drop-down list covering 4 investor classes:
- **`senior citizen FD`**: Resident Senior Citizens (aged 60 to <70 years). Features preferential rate spreads (+0.25% to +1.00%), bank premature penalty waivers (YES Bank 0%, RBL Bank 0%, IndusInd Bank 0%, Ujjivan >6m 0%, DCB 0.50%, SBI 0.50% <= ₹5L), and Section 80TTB tax deduction.
- **`local resident FD`**: Domestic General Residents (< 60 years). Evaluated under standard base card rates and standard retail premature penalty policies (0.50% to 1.00%).
- **`NRO FD`**: Non-Resident Ordinary Rupee Deposits for income originated in India. Accounts for 30% TDS + cess (or DTAA treaty relief) and USD 1 Million FY repatriation limit under FEMA with Form 15CA/15CB.
- **`NRI FD`**: Non-Resident External (NRE) Rupee Deposits. Evaluated under 100% Tax-Free status in India (Section 10(4)(ii)), 100% free repatriation abroad, and mandatory 1-year minimum tenure rule.

### 2. Date of Birth (DOB) Input & Age Validation
- Placed in a separate form group with instant live age calculation.
- Automatically validates whether the investor's age qualifies for the selected category (e.g. warning if Senior Citizen is chosen for age < 60, or recommending Senior Citizen benefits if age ≥ 60).

### 3. Dynamic Reusable Execution Prompt Generator
- Directly adapts the underlying AI prompt and RBI regulatory logic in real-time as the user selects the FD category or changes date of birth.
- Displays the complete adapted prompt in a collapsible card with one-click **Copy Prompt** and **Download Prompt (.md)**.

### 4. Dual Portfolio Ingestion Modes
- **Option 1: Upload FD Portfolio**:
  - Drag-and-drop or file upload for `.xlsx`, `.xls`, `.csv`, `.json`.
  - Maps columns: `COMPANY NAME`, `TYPE`, `AMOUNT`, `INT %`, `Start Date`, `MATURITY DATE`, `Maturity Status`, `Deposit First Name`.
  - Fixes source typos (e.g., 1930/1931 maturity dates automatically corrected to 2030/2031).
  - One-click **"Load Attached Sample Portfolio"** button preloads the 67 records from the attached portfolio.
- **Option 2: Create / Input FD Details Online (Then and There)**:
  - Interactive spreadsheet grid where the customer can add rows, edit amounts, rates, dates, bank names, and holder capacities inline.

### 5. Quantitative Optimization Engine & Rules
- Identifies **Section 1: Reinvest Immediately** for overdue/already matured deposits earning idle ~3.0% savings rates.
- Evaluates **Section 2: Break & Move Now** by calculating:
  $$\text{Net Pre-Tax Gain} = \text{New Expected Interest} - \text{Status Quo Remaining Interest} - \text{Exit Penalty Cost}$$
- Only recommends switching when net gain after penalties exceeds the **₹1,500 hurdle**.
- Strictly enforces **DICGC ₹5 Lakh deposit insurance safety**, splitting deposits exceeding ₹5 Lakh across multiple top-tier banks to eliminate uninsured risk.
- Identifies **Section 3: Verify Before Moving** for sovereign products (e.g. Senior Citizens Savings Scheme ₹30L, 5-yr, 8.20%) to save premature penalty losses (₹45,000).

### 6. Publication-Grade PDF Report Output: `FD checklist.pdf`
- Outputs **only one PDF file named `FD checklist.pdf`**.
- Formatted in an executive, high-density, **2-Page Landscape A4 layout** with zero blank space.
- Features:
  - **Download FD Checklist (PDF)** button.
  - **View FD Checklist (PDF)** modal viewer with embedded PDF support.
  - Native browser landscape printing.

---

## 🚀 How to Run the App

### Method 1: Local Web Server (Recommended)
Double-click `launch_app.bat` or run in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File start_app.ps1
```
This starts the local web server at `http://localhost:8085` and automatically launches your browser.

### Method 2: Direct Browser Launch
Open `index.html` directly in **Microsoft Edge** or **Google Chrome**:
```
C:\Users\Bimal\.gemini\antigravity\scratch\fd_optimization_app\index.html
```

---

## 🌐 Live Production Deployment

The application is deployed live with high-contrast, fully accessible typography:
👉 **[https://cr4t38ti1e.brewpage.app/](https://cr4t38ti1e.brewpage.app/)**

---

## ⏰ Automated 2:00 AM Daily Server-Side Rate Refresh

The application features fully automated daily rate synchronization:
- **Cloud Cron Workflow (`.github/workflows/daily_rate_sync.yml`)**:
  - Triggers automatically at `30 20 * * *` (2:00 AM IST / 20:30 UTC daily).
  - Runs in the cloud on GitHub Actions even when personal devices are powered off.
  - Recalibrates retail rate cards across all 44 RBI-scheduled banks, validates DICGC insurance limits, and auto-deploys the updated standalone application directly to production via the deployment API.
- **In-App Client Sync**:
  - If loaded from local cache, the application checks if the rate cache is older than 24 hours and updates local memory seamlessly.

---

## 📁 Directory Structure
```
fd_optimization_app/
├── .github/workflows/         # Daily 2:00 AM IST cloud sync workflow
│   └── daily_rate_sync.yml
├── index.html                 # Main application dashboard
├── styles.css                 # High-contrast Fintech UI & Landscape A4 styling
├── app.js                     # Core optimization logic, prompt generator & auto-sync
├── banks_data.js              # 44 RBI-scheduled commercial banks directory data
├── sample_portfolio.xlsx      # Downloadable template Excel workbook
├── sample_portfolio.csv       # Downloadable sample CSV
├── blank_template.csv         # Clean blank template CSV
├── FD_checklist_template.html # Publication-grade Landscape A4 HTML report
├── FD checklist.pdf           # The official generated PDF report
└── README.md                  # Project documentation & execution guide
```
