const micButton = document.getElementById("micButton");
const clockEl = document.getElementById("clock");

let recognition;
let isRecording = false;

// ===== Relógio em tempo real =====
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  clockEl.textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ===== Notificações =====
if ("Notification" in window) {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}

// ===== Carregar compromissos =====
let reminders = JSON.parse(localStorage.getItem("reminders") || "[]");

// ===== Checar compromissos a cada segundo =====
setInterval(() => {
  const now = new Date();

  reminders.forEach((r) => {
    if (!r.triggered && now >= new Date(r.dateTime)) {
      r.triggered = true;

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⏰ Lembrete", {
          body: r.text,
        });
      } else {
        alert("⏰ Lembrete: " + r.text);
      }
    }
  });

  localStorage.setItem("reminders", JSON.stringify(reminders));
}, 1000);

// ===== Voz =====
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    processCommand(transcript);
  };

  recognition.onerror = function (event) {
    alert("Erro no reconhecimento de voz: " + event.error);
  };

  recognition.onend = function () {
    isRecording = false;
    micButton.innerText = "🎤 Falar agora";
  };
} else {
  alert("Seu navegador não suporta reconhecimento de voz.");
}

micButton.addEventListener("click", () => {
  if (!recognition) return;

  if (!isRecording) {
    recognition.start();
    isRecording = true;
    micButton.innerText = "⏺️ Ouvindo...";
  } else {
    recognition.stop();
    isRecording = false;
    micButton.innerText = "🎤 Falar agora";
  }
});

// ===== Processar comando =====
function processCommand(text) {
  const lower = text.toLowerCase();

  // Procurar horário no formato HH:MM
  const timeMatch = lower.match(/(\d{1,2}):(\d{2})/);

  if (!timeMatch) {
    alert("Não encontrei um horário. Diga algo como: 19:47 ou 11:09");
    return;
  }

  let hour = parseInt(timeMatch[1], 10);
  let minute = parseInt(timeMatch[2], 10);

  if (hour > 23 || minute > 59) {
    alert("Horário inválido.");
    return;
  }

  // Definir data
  const now = new Date();
  let targetDate = new Date(now);

  if (lower.includes("amanhã")) {
    targetDate.setDate(now.getDate() + 1);
  } else if (lower.includes("depois de amanhã")) {
    targetDate.setDate(now.getDate() + 2);
  } else {
    // Se não falar dia, assume hoje
    targetDate.setDate(now.getDate());
  }

  targetDate.setHours(hour);
  targetDate.setMinutes(minute);
  targetDate.setSeconds(0);
  targetDate.setMilliseconds(0);

  // Se o horário já passou hoje, joga para amanhã automaticamente
  if (targetDate < now) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  // Texto do lembrete (remove o horário da frase)
  const reminderText = text.replace(timeMatch[0], "").trim() || "Compromisso";

  const reminder = {
    text: reminderText,
    dateTime: targetDate.toISOString(),
    triggered: false,
  };

  reminders.push(reminder);
  localStorage.setItem("reminders", JSON.stringify(reminders));

  alert(
    "✅ Lembrete salvo para " +
      targetDate.toLocaleDateString() +
      " às " +
      String(hour).padStart(2, "0") +
      ":" +
      String(minute).padStart(2, "0")
  );
}
