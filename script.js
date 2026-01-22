// ==========================
// ELEMENTOS
// ==========================
const micBtn = document.getElementById("mic-btn");
const stopBtn = document.getElementById("stop-btn");
const status = document.getElementById("status");
const output = document.getElementById("output");

// ==========================
// CONTROLE DE ESCUTA
// ==========================
let ouvindo = false;

// ==========================
// VOZ
// ==========================
function falar(texto) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "pt-BR";
  u.rate = 0.95;
  u.pitch = 1;
  u.volume = 1;

  const voices = speechSynthesis.getVoices();
  const br = voices.find(v => v.lang === "pt-BR");
  if (br) u.voice = br;

  speechSynthesis.speak(u);
}

stopBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
  status.innerText = "Orion em silêncio. Presente, mas quieto.";
});

// ==========================
// ESTADO DO ORION (MEMÓRIA)
// ==========================
const estadoKey = "orion_estado";

function estadoInicial() {
  return {
    fase: 1,
    historico: [],
    problemaCentral: null
  };
}

function carregarEstado() {
  const e = localStorage.getItem(estadoKey);
  return e ? JSON.parse(e) : estadoInicial();
}

function salvarEstado(e) {
  localStorage.setItem(estadoKey, JSON.stringify(e));
}

// ==========================
// UTILIDADES
// ==========================
function registrar(autor, texto) {
  output.innerHTML += `<strong>${autor}:</strong> ${texto}<br><br>`;
  output.scrollTop = output.scrollHeight;
}

function normalizar(t) {
  return t.toLowerCase();
}

// ==========================
// INTERPRETAÇÃO DO PROBLEMA
// ==========================
function detectarProblema(texto) {
  if (/dinheiro|financeiro|conta|grana/.test(texto)) return "financeiro";
  if (/trabalho|emprego|chefe|empresa/.test(texto)) return "trabalho";
  if (/relacionamento|amor|casamento|família/.test(texto)) return "relacionamento";
  if (/medo|ansioso|triste|cansado|perdido/.test(texto)) return "emocional";
  return "indefinido";
}

// ==========================
// MOTOR DE CONVERSA (ORION)
// ==========================
function responder(textoUsuario) {
  let estado = carregarEstado();
  estado.historico.push(textoUsuario);

  const texto = normalizar(textoUsuario);
  let resposta = "";

  // ======================
  // FASE 1 — ACOLHIMENTO
  // ======================
  if (estado.fase === 1) {
    resposta =
      "Estou aqui com você. Sem julgamento. " +
      "O que está ocupando sua mente neste momento?";

    estado.fase = 2;
  }

  // ======================
  // FASE 2 — ORGANIZAÇÃO
  // ======================
  else if (estado.fase === 2) {
    estado.problemaCentral = detectarProblema(texto);

    resposta =
      "Entendo. Pelo que você trouxe, isso parece tocar algo importante. " +
      "Se tivesse que resumir o peso disso em uma frase, qual seria?";

    estado.fase = 3;
  }

  // ======================
  // FASE 3 — CLAREZA
  // ======================
  else if (estado.fase === 3) {
    resposta =
      "Vamos clarear isso juntos. " +
      "O que, nessa situação, depende diretamente de você — e o que não depende?";

    estado.fase = 4;
  }

  // ======================
  // FASE 4 — POSSÍVEIS CAMINHOS
  // ======================
  else if (estado.fase === 4) {
    resposta =
      "Com base no que você disse, existem alguns caminhos possíveis. " +
      "Um envolve agir agora, mesmo com incerteza. " +
      "Outro envolve esperar e observar. " +
      "E um terceiro envolve mudar o foco. " +
      "Qual deles soa mais verdadeiro para você agora?";

    estado.fase = 5;
  }

  // ======================
  // FASE 5 — FECHAMENTO
  // ======================
  else {
    resposta =
      "Você não precisa resolver tudo hoje. " +
      "Mas agora você não está mais no escuro. " +
      "Quando quiser continuar, estarei aqui.";

    estado = estadoInicial();
  }

  salvarEstado(estado);
  return resposta;
}

// ==========================
// RECONHECIMENTO DE VOZ
// ==========================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  status.innerText = "Reconhecimento de voz não suportado.";
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.continuous = false;

  micBtn.addEventListener("click", () => {
    if (ouvindo) return;
    ouvindo = true;
    status.innerText = "Orion está ouvindo...";
    recognition.start();
  });

  recognition.onresult = (event) => {
    ouvindo = false;

    const texto = event.results[0][0].transcript;
    registrar("Você", texto);

    const resposta = responder(texto);
    registrar("Orion", resposta);

    falar(resposta);
    status.innerText = "Orion permanece com você.";
  };

  recognition.onerror = () => {
    ouvindo = false;
    status.innerText = "Não consegui ouvir. Quando quiser, tente novamente.";
  };

  recognition.onend = () => {
    ouvindo = false;
  };
}
