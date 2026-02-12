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

// ================== STORAGE ==================
const USERS_KEY = "eron_users";
const CURRENT_USER_KEY = "eron_current_user";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setCurrentUser(email) {
  localStorage.setItem(CURRENT_USER_KEY, email);
}

function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  showLoginScreen();
}

// ================== TELAS ==================
function showLoginScreen() {
  loginScreen.classList.remove("hidden");
  registerScreen.classList.add("hidden");
  appScreen.classList.add("hidden");
  if (sideMenu) sideMenu.classList.add("hidden");
}

function showRegisterScreen() {
  loginScreen.classList.add("hidden");
  registerScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
  if (sideMenu) sideMenu.classList.add("hidden");
}

function showAppScreen() {
  loginScreen.classList.add("hidden");
  registerScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  if (sideMenu) sideMenu.classList.add("hidden");
}

// ================== MOSTRAR / OCULTAR SENHA ==================
window.togglePassword = function (id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
};

// ================== NAVEGAÇÃO AUTH ==================
goToRegister.onclick = (e) => {
  e.preventDefault();
  showRegisterScreen();
};

goToLogin.onclick = (e) => {
  e.preventDefault();
  showLoginScreen();
};

// ================== LOGIN ==================
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

// ================== CADASTRO ==================
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

// ================== MENU ==================
menuBtn.onclick = () => {
  sideMenu.classList.toggle("hidden");
};

logoutBtn.onclick = () => {
  logout();
};

// ================== LEMBRETES ==================
let reminders = [];

function loadReminders() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    reminders = JSON.parse(localStorage.getItem("eron_reminders_" + user)) || [];
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

micBtn.onclick = () => {
  if (!recognition) {
    alert("Seu navegador não suporta reconhecimento de voz.");
    return;
  }
  statusEl.textContent = "Ouvindo...";
  try {
    recognition.start();
  } catch {}
};

if (recognition) {
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    statusEl.textContent = "Reconhecido";
    handleSpokenText(text);
  };

  recognition.onerror = () => {
    statusEl.textContent = "Erro ao reconhecer voz.";
  };
}

// ================== DATA/HORA ==================
function parseDateTime(text) {
  let t = text.toLowerCase();
  let date = new Date();

  if (t.includes("depois de amanhã")) date.setDate(date.getDate() + 2);
  else if (t.includes("amanhã")) date.setDate(date.getDate() + 1);

  let hour = null;
  let minute = null;

  const match = t.match(/(\d{1,2})\s*[:h]\s*(\d{2})/);
  if (match) {
    hour = parseInt(match[1], 10);
    minute = parseInt(match[2], 10);
  }

  if (hour === null || minute === null) return null;

  date.setHours(hour, minute, 0, 0);

  if (date.getTime() < Date.now()) date.setDate(date.getDate() + 1);

  return date;
}

// ================== FLUXO ==================
function handleSpokenText(text) {
  const date = parseDateTime(text);

  if (!date) {
    alert("Diga um horário como: 14:30, 09:10...");
    return;
  }

  showConfirmation(text, date);
}

function showConfirmation(text, date) {
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
      <button class="btn-delete">Cancelar</button>
    </div>
  `;

  confirmArea.appendChild(card);

  card.querySelector(".btn-confirm").onclick = () => {
    addReminder(text, date);
    confirmArea.classList.add("hidden");
  };

  card.querySelector(".btn-delete").onclick = () => {
    confirmArea.classList.add("hidden");
  };
}

// ================== CRUD ==================
function addReminder(text, date) {
  reminders.push({
    id: Date.now(),
    text,
    time: date.getTime(),
    notified: false
  });

  saveAndRender();
}

function renderList() {
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
    if (!rem.notified && now >= rem.time) {
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

const current = getCurrentUser();
if (current) initApp();
else showLoginScreen();
