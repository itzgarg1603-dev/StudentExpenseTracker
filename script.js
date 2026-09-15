(() => {
  "use strict";

  const STORAGE_KEYS = {
    expenses: "student-expense-tracker.expenses",
    budgets: "student-expense-tracker.budgets",
  };
  const CURRENCY = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
  const today = new Date();
  const todayString = toDateString(today);
  const currentMonth = todayString.slice(0, 7);
  const state = {
    expenses: load(STORAGE_KEYS.expenses, []),
    budgets: load(STORAGE_KEYS.budgets, {}),
    dashboardMonth: currentMonth,
    filters: { month: currentMonth, category: "", paymentMethod: "", search: "" },
  };

  const elements = {
    budgetForm: document.querySelector("#budget-form"),
    budgetAmount: document.querySelector("#budget-amount"),
    budgetError: document.querySelector("#budget-error"),
    expenseForm: document.querySelector("#expense-form"),
    expenseId: document.querySelector("#expense-id"),
    expenseAmount: document.querySelector("#expense-amount"),
    expenseCategory: document.querySelector("#expense-category"),
    expenseDate: document.querySelector("#expense-date"),
    expenseDescription: document.querySelector("#expense-description"),
    expensePayment: document.querySelector("#expense-payment"),
    expenseError: document.querySelector("#expense-error"),
    expenseSubmit: document.querySelector("#expense-submit"),
    cancelEdit: document.querySelector("#cancel-edit"),
    monthSelector: document.querySelector("#month-selector"),
    budgetValue: document.querySelector("#budget-value"),
    budgetCaption: document.querySelector("#budget-caption"),
    spentValue: document.querySelector("#spent-value"),
    spentCaption: document.querySelector("#spent-caption"),
    remainingValue: document.querySelector("#remaining-value"),
    remainingCaption: document.querySelector("#remaining-caption"),
    progressCaption: document.querySelector("#progress-caption"),
    progressPercent: document.querySelector("#progress-percent"),
    progressTrack: document.querySelector(".progress-track"),
    progressBar: document.querySelector("#progress-bar"),
    categorySummary: document.querySelector("#category-summary"),
    categoryEmpty: document.querySelector("#category-empty"),
    filtersForm: document.querySelector("#filters-form"),
    filterMonth: document.querySelector("#filter-month"),
    filterCategory: document.querySelector("#filter-category"),
    filterPayment: document.querySelector("#filter-payment"),
    filterSearch: document.querySelector("#filter-search"),
    clearFilters: document.querySelector("#clear-filters"),
    exportData: document.querySelector("#export-data"),
    importData: document.querySelector("#import-data"),
    importFile: document.querySelector("#import-file"),
    expensesBody: document.querySelector("#expenses-body"),
    expensesEmpty: document.querySelector("#expenses-empty"),
    emptyTitle: document.querySelector("#empty-title"),
    emptyMessage: document.querySelector("#empty-message"),
    expenseCount: document.querySelector("#expense-count"),
  };

  initialize();

  function initialize() {
    elements.monthSelector.value = state.dashboardMonth;
    elements.filterMonth.value = state.filters.month;
    elements.budgetAmount.value = state.budgets[state.dashboardMonth] ?? "";
    elements.expenseDate.value = todayString;
    elements.expenseDate.max = todayString;
    render();

    elements.budgetForm.addEventListener("submit", saveBudget);
    elements.expenseForm.addEventListener("submit", saveExpense);
    elements.cancelEdit.addEventListener("click", resetExpenseForm);
    elements.monthSelector.addEventListener("change", changeDashboardMonth);
    elements.filtersForm.addEventListener("input", updateFilters);
    elements.filtersForm.addEventListener("change", updateFilters);
    elements.clearFilters.addEventListener("click", clearFilters);
    elements.exportData.addEventListener("click", exportData);
    elements.importData.addEventListener("click", () => elements.importFile.click());
    elements.importFile.addEventListener("change", importData);
    elements.expensesBody.addEventListener("click", handleTableAction);
  }

  function render() {
    renderOverview();
    renderCategorySummary();
    renderExpenses();
  }

  function renderOverview() {
    const monthExpenses = state.expenses.filter((expense) => expense.date.slice(0, 7) === state.dashboardMonth);
    const budget = Number(state.budgets[state.dashboardMonth] || 0);
    const spent = sum(monthExpenses);
    const remaining = budget - spent;
    const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    const displayedPercentage = budget > 0 ? Math.min(percentage, 100) : 0;

    elements.budgetValue.textContent = formatCurrency(budget);
    elements.budgetCaption.textContent = budget > 0 ? `For ${formatMonth(state.dashboardMonth)}` : "Set a budget to get started";
    elements.spentValue.textContent = formatCurrency(spent);
    elements.spentCaption.textContent = `${monthExpenses.length} ${pluralize("expense", monthExpenses.length)} this month`;
    elements.remainingValue.textContent = formatCurrency(remaining);
    elements.remainingValue.classList.toggle("over-budget", remaining < 0);
    elements.remainingCaption.textContent = budget > 0
      ? remaining < 0 ? `${formatCurrency(Math.abs(remaining))} over budget` : `${formatCurrency(Math.max(remaining, 0))} available`
      : "Set a budget to track balance";
    elements.progressPercent.textContent = budget > 0 ? `${percentage}%` : "0%";
    elements.progressCaption.textContent = budget > 0
      ? `${formatCurrency(spent)} spent of ${formatCurrency(budget)}`
      : "Set your budget to see spending progress.";
    elements.progressBar.style.width = `${displayedPercentage}%`;
    elements.progressTrack.classList.toggle("over-budget", percentage > 100);
    elements.progressTrack.setAttribute("aria-valuenow", String(displayedPercentage));
  }

  function renderCategorySummary() {
    const totals = new Map();
    state.expenses
      .filter((expense) => expense.date.slice(0, 7) === state.dashboardMonth)
      .forEach((expense) => totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount));
    const categories = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const maximum = categories[0]?.[1] || 1;

    elements.categorySummary.replaceChildren();
    elements.categoryEmpty.classList.toggle("hidden", categories.length > 0);
    categories.forEach(([category, amount]) => {
      const row = document.createElement("div");
      row.className = "category-row";
      const heading = document.createElement("div");
      heading.className = "category-row-heading";
      const label = document.createElement("span");
      label.textContent = category;
      const total = document.createElement("span");
      total.textContent = formatCurrency(amount);
      heading.append(label, total);
      const bar = document.createElement("div");
      bar.className = "category-bar";
      bar.setAttribute("aria-label", `${category}: ${formatCurrency(amount)}`);
      const fill = document.createElement("span");
      fill.style.width = `${Math.round((amount / maximum) * 100)}%`;
      bar.append(fill);
      row.append(heading, bar);
      elements.categorySummary.append(row);
    });
  }

  function renderExpenses() {
    const filtered = getFilteredExpenses();
    elements.expensesBody.replaceChildren();
    filtered.forEach((expense) => elements.expensesBody.append(createExpenseRow(expense)));
    const totalLabel = `${filtered.length} ${pluralize("expense", filtered.length)}`;
    elements.expenseCount.textContent = totalLabel;
    elements.expensesEmpty.classList.toggle("hidden", filtered.length > 0);
    elements.emptyTitle.textContent = state.filters.month || state.filters.category || state.filters.paymentMethod || state.filters.search
      ? "No matching expenses"
      : "No expenses yet";
    elements.emptyMessage.textContent = state.filters.month || state.filters.category || state.filters.paymentMethod || state.filters.search
      ? "Try clearing a filter or changing your search."
      : "Add your first expense to start seeing your spending here.";
  }

  function createExpenseRow(expense) {
    const row = document.createElement("tr");
    row.dataset.id = expense.id;
    appendCell(row, formatDate(expense.date));
    appendCell(row, expense.description);
    const categoryCell = appendCell(row);
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = expense.category;
    categoryCell.append(badge);
    appendCell(row, expense.paymentMethod);
    const amountCell = appendCell(row, formatCurrency(expense.amount));
    amountCell.className = "amount";
    const actionsCell = appendCell(row);
    actionsCell.className = "actions-column";
    const actions = document.createElement("div");
    actions.className = "action-buttons";
    actions.append(createActionButton("Edit", "edit"), createActionButton("Delete", "delete"));
    actionsCell.append(actions);
    return row;
  }

  function appendCell(row, text = "") {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.append(cell);
    return cell;
  }

  function createActionButton(label, action) {
    const button = document.createElement("button");
    button.className = `icon-button${action === "delete" ? " delete" : ""}`;
    button.type = "button";
    button.dataset.action = action;
    button.textContent = label;
    button.setAttribute("aria-label", `${label} expense`);
    return button;
  }

  function saveBudget(event) {
    event.preventDefault();
    const amount = Number(elements.budgetAmount.value);
    elements.budgetError.textContent = "";
    if (!Number.isFinite(amount) || amount < 0) {
      elements.budgetError.textContent = "Enter a valid budget of $0 or more.";
      return;
    }
    state.budgets[state.dashboardMonth] = roundMoney(amount);
    save(STORAGE_KEYS.budgets, state.budgets);
    elements.budgetAmount.value = "";
    renderOverview();
  }

  function saveExpense(event) {
    event.preventDefault();
    const values = {
      amount: Number(elements.expenseAmount.value),
      category: elements.expenseCategory.value,
      date: elements.expenseDate.value,
      description: elements.expenseDescription.value.trim(),
      paymentMethod: elements.expensePayment.value,
    };
    const error = validateExpense(values);
    elements.expenseError.textContent = error;
    if (error) return;

    const id = elements.expenseId.value;
    if (id) {
      const index = state.expenses.findIndex((expense) => expense.id === id);
      if (index !== -1) state.expenses[index] = { id, ...values, amount: roundMoney(values.amount) };
    } else {
      state.expenses.push({ id: createId(), ...values, amount: roundMoney(values.amount) });
    }
    save(STORAGE_KEYS.expenses, state.expenses);
    resetExpenseForm();
    render();
  }

  function validateExpense(values) {
    if (!Number.isFinite(values.amount) || values.amount <= 0) return "Enter an amount greater than $0.";
    if (!values.category || !values.paymentMethod || !values.description) return "Complete all expense fields.";
    if (!isValidDate(values.date) || values.date > todayString) return "Choose a valid date that is not in the future.";
    return "";
  }

  function handleTableAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const row = button.closest("tr");
    const expense = state.expenses.find((item) => item.id === row?.dataset.id);
    if (!expense) return;
    if (button.dataset.action === "edit") startEdit(expense);
    if (button.dataset.action === "delete") deleteExpense(expense);
  }

  function startEdit(expense) {
    elements.expenseId.value = expense.id;
    elements.expenseAmount.value = expense.amount.toFixed(2);
    elements.expenseCategory.value = expense.category;
    elements.expenseDate.value = expense.date;
    elements.expenseDescription.value = expense.description;
    elements.expensePayment.value = expense.paymentMethod;
    elements.expenseSubmit.textContent = "Save changes";
    elements.cancelEdit.classList.remove("hidden");
    elements.expenseError.textContent = "";
    document.querySelector("#add-expense").scrollIntoView({ behavior: "smooth", block: "start" });
    elements.expenseAmount.focus();
  }

  function deleteExpense(expense) {
    if (!window.confirm(`Delete "${expense.description}"?`)) return;
    state.expenses = state.expenses.filter((item) => item.id !== expense.id);
    save(STORAGE_KEYS.expenses, state.expenses);
    render();
  }

  function resetExpenseForm() {
    elements.expenseForm.reset();
    elements.expenseId.value = "";
    elements.expenseDate.value = todayString;
    elements.expenseError.textContent = "";
    elements.expenseSubmit.textContent = "Add expense";
    elements.cancelEdit.classList.add("hidden");
  }

  function changeDashboardMonth() {
    state.dashboardMonth = elements.monthSelector.value || currentMonth;
    elements.budgetAmount.value = state.budgets[state.dashboardMonth] ?? "";
    render();
  }

  function updateFilters() {
    state.filters = {
      month: elements.filterMonth.value,
      category: elements.filterCategory.value,
      paymentMethod: elements.filterPayment.value,
      search: elements.filterSearch.value.trim().toLowerCase(),
    };
    renderExpenses();
  }

  function clearFilters() {
    elements.filterMonth.value = "";
    elements.filterCategory.value = "";
    elements.filterPayment.value = "";
    elements.filterSearch.value = "";
    updateFilters();
  }

  function exportData() {
    const backup = {
      app: "Student Expense Tracker",
      version: 1,
      exportedAt: new Date().toISOString(),
      expenses: state.expenses,
      budgets: state.budgets,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `student-expense-tracker-${todayString}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!Array.isArray(imported.expenses) || !imported.budgets || typeof imported.budgets !== "object") {
          throw new Error("Invalid backup structure");
        }
        const expenses = imported.expenses.filter(isValidImportedExpense).map((expense) => ({
          id: String(expense.id),
          amount: roundMoney(Number(expense.amount)),
          category: String(expense.category),
          date: expense.date,
          description: String(expense.description).trim(),
          paymentMethod: String(expense.paymentMethod),
        }));
        if (!window.confirm(`Replace current data with ${expenses.length} imported expenses?`)) return;
        state.expenses = expenses;
        state.budgets = sanitizeBudgets(imported.budgets);
        save(STORAGE_KEYS.expenses, state.expenses);
        save(STORAGE_KEYS.budgets, state.budgets);
        render();
        window.alert("Data imported successfully.");
      } catch (error) {
        console.error("Unable to import expense tracker backup.", error);
        window.alert("That file is not a valid expense tracker backup.");
      } finally {
        elements.importFile.value = "";
      }
    });
    reader.readAsText(file);
  }

  function isValidImportedExpense(expense) {
    return expense && typeof expense === "object" && Number.isFinite(Number(expense.amount))
      && Number(expense.amount) > 0 && isValidDate(expense.date)
      && typeof expense.category === "string" && typeof expense.description === "string"
      && typeof expense.paymentMethod === "string";
  }

  function sanitizeBudgets(budgets) {
    return Object.fromEntries(Object.entries(budgets)
      .filter(([month, amount]) => /^\d{4}-\d{2}$/.test(month) && Number.isFinite(Number(amount)) && Number(amount) >= 0)
      .map(([month, amount]) => [month, roundMoney(Number(amount))]));
  }

  function getFilteredExpenses() {
    return [...state.expenses]
      .filter((expense) => !state.filters.month || expense.date.slice(0, 7) === state.filters.month)
      .filter((expense) => !state.filters.category || expense.category === state.filters.category)
      .filter((expense) => !state.filters.paymentMethod || expense.paymentMethod === state.filters.paymentMethod)
      .filter((expense) => !state.filters.search || `${expense.description} ${expense.category} ${expense.paymentMethod}`.toLowerCase().includes(state.filters.search))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function load(key, fallback) {
    try {
      const value = JSON.parse(window.localStorage.getItem(key));
      return value ?? fallback;
    } catch (error) {
      console.error(`Unable to load ${key} from local storage.`, error);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Unable to save ${key} to local storage.`, error);
    }
  }

  function sum(expenses) {
    return roundMoney(expenses.reduce((total, expense) => total + Number(expense.amount), 0));
  }

  function formatCurrency(amount) {
    return CURRENCY.format(Number(amount) || 0);
  }

  function formatMonth(month) {
    return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  }

  function isValidDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const parsed = new Date(`${date}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  }

  function toDateString(date) {
    return date.toISOString().slice(0, 10);
  }

  function roundMoney(amount) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function pluralize(word, count) {
    return `${word}${count === 1 ? "" : "s"}`;
  }
})();
