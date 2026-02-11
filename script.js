// ================== ELEMENTOS ==================
const micBtn = document.getElementById("micBtn");
const statusEl = document.getElementById("status");
const confirmArea = document.getElementById("confirmArea");
const reminderList = document.getElementById("reminderList");

// ================== AUTH LOCAL ==================
let currentUser = localStorage.getItem("eron_current_user");

function getUsers() {
  return JSON.parse(localStorage.getItem("eron_users") || "{}");
}

function saveUsers(users) {
  localStorage.setItem("eron_users", JSON.stringify(users));
}

function showLogin() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "#f5f2ee";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";
  overlay.innerHTML = `
    <h2 style="margin-bottom:10px;">Entrar no Eron</h2>
    <input id="loginUser" placeholder="Usuário" style="padding:10px;margin:5px;border-radius:8px;border:1px solid #ccc;">
    <input id="loginPass" type="password" placeholder="Senha" style="padding:10px;margin:5px;border-radius:8px;border:1px solid #ccc;">
    <button id="btnLogin" style="padding:10px 20px;margin-top:10px;border-radius:999px;border:none;background:#ede9e4;">Entrar / Cadastrar</button>
    <p style="font-size:12px;opacity:.7;margin-top:10px;">Se não existir, a conta será criada.</p>
  `;
  document.body.appendChild(overlay);

  document.getElementById("btnLogin").onclick = () => {
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value.trim();
    if (!u || !p) {
      alert("Preencha usuário e senha");
      return;
    }

    const users = getUsers();
    if (!users[u]) {
      users[u] = { password: p };
      saveUsers(users);
    } else {
      if (users[u].password !== p) {
        alert("Senha incorreta");
        return;
      }
    }

    localStorage.setItem("eron_current_user", u);
    currentUser = u;
    overlay.remove();
    loadReminders();
  };
}

if (!currentUser) {
  showLogin();
}

// ================== DADOS ==================
let reminders = [];

function loadReminders() {
  if (!currentUser) return;
  reminders = JSON.parse(localStorage.getItem("eron_reminders_" + currentUser) || "[]");
  renderList();
}

function saveAndRender() {
  reminders.sort((a, b) => a.time - b.time);
  localStorage.setItem("eron_reminders_" + currentUser, JSON.stringify(reminders));
  renderList();
}

// ================== NOTIFICAÇÕES ==================
if ("Notification" in window) {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
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
} else {
  statusEl.textContent = "Reconhecimento de voz não suportado.";
}

micBtn.addEventListener("click", () => {
  if (!recognition) {
    alert("Seu navegador não suporta reconhecimento de voz.");
    return;
  }
  statusEl.textContent = "Ouvindo...";
  try {
    recognition.start();
  } catch (e) {}
});

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
    <p style="margin-top:8px;">Lembrar-me:</p>
    <div class="actions">
      <button class="btn-delay" data-min="30">30 min antes</button>
      <button class="btn-delay" data-min="60">1 hora antes</button>
      <button class="btn-delay" data-min="1440">1 dia antes</button>
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

  card.querySelectorAll(".btn-delay").forEach(btn => {
    btn.onclick = () => {
      const min = parseInt(btn.dataset.min, 10);
      addReminder(text, date, min);
      confirmArea.classList.add("hidden");
    };
  });
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
  reminderList.innerHTML = "";

  reminders.forEach(rem => {
    const card = document.createElement("div");
    card.className = "card";
    const date = new Date(rem.time);

    card.innerHTML = `
      <h3>${date.toLocaleString("pt-BR")}</h3>
      <p>${rem.text}</p>
      <div class="actions">
        <button class="btn-view">Ver</button>
        <button class="btn-delay">Adiar 10 min</button>
        <button class="btn-delete">Excluir</button>
      </div>
    `;

    card.querySelector(".btn-delete").onclick = () => {
      reminders = reminders.filter(r => r.id !== rem.id);
      saveAndRender();
    };

    card.querySelector(".btn-delay").onclick = () => {
      rem.time += 10 * 60 * 1000;
      rem.notified = false;
      saveAndRender();
    };

    card.querySelector(".btn-view").onclick = () => {
      alert(rem.text);
    };

    reminderList.appendChild(card);
  });
}

// ================== CHECK TEMPO ==================
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
if (currentUser) {
  loadReminders();
}
