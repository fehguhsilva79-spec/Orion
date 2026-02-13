// ================== SUPABASE ==================
const SUPABASE_URL = "https://qftffjgdoicyswgdtpld.supabase.co";
const SUPABASE_KEY = "sb_publishable_dg5HKUTmMIhd2Glc8hVyaw_NEzRjFRo";

// Evita redeclarar o cliente se o script carregar mais de uma vez
let supabaseClient = window._supabaseClient;
if (!supabaseClient) {
  const { createClient } = window.supabase;
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  window._supabaseClient = supabaseClient;
}
const supabase = supabaseClient;

// ================== HELPERS ==================
function $(id) {
  return document.getElementById(id);
}

// ================== TELAS ==================
const loginScreen = $("loginScreen");
const registerScreen = $("registerScreen");
const appScreen = $("appScreen");

// Telas internas
const mainHome = $("mainHome");
const accountScreen = $("accountScreen");
const planScreen = $("planScreen");
const notificationsScreen = $("notificationsScreen");

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

// Botões do menu
const menuHome = $("menuHome");
const menuAccount = $("menuAccount");
const menuPlan = $("menuPlan");
const menuNotifications = $("menuNotifications");

// App
const micBtn = $("micBtn");
const statusEl = $("status");
const confirmArea = $("confirmArea");
const reminderList = $("reminderList");

// ================== AUTH ==================
async function logout() {
  await supabase.auth.signOut();
  showLoginScreen();
}

// ================== TROCA DE TELAS ==================
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
  showHome();
}

// ================== TELAS INTERNAS ==================
function hideAllInternal() {
  if (mainHome) mainHome.classList.add("hidden");
  if (accountScreen) accountScreen.classList.add("hidden");
  if (planScreen) planScreen.classList.add("hidden");
  if (notificationsScreen) notificationsScreen.classList.add("hidden");
}

function showHome() {
  hideAllInternal();
  if (mainHome) mainHome.classList.remove("hidden");
}

function showAccount() {
  hideAllInternal();
  if (accountScreen) accountScreen.classList.remove("hidden");
}

function showPlan() {
  hideAllInternal();
  if (planScreen) planScreen.classList.remove("hidden");
}

function showNotifications() {
  hideAllInternal();
  if (notificationsScreen) notificationsScreen.classList.remove("hidden");
}

// ================== MOSTRAR / OCULTAR SENHA ==================
window.togglePassword = function (id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
};

// ================== EVENTOS AUTH ==================
goToRegister.onclick = (e) => {
  e.preventDefault();
  showRegisterScreen();
};

goToLogin.onclick = (e) => {
  e.preventDefault();
  showLoginScreen();
};

loginBtn.onclick = async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    alert("Preencha email e senha.");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Erro ao entrar: " + error.message);
    return;
  }

  initApp();
};

registerBtn.onclick = async () => {
  const email = registerEmail.value.trim();
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

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert("Erro ao criar conta: " + error.message);
    return;
  }

  if (data.user) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      email: email,
      is_premium: false
    });
  }

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

menuHome.onclick = () => {
  showHome();
  sideMenu.classList.add("hidden");
};

menuAccount.onclick = () => {
  showAccount();
  sideMenu.classList.add("hidden");
};

menuPlan.onclick = () => {
  showPlan();
  sideMenu.classList.add("hidden");
};

menuNotifications.onclick = () => {
  showNotifications();
  sideMenu.classList.add("hidden");
};

// ================== LEMBRETES (SUPABASE) ==================
let reminders = [];

async function loadReminders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", user.id)
    .order("datetime", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  reminders = data.map(r => ({
    id: r.id,
    text: r.text,
    time: new Date(r.datetime).getTime(),
    notified: false
  }));

  renderList();
}

async function addReminder(text, date) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    text: text,
    datetime: date.toISOString()
  });

  if (error) {
    alert("Erro ao salvar lembrete");
    return;
  }

  loadReminders();
}

// ================== SPEECH ==================
let recognition = null;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;
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
    statusEl.textContent = "Reconhecido";
    handleSpokenText(text);
  };

  recognition.onerror = () => {
    statusEl.textContent = "Erro ao reconhecer voz.";
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

  let match = t.match(/(\d{1,2})\s*[:h]\s*(\d{2})/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  let minute = parseInt(match[2], 10);

  date.setHours(hour, minute, 0, 0);

  if (!t.includes("amanhã") && date.getTime() < Date.now()) {
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
    alert("Diga um horário como: 19:47, 11:09, amanhã 14:30...");
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
      <button class="btn-delete">Excluir</button>
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

// ================== LISTA ==================
function renderList() {
  reminderList.innerHTML = "";

  reminders.forEach(rem => {
    const card = document.createElement("div");
    card.className = "card";
    const date = new Date(rem.time);

    card.innerHTML = `
      <h3>${date.toLocaleString("pt-BR")}</h3>
      <p>${rem.text}</p>
    `;

    reminderList.appendChild(card);
  });
}

// ================== INIT ==================
async function initApp() {
  showAppScreen();
  loadReminders();
}

// Boot
(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    initApp();
  } else {
    showLoginScreen();
  }
})();
