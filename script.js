// ==========================
// ELEMENTOS
// ==========================
const micBtn = document.getElementById("mic-btn");
const stopBtn = document.getElementById("stop-btn");
const status = document.getElementById("status");
const output = document.getElementById("output");

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
  status.innerText = "Silêncio mantido.";
});

// ==========================
// ESTADO GLOBAL DO ORION
// ==========================
const estadoKey = "orion_estado";

function estadoInicial() {
  return {
    fase: 1, // 1 acolhimento | 2 organização | 3 clareza | 4 saída | 5 fechamento
    historico: [],
    problemaCentral: null,
    clarezaAlcancada: false
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
// INTERPRETAÇÃO SIMPLES
// ==========================
function detectarProblema(texto) {
  if (/dinheiro|financeiro|conta|grana/.test(texto)) return "financeiro";
  if (/trabalho|emprego|chefe|empresa/.test(texto)) return "trabalho";
  if (/relacionamento|amor|casamento|família/.test(texto)) return "relacionamento";
  if (/medo|ansioso|triste|cansado|perdido/.test(texto)) return "emocional";
  return "indefinido";
}

// ==========================
// MOTOR DE CONVERSA (O CORAÇÃO)
// ==========================
function responder(textoUsuario) {
  let estado = carregarEstado();
  estado.historico.push(textoUsuario);

  let resposta = "";

  // ======================
  // FASE 1 — ACOLHIMENTO
  // ======================
  if (estado.fase === 1) {
    resposta = "Estou com você. Fale com calma. O que está pesando agora?";
    estado.fase = 2;
  }

  // ======================
  // FASE 2 — ORGANIZAÇÃO
  // ======================
  else if (estado.fase === 2) {
    estado.problemaCentral = detectarProblema(textoUsuario);

    resposta =
      "Vou organizar isso com você. " +
      "Do que você falou, o ponto central parece ser algo que está tirando sua estabilidade. " +
      "O que exatamente nessa situação mais te preocupa hoje?";

    estado.fase = 3;
  }

  // ======================
  // FASE 3 — CLAREZA
  // ======================
  else if (estado.fase === 3) {
    resposta =
      "Vamos separar as coisas. " +
      "O que, nessa situação, está sob o seu controle — e o que não está?";

    estado.fase = 4;
  }

  // ======================
  // FASE 4 — SAÍDA
  // ======================
  else if (estado.fase === 4) {
    resposta =
      "Com base no que você disse, existem caminhos possíveis aqui. " +
      "Um envolve agir agora com o que você tem. " +
      "Outro envolve esperar para reduzir risco. " +
      "E um terceiro envolve mudar o foco. " +
      "Qual deles faz mais sentido para você neste momento?";

    estado.fase = 5;
  }

  // ======================
  // FASE 5 — FECHAMENTO
  // ======================
  else {
    resposta =
      "Você não precisa decidir tudo agora. " +
      "Mas agora você tem clareza suficiente para não agir no escuro. " +
      "Quando quiser continuar, estarei aqui.";

    estado = estadoInicial(); // encerra ciclo
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
    status.innerText = "Orion está ouvindo...";
    recognition.start();
  });

  recognition.onresult = (event) => {
    const texto = event.results[0][0].transcript;
    registrar("Você", texto);

    const resposta = responder(texto);
    registrar("Orion", resposta);

    falar(resposta);
    status.innerText = "Orion está com você.";
  };

  recognition.onerror = () => {
    status.innerText = "Erro ao ouvir. Tente novamente.";
  };
}
