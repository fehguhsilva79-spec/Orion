// ================== HELPERS ==================
function $(id) {
  const el = document.getElementById(id);
  if (!el) console.warn("Elemento não encontrado:", id);
  return el;
}

// ================== TELAS ==================
const loginScreen = $("loginScreen");
const registerScreen = $("registerScreen");
const appScreen = $("appScreen");

// Login
const loginEmail = $("loginEmail");
const loginPassword = $("loginPassword");
const loginBtn = $("loginBtn");
const goToRegister = $("goToRegister");

// Cadastro
const registerEmail = $("registerEmail");
const registerPassword = $("registerPassword");
const registerPasswordConfirm = $("registerPasswordConfirm");
const registerBtn = $("registerBtn");
const goToLogin = $("goToLogin");

// Menu
const menuBtn = $("menuBtn");
const sideMenu = $("sideMenu");
const logoutBtn = $("logoutBtn");

// App
const micBtn = $("micBtn");
const statusEl = $("status");
const confirmArea = $("confirmArea");
const reminderList = $("reminderList");

// ================== UTIL AUTH ==================
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("eron_users") || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem("eron_users", JSON.stringify(users));
}

function setCurrentUser(email) {
  localStorage.setItem("eron_current_user", email);
}

function getCurrentUser() {
  return localStorage.getItem("eron_current_user");
}

function logout() {
  localStorage.removeItem("eron_current_user");
  showLoginScreen();
}

// ================== TROCA DE TELAS ==================
function showLoginScreen() {
  if (!loginScreen || !registerScreen || !appScreen) return;

  loginScreen.classList.remove("hidden");
  registerScreen.classList.add("hidden");
  appScreen.classList.add("hidden");

  // Garante que o menu esteja fechado
  if (sideMenu) sideMenu.classList.add("hidden");
}

function showRegisterScreen() {
  if (!loginScreen || !registerScreen || !appScreen) return;

  loginScreen.classList.add("hidden");
  registerScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");

  if (sideMenu) sideMenu.classList.add("hidden");
}

function showAppScreen() {
  if (!loginScreen || !registerScreen || !appScreen) return;

  loginScreen.classList.add("hidden");
  registerScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  // Sempre começa com menu fechado
  if (sideMenu) sideMenu.classList.add("hidden");
}

// ================== MOSTRAR / OCULTAR SENHA ==================
window.togglePassword = function (id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
};

// ================== EVENTOS AUTH ==================
if (goToRegister) {
  goToRegister.onclick = (e) => {
    e.preventDefault();
    showRegisterScreen();
  };
}

if (goToLogin) {
  goToLogin.onclick = (e) => {
    e.preventDefault();
    showLoginScreen();
  };
}

if (loginBtn) {
  loginBtn.onclick = () => {
    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    if (!email || !password) {
      alert("Preencha email e senha.");
      return;
    }

    const users = getUsers();

    if (!users[email]) {
      alert("Conta não encontrada. Crie uma conta.");
      return;
    }

    if (users[email].password !== password) {
      alert("Senha incorreta.");
      return;
    }

    setCurrentUser(email);
    initApp();
  };
}

if (registerBtn) {
  registerBtn.onclick = () => {
    const email = registerEmail.value.trim().toLowerCase();
    const password = registerPassword.value;
    const confirm = registerPasswordConfirm.value;

    if (!email || !password || !confirm) {
      alert("Preencha todos os campos.");
      return;
    }

    if (password !== confirm) {
      alert("As senhas não coincidem.");
      return;
    }

    const users = getUsers();

    if (users[email]) {
      alert("Este email já está cadastrado.");
      return;
    }

    users[email] = { password };
    saveUsers(users);

    alert("Conta criada com sucesso! Faça login.");
    showLoginScreen();
  };
}

// ================== MENU ==================
if (menuBtn && sideMenu) {
  menuBtn.onclick = () => {
    sideMenu.classList.toggle("hidden");
  };
}

if (logoutBtn) {
  logoutBtn.onclick = () => {
    logout();
  };
}

// ================== DADOS DE LEMBRETES ==================
let reminders = [];

function loadReminders() {
  const user = getCurrentUser();
  if (!user) return;
  try {
    reminders = JSON.parse(localStorage.getItem("eron_reminders_" + user) || "[]");
  } catch {
    reminders = [];
  }
  renderList();
}

function saveAndRender() {
  const user = getCurrentUser();
  if (!user) return;
  reminders.sort((a, b) => a.time - b.time);
  localStorage.setItem("eron_reminders_" + user, JSON.stringify(reminders));
  renderList();
}

// ================== NOTIFICAÇÕES ==================
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

function sendNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

// ================== SPEECH ==================
let recognition = null;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;
} else if (statusEl) {
  statusEl.textContent = "Reconhecimento de voz não suportado.";
}

if (micBtn) {
  micBtn.onclick = () => {
    if (!recognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }
    statusEl.textContent = "Ouvindo...";
    try {
      recognition.start();
    } catch (e) {}
  };
}

if (recognition) {
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    if (statusEl) statusEl.textContent = "Reconhecido";
    handleSpokenText(text);
  };

  recognition.onerror = () => {
    if (statusEl) statusEl.textContent = "Erro ao reconhecer voz.";
  };
}

// ================== PARSE DATA/HORA ==================
function parseDateTime(text) {
  let t = text.toLowerCase();
  let date = new Date();

  if (t.includes("depois de amanhã")) {
    date.setDate(date.getDate() + 2);
  } else if (t.includes("amanhã")) {
    date.setDate(date.getDate() + 1);
  }

  let hour = null;
  let minute = null;

  if (t.includes("meio dia") || t.includes("meiodia")) {
    hour = 12; minute = 0;
  } else if (t.includes("meia noite") || t.includes("meianoite")) {
    hour = 0; minute = 0;
  } else {
    const match = t.match(/(\d{1,2})\s*[:h]\s*(\d{2})/);
    if (match) {
      hour = parseInt(match[1], 10);
      minute = parseInt(match[2], 10);
    }
  }

  if (hour === null || minute === null) return null;

  date.setHours(hour, minute, 0, 0);

  const now = new Date();
  if (!t.includes("amanhã") && !t.includes("depois de amanhã") && date.getTime() < now.getTime()) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

// ================== FLUXO ==================
function handleSpokenText(text) {
  if (!text || text.trim().length === 0) {
    alert("Não consegui entender.");
    return;
  }

  const date = parseDateTime(text);

  if (!date) {
    alert("Diga um horário como: 19:47, 11:09, meio dia, amanhã 14:30...");
    return;
  }

  showConfirmation(text, date);
}

function showConfirmation(text, date) {
  if (!confirmArea) return;

  confirmArea.classList.remove("hidden");
  confirmArea.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <h3>Confirmar lembrete?</h3>
    <p><strong>Quando:</strong> ${date.toLocaleString("pt-BR")}</p>
    <p><strong>O que:</strong> ${text}</p>
    <div class="actions">
      <button class="btn-confirm">Confirmar</button>
      <button class="btn-delete">Excluir</button>
    </div>
  `;

  confirmArea.appendChild(card);

  card.querySelector(".btn-confirm").onclick = () => {
    addReminder(text, date, null);
    confirmArea.classList.add("hidden");
  };

  card.querySelector(".btn-delete").onclick = () => {
    confirmArea.classList.add("hidden");
  };
}

// ================== LEMBRETES ==================
function addReminder(text, date, notifyBeforeMinutes) {
  const reminder = {
    id: Date.now(),
    text,
    time: date.getTime(),
    notifyBeforeMinutes,
    notified: false
  };

  reminders.push(reminder);
  saveAndRender();
}

function renderList() {
  if (!reminderList) return;

  reminderList.innerHTML = "";

  reminders.forEach(rem => {
    const card = document.createElement("div");
    card.className = "card";
    const date = new Date(rem.time);

    card.innerHTML = `
      <h3>${date.toLocaleString("pt-BR")}</h3>
      <p>${rem.text}</p>
      <div class="actions">
        <button class="btn-delete">Excluir</button>
      </div>
    `;

    card.querySelector(".btn-delete").onclick = () => {
      reminders = reminders.filter(r => r.id !== rem.id);
      saveAndRender();
    };

    reminderList.appendChild(card);
  });
}

// ================== CHECK ==================
function checkReminders() {
  const now = Date.now();

  reminders.forEach(rem => {
    let triggerTime = rem.time;
    if (rem.notifyBeforeMinutes) {
      triggerTime = rem.time - rem.notifyBeforeMinutes * 60 * 1000;
    }

    if (!rem.notified && now >= triggerTime) {
      rem.notified = true;
      sendNotification("⏰ Eron", rem.text);
      saveAndRender();
    }
  });
}

setInterval(checkReminders, 1000);

// ================== INIT ==================
function initApp() {
  showAppScreen();
  loadReminders();
}

const user = getCurrentUser();
if (user) {
  initApp();
} else {
  showLoginScreen();
}
