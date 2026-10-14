# Personal Budget & Expense Dashboard with Google Sheets Database

A responsive, multi-user personal finance and expense tracking dashboard built with HTML5, Tailwind CSS, and vanilla JavaScript, backed by **Google Sheets as the database**.

## Features

- **Google Sheets Database Integration**:
  - **Live Cloud Database**: Connect any Google Spreadsheet to act as your permanent database.
  - **Zero Server Setup**: Uses a free Google Apps Script web endpoint (`google_apps_script.js`), requiring no Node.js, Python, or local servers.
  - **Automatic Bi-directional Sync**:
    - **Auto-Sync**: Adding, editing, or deleting a transaction or category writes directly to Google Sheets in real time.
    - **Pull from Sheet**: Fetches the latest records directly from Google Sheets into your dashboard.
    - **Push All to Sheet**: Bulk upload all current transactions and categories into your spreadsheet.
  - **Google Sheets Table View**: Toggle between standard **Dashboard View** and the raw **Sheets Table View** (showing mapped column cells: *ID, User ID, Date, Type, Category, Description, Amount, Payment Method, Notes, Created At*).
  - **Offline Resilience**: Automatically falls back to browser `localStorage` if offline or when no sheet is connected.
- **Personal User Accounts & Authentication**:
  - **Sign In & Registration**: Create your own private account with your name, username, password, and preferred currency, or log in instantly using the demo profile (*john / password123*).
  - **Complete Profile Isolation**: Each user has their own independent dataset saved per user ID.
  - **User Profile Header & Logout**: Displays your name, handle, avatar initials, and active session management.
- **Custom Expense Categories (Strictly Alphabetical A–Z)**:
  - **Create Your Own Categories**: Add custom categories (e.g., *Pet Care*, *Gym & Fitness*, *Travel*, *Subscriptions*) from the **Categories (A–Z)** modal or inline inside the **Add Record** modal.
  - **Set Category Budgets**: Assign monthly spending limits to your new categories.
  - **Dynamic Palette Colors**: Automatically assigns consistent, vibrant colors to any new category.
  - **Alphabetical Ordering Everywhere**:
    - Transaction category dropdowns sorted A–Z.
    - Category Filter dropdown sorted A–Z.
    - Category Budget vs. Actual progress bars sorted A–Z.
    - Category Budgets editor sorted A–Z.
    - Donut chart legend sorted A–Z.
- **Financial KPI Cards**:
  - **Total Monthly Budget**: Sum of all active category target allocations.
  - **Total Expenses**: Real-time spending tally with percentage of monthly budget used.
  - **Remaining Budget**: Clear status badge (*Safe & On track* vs *Alert / Exceeded*).
  - **Net Cash Flow**: Total income minus total expenses with automatic savings rate percentage calculation.
- **Semi-Monthly Salary Allocation & Savings Tracking (10 Months)**:
  - **15th & 30th Cutoff Pay Tracking**: Track semi-monthly salary cutoffs (15th and 30th) across a 10-month schedule (August 2026 to May 2027), matching the design from your reference screenshot.
  - **6 Dedicated KPI Cards**:
    - `INCOME 15TH`: Total combined 15th cutoff income across all months (e.g. ₱250,300.64).
    - `INCOME 30TH`: Total combined 30th cutoff income across all months (e.g. ₱244,353.68).
    - `TOTAL INCOME`: Aggregate combined earnings across both cutoffs (e.g. ₱494,654.32 in vibrant sky blue).
    - `REMAINING (BUDGET – ACTUAL)`: Total planned budget minus actual spending, with `% remaining of budget` (e.g. ₱160,307.81 / 52% remaining).
    - `PROJECTED SAVINGS (Income – Total Budget)`: Forecasted savings when sticking to budget, with `% of income` (e.g. ₱185,554.32 / 38% of income).
    - `ACTUAL SAVINGS (Income – Actual Expenses)`: Realized savings in hand, with `% of income saved` (e.g. ₱345,862.13 / 70% saved).
  - **10-Month Breakdown Table**:
    - Complete month-by-month table (*August 2026 – May 2027*) displaying: `MONTH | INCOME 15TH | INCOME 30TH | TOTAL BUDGET | ACTUAL EXPENSES | REMAINING | % REM. | PROJECTED SAVINGS | ACTUAL SAVINGS`.
    - Over-budget months and negative margins automatically highlight in bright red (e.g. `₱-3,375.19`, `-9%`), while positive margins display in emerald green.
    - Summary **`Total`** row with aggregate column totals and percentage metrics.
  - **Collapsible Section (`Hide` / `Show`)**: One-click collapsible section with chevron toggle to keep your dashboard clean.
  - **Edit Salary & Budget Allocation Modal**:
    - Quick-apply standard cutoffs to all empty months in one click.
    - Customize individual cutoffs (15th & 30th) and total budget for each month.
    - Auto-Sync toggle per month to automatically link actual expenses with logged transactions for that period.
    - One-click restore to sample screenshot values.
- **Visual Analytics**:
  - **Interactive Category Donut Chart**: Proportional breakdown of expenses per category with live center totals.
  - **Category Budget vs. Actual**: Progress meters with color-coded warning thresholds (<80% green, 80-100% amber, >100% red).
  - **Daily Spending Trend**: High-resolution bar chart showing daily outflow distribution across the month.
- **Transaction Management**:
  - **Add / Edit Records**: Log expenses or income with description, amount, date, category, payment method, and notes.
  - **Filtering & Search**: Live keyword search, category filter, and type filter (Expense vs. Income).
  - **CSV Export**: One-click download of filtered transaction history to CSV format named after your user profile.

---

## How to Connect Google Sheets as Your Database (2-Minute Setup)

1. Open [Google Sheets](https://sheets.new) to create a new spreadsheet.
2. In the top menu, click **Extensions > Apps Script**.
3. Open the file [google_apps_script.js](file:///c:/Users/John%20Alvin%20Baylon/OneDrive/Antigravity/google_apps_script.js), copy the entire code, and paste it into the Apps Script editor replacing any default code.
4. Click the **Save** floppy icon.
5. In the top-right corner, click **Deploy > New deployment**:
   - Click the gear icon next to *Select type* and choose **Web app**.
   - Description: `Budget Dashboard DB`
   - Execute as: `Me`
   - Who has access: **Anyone** *(Essential so the dashboard can write to the sheet!)*
   - Click **Deploy** and authorize permissions when prompted.
6. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/.../exec`).
7. Open [index.html](file:///c:/Users/John%20Alvin%20Baylon/OneDrive/Antigravity/index.html) in your browser:
   - Click the **Google Sheets DB** button in the top navigation.
   - Paste your Web app URL into the input field and click **Connect & Test**.
   - Click **Push All to Sheet** to immediately populate your spreadsheet!

### Generated Google Sheet Tables

The script automatically sets up formatted tables inside your spreadsheet:
- **`Transactions`**: `ID`, `User ID`, `Date`, `Type`, `Category`, `Description`, `Amount`, `Payment Method`, `Notes`, `Created At`
- **`Categories`**: `Category Name`, `Type`, `Monthly Budget Target`, `User ID`
- **`Budgets`**: `User ID`, `Category`, `Monthly Target`, `Updated At`
- **`Salary`**: `Month Key`, `Month Label`, `Income 15th`, `Income 30th`, `Total Budget`, `User ID`, `Updated At`
