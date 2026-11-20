const EXPENSE_CATS = [
  "🍜 Canteen & Food",
  "🛍️ Clothes & Lifestyle",
  "🚇 Metro & Taxi",
  "🏠 Dorm & Bills",
  "📚 Study & Books"
];
const INCOME_CATS = ["🎓 University Stipend", "👨‍👩‍👧 Parents Transfer", "💼 Grant / Part-time"];

const DEFAULT_LIMITS = {
  "🍜 Canteen & Food": 1000,
  "🛍️ Clothes & Lifestyle": 500,
  "🚇 Metro & Taxi": 200,
  "🏠 Dorm & Bills": 600,
  "📚 Study & Books": 200
};

let data = JSON.parse(localStorage.getItem("pocketYuanV5")) || {
  daysLeft: 30,
  rubRate: 0.075,
  usdRate: 7.15,
  theme: "light",
  seenWelcome: false,
  limits: { ...DEFAULT_LIMITS },
  lastAction: "idle",
  transactions: []
};

function persist() {
  localStorage.setItem("pocketYuanV5", JSON.stringify(data));
  render();
}

function applyTheme() {
  const isDark = data.theme === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  const btn = document.getElementById("themeToggleBtn");
  if (btn) btn.innerText = isDark ? "☀️ Light" : "🌙 Dark";
}

function toggleTheme() {
  data.theme = data.theme === "dark" ? "light" : "dark";
  applyTheme();
  persist();
}

function checkWelcome() {
  const overlay = document.getElementById("welcomeOverlay");
  if (!data.seenWelcome) {
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function closeWelcome() {
  data.seenWelcome = true;
  document.getElementById("welcomeOverlay").classList.add("hidden");
  persist();
}

function showWelcomeAgain() {
  document.getElementById("welcomeOverlay").classList.remove("hidden");
}

function setDragonMood(mood, jump = false) {
  const dragon = document.getElementById("dragonMascot");
  const moodText = document.getElementById("dragonMoodText");
  const sparkles = document.getElementById("dragonSparkles");

  dragon.className = "dragon " + mood;
  sparkles.classList.remove("show");

  if (mood === "happy") {
    moodText.innerText = "Yay! Budget looks great! ✨";
    if (jump) {
      void dragon.offsetWidth;
      dragon.classList.add("jumping");
      sparkles.classList.add("show");
    }
  } else if (mood === "sad") {
    moodText.innerText = "Aww, spending some yuan... 🥺";
  } else {
    moodText.innerText = "Ready to save some yuan! 🐉";
  }
}

function petDragon() {
  const dragon = document.getElementById("dragonMascot");
  const sparkles = document.getElementById("dragonSparkles");
  dragon.classList.remove("jumping");
  sparkles.classList.remove("show");
  void dragon.offsetWidth;
  dragon.classList.add("jumping");
  sparkles.classList.add("show");
}

function openModal(type, editTx = null) {
  document.getElementById("txType").value = type;
  document.getElementById("editId").value = editTx ? editTx.id : "";
  document.getElementById("modalTitle").innerText = editTx
    ? "Edit Entry"
    : (type === "expense" ? "Add Expense" : "Add Income");

  const catSelect = document.getElementById("txCategory");
  const cats = type === "expense" ? EXPENSE_CATS : INCOME_CATS;
  catSelect.innerHTML = cats.map(c => '<option value="' + c + '">' + c + '</option>').join("");

  if (editTx) {
    document.getElementById("txAmount").value = editTx.origAmount;
    document.getElementById("txCurrency").value = editTx.currency;
    catSelect.value = editTx.category;
    document.getElementById("txNote").value = editTx.note;
  } else {
    document.getElementById("txAmount").value = "";
    document.getElementById("txCurrency").value = "CNY";
    document.getElementById("txNote").value = "";
  }
  document.getElementById("txModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("txModal").classList.add("hidden");
}

function saveTransaction() {
  const type = document.getElementById("txType").value;
  const editId = document.getElementById("editId").value;
  const origAmount = parseFloat(document.getElementById("txAmount").value);
  const currency = document.getElementById("txCurrency").value;
  const category = document.getElementById("txCategory").value;
  const note = document.getElementById("txNote").value.trim();

  if (!origAmount || origAmount <= 0) return;

  let rate = 1;
  if (currency === "RUB") rate = data.rubRate;
  if (currency === "USD") rate = data.usdRate;
  const cnyAmount = Number((origAmount * rate).toFixed(2));

  let shouldJump = false;

  if (editId) {
    const idx = data.transactions.findIndex(t => t.id === Number(editId));
    if (idx !== -1) {
      const oldAmount = data.transactions[idx].cnyAmount;
      data.transactions[idx] = { ...data.transactions[idx], origAmount, currency, cnyAmount, category, note };
      if ((type === "expense" && cnyAmount < oldAmount) || (type === "income" && cnyAmount >= oldAmount)) {
        data.lastAction = "happy";
        shouldJump = true;
      } else {
        data.lastAction = "sad";
      }
    }
  } else {
    data.transactions.unshift({
      id: Date.now(),
      type,
      origAmount,
      currency,
      cnyAmount,
      category,
      note,
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    });
    data.lastAction = type === "income" ? "happy" : "sad";
    shouldJump = type === "income";
  }

  closeModal();
  persist();
  if (shouldJump) petDragon();
}

function editItem(id) {
  const tx = data.transactions.find(t => t.id === id);
  if (tx) openModal(tx.type, tx);
}

function deleteItem(id) {
  const tx = data.transactions.find(t => t.id === id);
  data.transactions = data.transactions.filter(t => t.id !== id);
  if (tx && tx.type === "expense") {
    data.lastAction = "happy";
  }
  persist();
  if (tx && tx.type === "expense") petDragon();
}

function openSettingsScreen() {
  document.getElementById("setDays").value = data.daysLeft;
  document.getElementById("setRubRate").value = data.rubRate;
  document.getElementById("setUsdRate").value = data.usdRate;

  const limitInputs = document.getElementById("limitInputs");
  limitInputs.innerHTML = EXPENSE_CATS.map((cat, idx) =>
    '<label>' + cat + '</label>' +
    '<input type="number" id="lim_' + idx + '" value="' + (data.limits[cat] !== undefined ? data.limits[cat] : 0) + '" placeholder="Monthly limit in CNY">'
  ).join("");

  document.getElementById("homeScreen").classList.add("hidden");
  document.getElementById("settingsScreen").classList.remove("hidden");
  window.scrollTo(0, 0);
}

function closeSettingsScreen() {
  document.getElementById("settingsScreen").classList.add("hidden");
  document.getElementById("homeScreen").classList.remove("hidden");
  window.scrollTo(0, 0);
}

function saveSettings() {
  data.daysLeft = Math.max(1, parseInt(document.getElementById("setDays").value) || 30);
  data.rubRate = parseFloat(document.getElementById("setRubRate").value) || 0.075;
  data.usdRate = parseFloat(document.getElementById("setUsdRate").value) || 7.15;

  EXPENSE_CATS.forEach((cat, idx) => {
    const val = parseFloat(document.getElementById("lim_" + idx).value);
    data.limits[cat] = val > 0 ? val : 0;
  });

  data.lastAction = "happy";
  closeSettingsScreen();
  persist();
}

function resetAll() {
  localStorage.removeItem("pocketYuanV5");
  location.reload();
}

function render() {
  applyTheme();
  const totalInc = data.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.cnyAmount, 0);
  const totalExp = data.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.cnyAmount, 0);
  const balance = totalInc - totalExp;
  const safeDaily = Math.max(0, balance / data.daysLeft);

  document.getElementById("balanceDisplay").innerText = balance.toFixed(2) + " ¥";
  document.getElementById("daysBadge").innerText = data.daysLeft + " days left";
  document.getElementById("dailyLimitDisplay").innerText = safeDaily.toFixed(1) + " ¥ / day";
  document.getElementById("totalSpentDisplay").innerText = totalExp.toFixed(1) + " ¥";

  const pct = totalInc > 0 ? Math.max(0, Math.min(100, (balance / totalInc) * 100)) : 0;
  document.getElementById("progressBar").style.width = pct + "%";

  const spentByCat = {};
  EXPENSE_CATS.forEach(c => spentByCat[c] = 0);
  data.transactions.filter(t => t.type === "expense").forEach(t => {
    spentByCat[t.category] = (spentByCat[t.category] || 0) + t.cnyAmount;
  });

  const exceededCats = [];
  const limitsBox = document.getElementById("categoryLimitsBox");
  limitsBox.innerHTML = EXPENSE_CATS.map(cat => {
    const spent = spentByCat[cat] || 0;
    const limit = data.limits[cat] || 0;
    const ratio = limit > 0 ? (spent / limit) * 100 : 0;
    if (limit > 0 && spent > limit) exceededCats.push(cat);

    let barClass = "fill-ok";
    if (ratio > 100) barClass = "fill-over";
    else if (ratio >= 80) barClass = "fill-warn";

    const width = limit > 0 ? Math.min(100, ratio) : (spent > 0 ? 100 : 0);
    const limitLabel = limit > 0 ? "/ " + limit + " ¥" : "(no limit)";

    return '<div class="cat-card">' +
      '<div class="cat-top">' +
        '<span>' + cat + '</span>' +
        '<span>' + spent.toFixed(0) + ' ¥ <span class="muted-text">' + limitLabel + '</span></span>' +
      '</div>' +
      '<div class="cat-bar-bg">' +
        '<div class="cat-bar-fill ' + barClass + '" style="width: ' + width + '%"></div>' +
      '</div>' +
    '</div>';
  }).join("");

  const insight = document.getElementById("aiInsight");
  if (totalInc === 0 && totalExp === 0) {
    insight.className = "insight-card mint";
    insight.innerText = "✨ Add your stipend or parents' transfer (RUB/USD auto-converts to CNY).";
    setDragonMood("idle");
  } else if (balance < 0) {
    insight.className = "insight-card peach";
    insight.innerText = "🚨 Total balance is negative! Adjust your limits or add extra support.";
    setDragonMood("sad");
  } else if (exceededCats.length > 0) {
    insight.className = "insight-card peach";
    insight.innerText = "⚠️ Monthly limit exceeded in: " + exceededCats.join(", ") + ". Keep other categories on track!";
setDragonMood("sad");
} else {
insight.className = "insight-card mint";
insight.innerText = "✅ All category budgets are within your monthly limits. Even big one-time purchases are under control!";
setDragonMood(data.lastAction || "happy");
}
  const feed = document.getElementById("activityFeed");
  if (data.transactions.length === 0) {
    feed.innerHTML = '<p class="muted-text" style="text-align:center; padding: 16px 0;">No transactions yet</p>';
    return;
  }

  feed.innerHTML = data.transactions.map(t => {
    const sign = t.type === "income" ? "+" : "−";
    const cls = t.type === "income" ? "inc" : "exp";
    const convText = t.currency !== "CNY" ? " (" + t.origAmount + " " + t.currency + ")" : "";
    return '<div class="tx-card">' +
      '<div class="tx-info">' +
        '<span class="tx-title">' + (t.note || t.category) + '</span>' +
        '<span class="tx-sub">' + t.category + ' • ' + t.date + convText + '</span>' +
      '</div>' +
      '<div class="tx-right">' +
        '<span class="tx-amount ' + cls + '">' + sign + t.cnyAmount.toFixed(1) + ' ¥</span>' +
        '<button class="mini-btn" onclick="editItem(' + t.id + ')">✏️</button>' +
        '<button class="mini-btn" onclick="deleteItem(' + t.id + ')">🗑️</button>' +
      '</div>' +
    '</div>';
  }).join("");
}

checkWelcome();
render();
