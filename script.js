// ==========================
// ELEMENTOS DA INTERFACE
// ==========================
const micBtn = document.getElementById("mic-btn");
const stopBtn = document.getElementById("stop-btn");
const status = document.getElementById("status");
const output = document.getElementById("output");

// ==========================
// FUNÇÃO DE FALA
// ==========================
function falar(texto) {
  if (!("speechSynthesis" in window)) return;

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
// FUNÇÃO PARAR FALA
// ==========================
stopBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
  status.innerText = "Orion parou de falar.";
});

// ==========================
// MEMÓRIA LEVE (LOCAL)
// ==========================
const memoriaKey = "orion_memoria";

function carregarMemoria() {
  const dados = localStorage.getItem(memoriaKey);
  if (!dados) return {};
  return JSON.parse(dados);
}

function salvarMemoria(memoria) {
  localStorage.setItem(memoriaKey, JSON.stringify(memoria));
}

// ==========================
// RESPOSTAS BASE POR EMOÇÃO
// ==========================
const respostas = {
  tristeza: [
    "Percebo tristeza. O que fez esse sentimento aparecer hoje?",
    "Quando a tristeza insiste assim, ela deixa de ser um pedido de atenção.",
    "Você gostaria de refletir mais sobre isso?"
  ],
  ansiedade: [
    "A ansiedade pode sinalizar sobrecarga.",
    "Respire fundo e tente identificar a causa.",
    "Quer me contar o que está te tirando do eixo?"
  ],
  raiva: [
    "Sinto raiva em você. O que te deixou assim?",
    "Às vezes, expressar ajuda a clarear a mente.",
    "Como você quer lidar com isso agora?"
  ],
  medo: [
    "O medo aparece quando algo importa de verdade.",
    "Ele não significa fraqueza.",
    "Quer me contar do que está receoso?"
  ],
  cansaço: [
    "O cansaço constante é um sinal de que precisa de atenção.",
    "Talvez seja hora de desacelerar um pouco.",
    "O que mais te drena energia hoje?"
  ]
};

// ==========================
// DETECTAR ESTADO
// ==========================
function detectarEstado(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("triste")) return "tristeza";
  if (texto.includes("ansioso") || texto.includes("ansiedade")) return "ansiedade";
  if (texto.includes("raiva") || texto.includes("irritado")) return "raiva";
  if (texto.includes("medo") || texto.includes("inseguro")) return "medo";
  if (texto.includes("cansado") || texto.includes("esgotado")) return "cansaço";

  return "tristeza";
}

// ==========================
// GERAR RESPOSTA COM MEMÓRIA
// ==========================
function gerarResposta(textoUsuario) {
  const estado = detectarEstado(textoUsuario);
  const memoria = carregarMemoria();

  if (!memoria[estado]) memoria[estado] = 0;
  memoria[estado]++;
  salvarMemoria(memoria);

  const respostasEstado = respostas[estado];
  let resposta = respostasEstado[0];

  // Se já apareceu mais de uma vez, adiciona reflexão extra
  if (memoria[estado] >= 2) {
    resposta += ` ${respostasEstado[1]}`;
  }

  // Sempre finaliza com pergunta para manter fluxo
  resposta += ` ${respostasEstado[2]}`;

  return resposta;
}

// ==========================
// RECONHECIMENTO DE VOZ
// ==========================
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  status.innerText = "Reconhecimento de voz não suportado.";
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
    const texto = event.results[0][0].transcript;
    output.innerHTML += `<strong>Você:</strong> ${texto}<br>`;

    const resposta = gerarResposta(texto);
    output.innerHTML += `<strong>Orion:</strong> ${resposta}<br><br>`;

    falar(resposta);
    status.innerText = "Orion está refletindo com você.";
  };

  recognition.onerror = () => {
    status.innerText = "Erro ao ouvir. Tente novamente.";
  };
}
