# Student Expense Tracker

A responsive, browser-only expense tracker for students. Set a monthly budget, record purchases, review category totals, and filter your history without creating an account.

## Live demo

Use the deployed app here: **[Student Expense Tracker](https://itzgarg1603-dev.github.io/StudentExpenseTracker/)**

## Features

- Monthly budget, total spent, remaining balance, and progress percentage
- Add, edit, and delete expenses
- Expense fields for amount, category, date, description, and payment method
- Validation for positive amounts, complete fields, valid dates, and future dates
- Month, category, payment-method, and text filters
- Category spending summary and helpful empty states
- Data stored locally in the browser with `localStorage`
- Export and import JSON backups to move or protect your data
- Responsive layout with keyboard focus states and semantic, accessible markup

## How to use

1. Choose the month you want to manage and enter a monthly budget.
2. Add an expense with its amount, date, category, description, and payment method.
3. Review the dashboard cards and progress bar to see how much is available.
4. Use the category summary to identify your biggest spending areas.
5. Search or filter the expense table by month, category, payment method, or description.
6. Select **Edit** to update a record or **Delete** to remove it after confirmation.

Amounts must be greater than zero, and dates cannot be invalid or in the future. The date field defaults to today for faster entry.

## Back up and restore

Use **Export data** to download a JSON backup containing your expenses and monthly budgets. Keep this file somewhere safe before clearing browser data or moving to another browser.

Use **Import data** to restore a backup. The app validates the file structure and expense values before asking for confirmation. Importing replaces the current data in this browser; export your current data first if you need to keep it.

## Run locally

This is a static app with no build step or dependencies. Open `index.html` in a browser, or serve the directory with any static web server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy with GitHub Pages

The project is ready for GitHub Pages because it has no build step:

1. Push the files to the repository's `main` branch.
2. Open **Settings → Pages** on GitHub.
3. Select **Deploy from a branch**, choose `main`, and select `/ (root)`.
4. Save and wait for the Pages deployment to finish.

The live URL follows this format:

```text
https://YOUR_USERNAME.github.io/StudentExpenseTracker/
```

## Storage

Expenses and monthly budgets are saved in the browser under:

- `student-expense-tracker.expenses`
- `student-expense-tracker.budgets`

Clearing this site's local storage removes the saved tracker data.

## Technical details

- **Frontend:** semantic HTML, CSS custom properties, and vanilla JavaScript
- **Persistence:** browser `localStorage`; no server or account is required
- **Security:** user-entered values are rendered with safe DOM APIs rather than HTML string interpolation
- **Accessibility:** labeled form controls, keyboard focus indicators, table headers, live validation messages, and responsive layouts
- **Compatibility:** works in current desktop and mobile browsers with JavaScript enabled
