const legacyStorageKey = 'spendwise-personal-budget-v1';
const accountsStorageKey = 'spendwise-device-accounts-v1';
const keyDerivationIterations = 600000;
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
const authView = document.querySelector('#authView');
const appShell = document.querySelector('#appShell');
const authForm = document.querySelector('#authForm');
const authEmailInput = document.querySelector('#authEmail');
const authPasswordInput = document.querySelector('#authPassword');
const authPasswordConfirmInput = document.querySelector('#authPasswordConfirm');
const authConfirm = document.querySelector('#authConfirm');
const authMessage = document.querySelector('#authMessage');
const authSubmit = document.querySelector('#authSubmit');
const authModeToggle = document.querySelector('#authModeToggle');
let budgetData = structuredClone(emptyData);
let activeAccount = null;
let activeEncryptionKey = null;
let authMode = 'sign-up';
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

function encodeBytes(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBytes(encoded) {
  return Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
}

function createRandomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

async function deriveEncryptionKey(password, salt) {
  const passwordMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: keyDerivationIterations,
      hash: 'SHA-256'
    },
    passwordMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptBudgetData(data, key) {
  const iv = createRandomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data))
  );
  return {
    iv: encodeBytes(iv),
    ciphertext: encodeBytes(new Uint8Array(ciphertext))
  };
}

async function decryptBudgetData(account, key) {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBytes(account.iv) },
    key,
    decodeBytes(account.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function loadAccounts() {
  const storedAccounts = localStorage.getItem(accountsStorageKey);
  if (storedAccounts === null) {
    return [];
  }

  const accounts = JSON.parse(storedAccounts);
  if (!Array.isArray(accounts) || accounts.some((account) => (
    !account
    || typeof account.email !== 'string'
    || typeof account.salt !== 'string'
    || typeof account.iv !== 'string'
    || typeof account.ciphertext !== 'string'
    || typeof account.legacyMigrated !== 'boolean'
  ))) {
    throw new Error('Saved device accounts have an invalid format.');
  }
  return accounts;
}

function loadLegacyBudgetData() {
  const savedData = localStorage.getItem(legacyStorageKey);
  if (savedData === null) {
    return { data: structuredClone(emptyData), found: false };
  }

  const parsedData = JSON.parse(savedData);
  if (!validateSavedData(parsedData)) {
    throw new Error('The previous budget data could not be imported. It has been left unchanged.');
  }
  return { data: parsedData, found: true };
}

function removeLegacyBudgetData() {
  try {
    localStorage.removeItem(legacyStorageKey);
    return true;
  } catch (error) {
    console.error('Unable to remove the previous unencrypted budget copy.', error);
    return false;
  }
}

async function saveAccountData(data = budgetData, account = activeAccount, key = activeEncryptionKey) {
  if (!account || !key) {
    throw new Error('Sign in before saving budget data.');
  }

  const accounts = loadAccounts();
  const accountIndex = accounts.findIndex((savedAccount) => savedAccount.email === account.email);
  if (accountIndex === -1) {
    throw new Error('This device account is no longer available.');
  }

  const encrypted = await encryptBudgetData(data, key);
  accounts[accountIndex] = { ...account, ...encrypted };
  localStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
  activeAccount = accounts[accountIndex];
}

function showAuthView(message = '') {
  authView.hidden = false;
  appShell.hidden = true;
  authMessage.textContent = message;
  authEmailInput.value = '';
  authPasswordInput.value = '';
  authPasswordConfirmInput.value = '';
  authEmailInput.focus();
}

function showAppView(email, message = `Signed in as ${email}. Your budget is saved on this device.`) {
  authView.hidden = true;
  appShell.hidden = false;
  authEmailInput.value = '';
  authPasswordInput.value = '';
  authPasswordConfirmInput.value = '';
  document.querySelector('#headerAccountEmail').textContent = email;
  document.querySelector('#sidebarAccountEmail').textContent = email;
  displayBudgetResults(message);
}

function mergeBudgetData(accountData, localData) {
  return {
    monthlyBudget: accountData.monthlyBudget ?? localData.monthlyBudget,
    savingsGoal: accountData.savingsGoal ?? localData.savingsGoal,
    savingsContributions: [...localData.savingsContributions, ...accountData.savingsContributions],
    expenses: [...localData.expenses, ...accountData.expenses]
  };
}

async function migrateLegacyData(account, key, accountData) {
  if (account.legacyMigrated) {
    return { account, data: accountData, migrated: false };
  }

  const legacyData = loadLegacyBudgetData();
  const data = legacyData.found
    ? mergeBudgetData(accountData, legacyData.data)
    : accountData;
  const updatedAccount = { ...account, legacyMigrated: true };
  const encrypted = await encryptBudgetData(data, key);
  updatedAccount.iv = encrypted.iv;
  updatedAccount.ciphertext = encrypted.ciphertext;

  const accounts = loadAccounts();
  const accountIndex = accounts.findIndex((savedAccount) => savedAccount.email === account.email);
  if (accountIndex === -1) {
    throw new Error('This device account is no longer available.');
  }
  accounts[accountIndex] = updatedAccount;
  localStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
  const legacyCopyRemoved = !legacyData.found || removeLegacyBudgetData();
  return {
    account: updatedAccount,
    data,
    migrated: legacyData.found,
    legacyCopyRemoved
  };
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  authMessage.textContent = '';

  if (!crypto.subtle || !crypto.getRandomValues) {
    authMessage.textContent = 'Secure device accounts require a modern browser and a secure connection (HTTPS).';
    return;
  }

  const email = authEmailInput.value.trim().toLowerCase();
  const password = authPasswordInput.value;
  const passwordConfirm = authPasswordConfirmInput.value;
  authSubmit.disabled = true;
  authSubmit.textContent = authMode === 'sign-up' ? 'Creating account...' : 'Signing in...';

  try {
    const accounts = loadAccounts();
    if (authMode === 'sign-up') {
      if (password.length < 8) {
        throw new Error('Choose a password with at least 8 characters.');
      }
      if (password !== passwordConfirm) {
        throw new Error('The passwords do not match.');
      }
      if (accounts.some((account) => account.email === email)) {
        throw new Error('An account with this email already exists on this device. Sign in instead.');
      }

      const { data, found } = loadLegacyBudgetData();
      const salt = createRandomBytes(16);
      const key = await deriveEncryptionKey(password, salt);
      const encrypted = await encryptBudgetData(data, key);
      const account = {
        email,
        salt: encodeBytes(salt),
        ...encrypted,
        legacyMigrated: true
      };
      localStorage.setItem(accountsStorageKey, JSON.stringify([...accounts, account]));
      const legacyCopyRemoved = !found || removeLegacyBudgetData();
      activeAccount = account;
      activeEncryptionKey = key;
      budgetData = data;
      showAppView(email);
      if (found) {
        statusMessage.textContent = legacyCopyRemoved
          ? `Account created for ${email}. Your existing browser budget was moved into this account.`
          : `Account created for ${email} and your budget was encrypted, but the old browser copy could not be removed.`;
      }
    } else {
      const account = accounts.find((savedAccount) => savedAccount.email === email);
      if (!account) {
        throw new Error('No account for this email was found on this device.');
      }

      const key = await deriveEncryptionKey(password, decodeBytes(account.salt));
      const data = await decryptBudgetData(account, key);
      if (!validateSavedData(data)) {
        throw new Error('Saved account data is invalid and could not be opened.');
      }

      const migrated = await migrateLegacyData(account, key, data);
      activeAccount = migrated.account;
      activeEncryptionKey = key;
      budgetData = migrated.data;
      showAppView(email, migrated.migrated && migrated.legacyCopyRemoved
        ? `Signed in as ${email}. Your existing browser budget was moved into this account.`
        : migrated.migrated
          ? `Signed in as ${email}, but the old browser copy could not be removed.`
          : `Signed in as ${email}. Your budget is saved on this device.`);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'OperationError') {
      authMessage.textContent = 'Email or password is incorrect.';
    } else {
      console.error('Unable to open the SpendWise device account.', error);
      authMessage.textContent = error.message || 'The account could not be opened. Check available browser storage and try again.';
    }
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = authMode === 'sign-up' ? 'Create account' : 'Sign in';
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignUp = mode === 'sign-up';
  document.querySelector('#authTitle').textContent = isSignUp ? 'Your budget, your account' : 'Welcome back';
  document.querySelector('.auth-intro').textContent = isSignUp
    ? 'Create an account to keep your budget separate in this browser.'
    : 'Sign in to unlock your budget on this device.';
  authConfirm.hidden = !isSignUp;
  authPasswordConfirmInput.required = isSignUp;
  authPasswordInput.autocomplete = isSignUp ? 'new-password' : 'current-password';
  authPasswordConfirmInput.autocomplete = 'new-password';
  authSubmit.textContent = isSignUp ? 'Create account' : 'Sign in';
  document.querySelector('#authSwitchPrompt').textContent = isSignUp
    ? 'Already have an account?'
    : 'New to SpendWise on this device?';
  authModeToggle.textContent = isSignUp ? 'Sign in' : 'Create account';
  authMessage.textContent = '';
}

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
  const savedData = structuredClone(budgetData);
  return saveAccountData(savedData).then(() => {
    displayBudgetResults(message);
    return true;
  }).catch((error) => {
    console.error('Unable to save SpendWise data in this browser.', error);
    statusMessage.textContent = `${message} Changes could not be saved in this browser.`;
    return false;
  });
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

authForm.addEventListener('submit', handleAuthSubmit);
authModeToggle.addEventListener('click', () => {
  setAuthMode(authMode === 'sign-up' ? 'sign-in' : 'sign-up');
});
document.querySelector('#signOutButton').addEventListener('click', () => {
  if (inputDialog.open) {
    inputDialog.close();
  }
  activeAccount = null;
  activeEncryptionKey = null;
  budgetData = structuredClone(emptyData);
  displayBudgetResults();
  statusMessage.textContent = '';
  setAuthMode('sign-in');
  showAuthView('You have signed out. Your encrypted budget remains on this device.');
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

try {
  const accounts = loadAccounts();
  setAuthMode(accounts.length > 0 ? 'sign-in' : 'sign-up');
  showAuthView();
} catch (error) {
  console.error('Unable to read SpendWise device accounts.', error);
  setAuthMode('sign-in');
  showAuthView('Saved account information could not be read. Do not clear browser data if you need to recover it.');
}
