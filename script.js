
const form = document.getElementById("transactionForm");
const list = document.getElementById("transactionList");

const STORAGE_KEY = "spendwiseTransactions";

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000)
    .toISOString().slice(0, 10);
}

function createSampleTransactions() {
  const today = localDate();

  return [
    {
      id: "sample-1",
      description: "Monthly Income",
      amount: 5000,
      type: "income",
      category: "Salary",
      date: today
    },
    {
      id: "sample-2",
      description: "Food Shopping",
      amount: 254,
      type: "expense",
      category: "Food",
      date: today
    },
    {
      id: "sample-3",
      description: "Transport",
      amount: 795,
      type: "expense",
      category: "Transport",
      date: today
    },
    {
      id: "sample-4",
      description: "Shopping",
      amount: 756,
      type: "expense",
      category: "Shopping",
      date: today
    }
  ];
}

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      const samples = createSampleTransactions();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
      return samples;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(t =>
      t &&
      typeof t.id === "string" &&
      typeof t.description === "string" &&
      Number.isFinite(t.amount) &&
      t.amount > 0 &&
      ["income", "expense"].includes(t.type) &&
      typeof t.category === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(t.date)
    );

  } catch (error) {
    console.error("Unable to load transactions:", error);
    return [];
  }
}

let transactions = loadTransactions();
let financeChart = null;

function money(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2
  }).format(amount);
}

document.getElementById("today").textContent =
  new Date().toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

document.getElementById("date").value = localDate();

function saveTransactions() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(transactions)
    );
    return true;
  } catch (error) {
    alert("Unable to save transactions in your browser.");
    console.error(error);
    return false;
  }
}

function updateDashboard() {

  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  document.getElementById("balance").textContent =
    money(balance);

  document.getElementById("income").textContent =
    money(income);

  document.getElementById("expenses").textContent =
    money(expenses);

  document.getElementById("transactionCount").textContent =
    `${transactions.length} transactions`;

  document.getElementById("emptyMessage").style.display =
    transactions.length === 0 ? "block" : "none";

  renderTransactions();
  renderChart(income, expenses);
}

function renderTransactions() {

  list.replaceChildren();

  const sorted = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  sorted.forEach(t => {

    const row = document.createElement("tr");

    const description = document.createElement("td");
    description.textContent = t.description;

    const category = document.createElement("td");
    category.textContent = t.category;

    const date = document.createElement("td");
    date.textContent = t.date;

    const amount = document.createElement("td");

    amount.textContent =
      `${t.type === "income" ? "+" : "-"}${money(t.amount)}`;

    amount.className =
      t.type === "income" ? "income-text" : "expense-text";

    const action = document.createElement("td");

    const deleteButton = document.createElement("button");

    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";

    deleteButton.addEventListener("click", () => {

      if (!confirm("Are you sure you want to delete this transaction?")) {
        return;
      }

      transactions = transactions.filter(item => item.id !== t.id);

      if (saveTransactions()) {
        updateDashboard();
      }
    });

    action.appendChild(deleteButton);

    row.append(
      description,
      category,
      date,
      amount,
      action
    );

    list.appendChild(row);
  });
}

function renderChart(income, expenses) {

  const canvas = document.getElementById("financeChart");

  if (typeof Chart === "undefined") {
    console.error("Chart.js could not load.");
    return;
  }

  if (financeChart) {
    financeChart.destroy();
  }

  financeChart = new Chart(canvas, {
    type: "bar",

    data: {
      labels: ["Income", "Expenses"],

      datasets: [{
        label: "Amount (KES)",

        data: [income, expenses],

        backgroundColor: ["#16a34a", "#dc2626"],

        borderRadius: 8
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false
        }
      },

      scales: {
        y: {
          beginAtZero: true,

          ticks: {
            callback: value => "KES " + value
          }
        }
      }
    }
  });
}

form.addEventListener("submit", event => {

  event.preventDefault();

  const description =
    document.getElementById("description").value.trim();

  const amount =
    Number(document.getElementById("amount").value);

  const type =
    document.getElementById("type").value;

  const category =
    document.getElementById("category").value;

  const date =
    document.getElementById("date").value;

  if (
    !description ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !["income", "expense"].includes(type) ||
    !date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    alert("Please enter valid transaction details.");
    return;
  }

  const transaction = {
    id: crypto.randomUUID(),
    description,
    amount,
    type,
    category,
    date
  };

  transactions.push(transaction);

  if (saveTransactions()) {
    updateDashboard();
    form.reset();
    document.getElementById("date").value = localDate();
    alert("Transaction added successfully!");
  } else {
    transactions.pop();
  }
});

updateDashboard();
