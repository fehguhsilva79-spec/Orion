const micBtn = document.getElementById("micBtn");
const statusEl = document.getElementById("status");
const confirmArea = document.getElementById("confirmArea");
const reminderList = document.getElementById("reminderList");

let reminders = JSON.parse(localStorage.getItem("eron_reminders") || "[]");

// ===== SPEECH =====
let recognition;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;
} else {
  alert("Seu navegador não suporta reconhecimento de voz.");
}

micBtn.addEventListener("click", () => {
  if (!recognition) return;
  statusEl.textContent = "Ouvindo...";
  recognition.start();
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

// ===== PARSE DATA/HORA =====
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
    const match = t.match(/(\d{1,2})[:h](\d{2})/);
    if (match) {
      hour = parseInt(match[1], 10);
      minute = parseInt(match[2], 10);
    }
  }

  if (hour === null || minute === null) return null;

  date.setHours(hour, minute, 0, 0);

  const now = new Date();
  if (date.getTime() < now.getTime()) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

// ===== FLUXO =====
function handleSpokenText(text) {
  const date = parseDateTime(text);

  if (!date) {
    alert("Não consegui entender o horário. Diga algo como: 19:47, 11:09, meio dia...");
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

// ===== DADOS =====
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

function saveAndRender() {
  reminders.sort((a, b) => a.time - b.time);
  localStorage.setItem("eron_reminders", JSON.stringify(reminders));
  renderList();
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

// ===== NOTIFICAÇÃO =====
function checkReminders() {
  const now = Date.now();

  reminders.forEach(rem => {
    let triggerTime = rem.time;

    if (rem.notifyBeforeMinutes) {
      triggerTime = rem.time - rem.notifyBeforeMinutes * 60 * 1000;
    }

    if (!rem.notified && now >= triggerTime) {
      rem.notified = true;
      alert("⏰ Lembrete: " + rem.text);
      saveAndRender();
    }
  });
}

setInterval(checkReminders, 1000);
renderList();
