// Elementos da interface
const micBtn = document.getElementById("mic-btn");
const status = document.getElementById("status");
const output = document.getElementById("output");

// ==========================
// FUNÇÃO DE FALA (SAÍDA)
// ==========================
function falar(texto) {
  if (!("speechSynthesis" in window)) {
    alert("Seu navegador não suporta síntese de voz.");
    return;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();
  const vozBR = voices.find(v => v.lang === "pt-BR");
  if (vozBR) utterance.voice = vozBR;

  speechSynthesis.speak(utterance);
}

// ==========================
// FUNÇÃO DE ESCUTA (ENTRADA)
// ==========================
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  status.innerText = "Reconhecimento de voz não suportado neste navegador.";
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.continuous = false;

  micBtn.addEventListener("click", () => {
    status.innerText = "Orion está ouvindo...";
    recognition.start();
  });

  recognition.onresult = (event) => {
    const texto = event.results[0][0].transcript.toLowerCase();
    output.innerHTML = `<strong>Você:</strong> ${texto}`;

    const resposta = `Entendi. Você disse: "${texto}". Ainda estou despertando.`;
    output.innerHTML += `<br><br><strong>Orion:</strong> ${resposta}`;

    falar(resposta);
    status.innerText = "Clareza antes da decisão.";
  };

  recognition.onerror = (event) => {
    status.innerText = "Erro ao ouvir. Tente novamente.";
    console.error(event.error);
  };
}
