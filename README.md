# Student Expense Tracker

A responsive, browser-only expense tracker for students. Set a monthly budget, record purchases, review category totals, and filter your history without creating an account.

## Features

- Monthly budget, total spent, remaining balance, and progress percentage
- Add, edit, and delete expenses
- Expense fields for amount, category, date, description, and payment method
- Validation for positive amounts, complete fields, valid dates, and future dates
- Month, category, payment-method, and text filters
- Category spending summary and helpful empty states
- Data stored locally in the browser with `localStorage`
- Responsive layout with keyboard focus states and semantic, accessible markup

## Run locally

This is a static app with no build step or dependencies. Open `index.html` in a browser, or serve the directory with any static web server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Storage

Expenses and monthly budgets are saved in the browser under:

- `student-expense-tracker.expenses`
- `student-expense-tracker.budgets`

Clearing this site's local storage removes the saved tracker data.
