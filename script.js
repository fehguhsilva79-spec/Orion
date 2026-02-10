const micButton = document.getElementById("micButton");
const clockEl = document.getElementById("clock");
const listSoon = document.getElementById("listSoon");
const listLater = document.getElementById("listLater");

const confirmModal = document.getElementById("confirmModal");
const confirmTextEl = document.getElementById("confirmText");
const confirmDateEl = document.getElementById("confirmDate");
const cancelBtn = document.getElementById("cancelBtn");
const confirmBtn = document.getElementById("confirmBtn");

const detailModal = document.getElementById("detailModal");
const detailTextEl = document.getElementById("detailText");
const detailDateEl = document.getElementById("detailDate");
const closeDetailBtn = document.getElementById("closeDetailBtn");

let selectedNotifyBefore = 60; // padrão 1h
let pendingReminder = null;
let selectedReminderIndex = null;

// ===== Relógio =====
function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// ===== Storage =====
let reminders = JSON.parse(localStorage.getItem("reminders") || "[]");

// ===== Renderizar lista =====
function renderLists() {
  listSoon.innerHTML = "";
  listLater.innerHTML = "";

  const now = new Date();

  const sorted = reminders
    .filter(r => !r.done)
    .sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime));

  sorted.forEach((r, index) => {
    const item = document.createElement("div");
    item.className = "reminder-item";
    item.innerHTML = `
      <div>${r.text}</div>
      <small>${new Date(r.dateTime).toLocaleString()}</small>
    `;

    item.onclick = () => openDetail(index);

    const diff = new Date(r.dateTime) - now;
    if (diff <= 6 * 60 * 60 * 1000) {
      listSoon.appendChild(item);
    } else {
      listLater.appendChild(item);
    }
  });
}

renderLists();

// ===== Checar notificações =====
setInterval(() => {
  const now = new Date();

  reminders.forEach((r) => {
    if (!r.notified) {
      const notifyTime = new Date(r.dateTime).getTime() - r.notifyBefore * 60000;
      if (now.getTime() >= notifyTime) {
        r.notified = true;
        alert("⏰ Lembrete: " + r.text);
      }
    }
  });

  localStorage.setItem("reminders", JSON.stringify(reminders));
}, 1000);

// ===== Voz =====
let recognition;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    parseCommand(transcript);
  };
}

micButton.onclick = () => {
  if (recognition) recognition.start();
};

// ===== Parse comando =====
function parseCommand(text) {
  const lower = text.toLowerCase();
  const timeMatch = lower.match(/(\d{1,2}):(\d{2})/);

  if (!timeMatch) {
    alert("Diga um horário como 14:57 ou 11:09");
    return;
  }

  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);

  const now = new Date();
  let date = new Date(now);

  if (lower.includes("amanhã")) date.setDate(now.getDate() + 1);
  else if (lower.includes("depois de amanhã")) date.setDate(now.getDate() + 2);

  date.setHours(hour, minute, 0, 0);
  if (date < now) date.setDate(date.getDate() + 1);

  const cleanText = text.replace(timeMatch[0], "").trim();

  pendingReminder = {
    text: cleanText || "Compromisso",
    dateTime: date.toISOString(),
    notifyBefore: 60,
    notified: false,
    done: false
  };

  openConfirmModal();
}

// ===== Modal confirmação =====
function openConfirmModal() {
  confirmTextEl.textContent = pendingReminder.text;
  confirmDateEl.textContent = new Date(pendingReminder.dateTime).toLocaleString();
  confirmModal.classList.remove("hidden");
}

document.querySelectorAll(".notify-options button").forEach(btn => {
  btn.onclick = () => {
    const min = parseInt(btn.getAttribute("data-min") || btn.getAttribute("data-add"));
    if (!isNaN(min)) selectedNotifyBefore = min;
  };
});

cancelBtn.onclick = () => {
  pendingReminder = null;
  confirmModal.classList.add("hidden");
};

confirmBtn.onclick = () => {
  pendingReminder.notifyBefore = selectedNotifyBefore;
  reminders.push(pendingReminder);
  localStorage.setItem("reminders", JSON.stringify(reminders));
  pendingReminder = null;
  confirmModal.classList.add("hidden");
  renderLists();
};

// ===== Detalhes =====
function openDetail(index) {
  selectedReminderIndex = index;
  const r = reminders[index];
  detailTextEl.textContent = r.text;
  detailDateEl.textContent = new Date(r.dateTime).toLocaleString();
  detailModal.classList.remove("hidden");
}

document.querySelectorAll("#detailModal .notify-options button").forEach(btn => {
  btn.onclick = () => {
    const addMin = parseInt(btn.getAttribute("data-add"));
    const r = reminders[selectedReminderIndex];
    const d = new Date(r.dateTime);
    d.setMinutes(d.getMinutes() + addMin);
    r.dateTime = d.toISOString();
    r.notified = false;
    localStorage.setItem("reminders", JSON.stringify(reminders));
    renderLists();
    detailModal.classList.add("hidden");
  };
});

closeDetailBtn.onclick = () => {
  detailModal.classList.add("hidden");
};
