const storageKey = 'spendwise-personal-budget-v1';
const emptyData = {
  monthlyBudget: null,
  savingsGoal: null,
  savingsContributions: [],
  expenses: []
};

const categories = [
  { id: 'food', label: 'Food & dining', icon: '✦' },
  { id: 'transport', label: 'Transport', icon: '↗' },
  { id: 'rent', label: 'Rent & home', icon: '⌂' },
  { id: 'leisure', label: 'Entertainment', icon: '♫' },
  { id: 'shopping', label: 'Shopping', icon: '◇' },
  { id: 'utilities', label: 'Utilities', icon: '⌁' }
];

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES'
});

const inputDialog = document.querySelector('#inputDialog');
const inputForm = document.querySelector('#inputForm');
const amountInput = document.querySelector('#amountInput');
const descriptionInput = document.querySelector('#descriptionInput');
const categoryInput = document.querySelector('#categoryInput');
const expenseFields = document.querySelector('#expenseFields');
const statusMessage = document.querySelector('#statusMessage');
const sidebar = document.querySelector('.sidebar');
const menuToggle = document.querySelector('#menuToggle');
const primaryMenu = document.querySelector('#primaryMenu');
let inputMode = 'budget';
let storageWarning = '';

function setMobileMenuOpen(isOpen) {
  sidebar.classList.toggle('menu-open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
}

function isValidAmount(value, allowEmpty = false) {
  return (allowEmpty && value === null)
    || (typeof value === 'number' && Number.isFinite(value) && value > 0);
}

function validateSavedData(data) {
  return data
    && isValidAmount(data.monthlyBudget, true)
    && isValidAmount(data.savingsGoal, true)
    && Array.isArray(data.expenses)
    && data.expenses.every((expense) => (
      expense
      && typeof expense.description === 'string'
      && isValidAmount(expense.amount)
      && categories.some((category) => category.id === expense.category)
      && typeof expense.date === 'string'
    ))
    && Array.isArray(data.savingsContributions)
    && data.savingsContributions.every((contribution) => (
      contribution
      && isValidAmount(contribution.amount)
      && typeof contribution.date === 'string'
    ));
}

function loadSavedData() {
  try {
    const savedData = localStorage.getItem(storageKey);
    if (savedData === null) {
      return structuredClone(emptyData);
    }

    const parsedData = JSON.parse(savedData);
    if (!validateSavedData(parsedData)) {
      throw new Error('Saved budget data has an invalid format.');
    }
    return parsedData;
  } catch (error) {
    console.error('Unable to load saved SpendWise data.', error);
    storageWarning = ' Saved data could not be loaded; new entries will start fresh.';
    return structuredClone(emptyData);
  }
}

const budgetData = loadSavedData();

function formatCurrency(value) {
  return currencyFormatter.format(value).replace('Ksh', 'KSh');
}

function getTotalSpent() {
  return budgetData.expenses.reduce((total, expense) => total + expense.amount, 0);
}

function getTotalSavings() {
  return budgetData.savingsContributions.reduce((total, contribution) => total + contribution.amount, 0);
}

function calculateSpendingPercentage(expensesTotal, budget) {
  if (budget === null || budget <= 0) {
    return 0;
  }
  return Math.round((expensesTotal / budget) * 100);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function renderCategories(totalSpent) {
  const totals = Object.fromEntries(categories.map((category) => [category.id, 0]));
  const counts = Object.fromEntries(categories.map((category) => [category.id, 0]));

  for (const expense of budgetData.expenses) {
    totals[expense.category] += expense.amount;
    counts[expense.category] += 1;
  }

  const cards = categories.map((category) => {
    const amount = totals[category.id];
    const percentage = totalSpent === 0 ? 0 : Math.round((amount / totalSpent) * 100);
    const card = createElement('article', `category-card ${category.id}`);
    const topLine = createElement('div', 'card-topline');
    topLine.append(createElement('span', 'category-icon', category.icon));
    topLine.append(createElement('span', 'menu-dots', '•••'));
    const details = document.createElement('div');
    details.append(createElement('h3', '', category.label));
    details.append(createElement('p', '', `${counts[category.id]} ${counts[category.id] === 1 ? 'transaction' : 'transactions'}`));
    const footer = createElement('div', 'card-footer');
    footer.append(createElement('strong', '', formatCurrency(amount)));
    footer.append(createElement('span', '', `${percentage}%`));
    const track = createElement('div', 'mini-track');
    const bar = document.createElement('span');
    bar.style.width = `${percentage}%`;
    track.append(bar);
    card.append(topLine, details, footer, track);
    return card;
  });

  document.querySelector('#categoryGrid').replaceChildren(...cards);
}

function renderActivity() {
  const rows = [];
  for (let index = budgetData.expenses.length - 1; index >= 0 && rows.length < 8; index -= 1) {
    const expense = budgetData.expenses[index];
    const category = categories.find((item) => item.id === expense.category);
    const row = createElement('div', 'activity-row');
    row.append(createElement('span', `activity-symbol ${category.id}`, category.icon));
    const name = createElement('span', 'activity-name');
    name.append(createElement('strong', '', expense.description));
    name.append(createElement('small', '', `${category.label} · ${expense.date}`));
    row.append(name);
    row.append(createElement('strong', 'activity-amount', `-${formatCurrency(expense.amount)}`));
    rows.push(row);
  }

  if (rows.length === 0) {
    rows.push(createElement('p', 'empty-state', 'No expenses recorded yet. Add your first expense to get started.'));
  }
  document.querySelector('#activityList').replaceChildren(...rows);
}

function renderSavingsGoal() {
  const totalSaved = getTotalSavings();
  const goal = budgetData.savingsGoal;
  const remaining = goal === null ? null : Math.max(goal - totalSaved, 0);
  const percentage = goal === null ? 0 : Math.round((totalSaved / goal) * 100);
  const progressValue = Math.min(percentage, 100);
  const progress = document.querySelector('.goal-progress');

  document.querySelector('#savingsAmount').textContent = formatCurrency(totalSaved);
  document.querySelector('#goalAmount').textContent = goal === null ? 'Not set' : formatCurrency(goal);
  document.querySelector('#savingsProgress').style.width = `${progressValue}%`;
  document.querySelector('#savingsNote').textContent = goal === null
    ? 'Set a savings goal to track your progress.'
    : remaining === 0
      ? 'You reached your savings goal. Great work!'
      : `${formatCurrency(remaining)} left to reach your goal`;
  progress.setAttribute('aria-valuenow', String(progressValue));
}

function displayBudgetResults(message = '') {
  const totalSpent = getTotalSpent();
  const budget = budgetData.monthlyBudget;
  const remainingBalance = budget === null ? null : budget - totalSpent;
  const spendingPercentage = calculateSpendingPercentage(totalSpent, budget);
  const progressValue = Math.min(spendingPercentage, 100);
  const balanceProgress = document.querySelector('.balance-visual');
  const remainingPercentage = budget === null
    ? 0
    : Math.max(0, Math.min((remainingBalance / budget) * 100, 100));

  document.querySelector('#budgetAmount').textContent = budget === null ? 'Not set' : formatCurrency(budget);
  document.querySelector('#spentAmount').textContent = formatCurrency(totalSpent);
  document.querySelector('#balanceAmount').textContent = remainingBalance === null
    ? 'Set a budget'
    : formatCurrency(remainingBalance);
  document.querySelector('#balanceStatus').textContent = remainingBalance === null
    ? 'Not set'
    : remainingBalance < 0 ? 'Over budget' : 'On track';
  document.querySelector('#balanceCaption').textContent = budget === null
    ? 'Set a monthly budget to track your balance.'
    : `${Math.round(remainingPercentage)}% of your budget remains.`;
  document.querySelector('#balanceProgress').style.width = `${remainingPercentage}%`;
  balanceProgress.setAttribute('aria-valuenow', String(Math.round(remainingPercentage)));
  document.querySelector('#spendingProgress').style.width = `${progressValue}%`;
  document.querySelector('#spendingNote').textContent = budget === null
    ? totalSpent === 0
      ? 'Add an expense to start tracking.'
      : 'Set a budget to compare your spending.'
    : `${spendingPercentage}% of your monthly budget`;
  document.querySelector('#spendingStatus').textContent = budget !== null && totalSpent > budget
    ? 'Over budget'
    : totalSpent > 0 ? 'Tracking' : 'Ready';
  renderCategories(totalSpent);
  renderActivity();
  renderSavingsGoal();

  if (message) {
    statusMessage.textContent = `${message}${storageWarning}`;
    storageWarning = '';
  }
}

function saveData(message) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(budgetData));
  } catch (error) {
    console.error('Unable to save SpendWise data in this browser.', error);
    statusMessage.textContent = `${message} Changes could not be saved in this browser.`;
    return false;
  }
  displayBudgetResults(message);
  return true;
}

function openInputDialog(mode) {
  inputMode = mode;
  const isBudget = mode === 'budget';
  const isGoal = mode === 'goal';
  const isExpense = mode === 'expense';
  const isSavings = mode === 'savings';
  document.querySelector('#inputLabel').textContent = isBudget
    ? 'Monthly budget'
    : isGoal ? 'Savings goal' : isSavings ? 'Savings contribution' : 'New expense';
  document.querySelector('#inputTitle').textContent = isBudget
    ? 'Set your budget'
    : isGoal ? 'Set your savings goal' : isSavings ? 'Log savings' : 'Add an expense';
  expenseFields.hidden = !isExpense;
  descriptionInput.required = isExpense;
  amountInput.value = isBudget
    ? budgetData.monthlyBudget?.toFixed(2) ?? ''
    : isGoal ? budgetData.savingsGoal?.toFixed(2) ?? '' : '';
  descriptionInput.value = '';
  document.querySelector('#inputError').textContent = '';
  inputDialog.showModal();
  (isExpense ? descriptionInput : amountInput).focus();
}

function showSummary() {
  const totalSpent = getTotalSpent();
  const budget = budgetData.monthlyBudget;
  let message;
  if (budget === null) {
    message = 'Set a monthly budget to see your remaining balance.';
  } else {
    const remainingBalance = budget - totalSpent;
    if (remainingBalance < 0) {
      message = `You are ${formatCurrency(Math.abs(remainingBalance))} over budget. Review your recent expenses.`;
    } else if (remainingBalance === 0) {
      message = 'You have used your full monthly budget.';
    } else {
      message = `You have ${formatCurrency(remainingBalance)} remaining from your ${formatCurrency(budget)} budget.`;
    }
  }
  displayBudgetResults(message);
}

for (const category of categories) {
  categoryInput.add(new Option(category.label, category.id));
}

menuToggle.addEventListener('click', () => {
  setMobileMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
});
primaryMenu.addEventListener('click', (event) => {
  if (event.target.closest('.nav-link')) {
    setMobileMenuOpen(false);
  }
});
window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
  if (event.matches) {
    setMobileMenuOpen(false);
  }
});

document.querySelector('#budgetButton').addEventListener('click', () => openInputDialog('budget'));
document.querySelector('#expenseButton').addEventListener('click', () => openInputDialog('expense'));
document.querySelector('#goalButton').addEventListener('click', () => openInputDialog('goal'));
document.querySelector('#addSavingsButton').addEventListener('click', () => openInputDialog('savings'));
document.querySelector('#summaryButton').addEventListener('click', showSummary);
document.querySelector('#activityButton').addEventListener('click', showSummary);
document.querySelector('#notifyButton').addEventListener('click', () => {
  const message = budgetData.monthlyBudget !== null && getTotalSpent() > budgetData.monthlyBudget
    ? 'Your expenses are above this month’s budget.'
    : 'No new spending alerts.';
  statusMessage.textContent = message;
});
document.querySelector('#cancelInput').addEventListener('click', () => inputDialog.close());
inputForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = Number(amountInput.value);
  const error = document.querySelector('#inputError');

  if (!Number.isFinite(value) || value <= 0) {
    error.textContent = 'Enter an amount greater than zero.';
    return;
  }

  let message;
  if (inputMode === 'budget') {
    budgetData.monthlyBudget = value;
    message = `Monthly budget updated to ${formatCurrency(value)}.`;
  } else if (inputMode === 'goal') {
    budgetData.savingsGoal = value;
    message = `Savings goal updated to ${formatCurrency(value)}.`;
  } else if (inputMode === 'savings') {
    budgetData.savingsContributions.push({
      amount: value,
      date: new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short' }).format(new Date())
    });
    message = `${formatCurrency(value)} added to your savings.`;
  } else {
    const description = descriptionInput.value.trim();
    const category = categories.find((item) => item.id === categoryInput.value);
    if (!description || !category) {
      error.textContent = !description
        ? 'Enter a description for this expense.'
        : 'Choose a valid expense category.';
      return;
    }
    budgetData.expenses.push({
      description,
      amount: value,
      category: category.id,
      date: new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short' }).format(new Date())
    });
    message = `${description} added to ${category.label}.`;
  }

  inputDialog.close();
  saveData(message);
});

displayBudgetResults('Add your budget, expenses, and savings goal to get started.');
