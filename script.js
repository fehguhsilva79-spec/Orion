// ==========================
// ELEMENTOS
// ==========================
const micBtn = document.getElementById("mic-btn");
const stopBtn = document.getElementById("stop-btn");
const status = document.getElementById("status");
const output = document.getElementById("output");

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

  const br = speechSynthesis.getVoices().find(v => v.lang === "pt-BR");
  if (br) u.voice = br;

  speechSynthesis.speak(u);
}

stopBtn.onclick = () => {
  speechSynthesis.cancel();
  status.innerText = "Orion em silêncio. Presente.";
};

// ==========================
// VIDA DO USUÁRIO (MEMÓRIA REAL)
// ==========================
const vidaKey = "orion_vida";

function vidaInicial() {
  return {
    temas: {
      emocional: [],
      financeiro: [],
      trabalho: [],
      relacionamento: [],
      saude: [],
      decisoes: [],
      ideias: [],
      geral: []
    },
    temaAtual: null
  };
}

function carregarVida() {
  return JSON.parse(localStorage.getItem(vidaKey)) || vidaInicial();
}

function salvarVida(v) {
  localStorage.setItem(vidaKey, JSON.stringify(v));
}

// ==========================
// UTILIDADES
// ==========================
function registrar(autor, texto) {
  output.innerHTML += `<strong>${autor}:</strong> ${texto}<br><br>`;
  output.scrollTop = output.scrollHeight;
}

function detectarTema(texto) {
  texto = texto.toLowerCase();

  if (/dinheiro|financeiro|conta|grana/.test(texto)) return "financeiro";
  if (/trabalho|emprego|empresa|chefe/.test(texto)) return "trabalho";
  if (/relacionamento|amor|casamento|família/.test(texto)) return "relacionamento";
  if (/ansioso|triste|cansado|medo|perdido/.test(texto)) return "emocional";
  if (/saúde|doente|corpo|mente/.test(texto)) return "saude";
  if (/decisão|escolha|dúvida/.test(texto)) return "decisoes";
  if (/ideia|projeto|criar/.test(texto)) return "ideias";

  return "geral";
}

// ==========================
// ESTADO DE CONVERSA
// ==========================
const estadoKey = "orion_estado";

function estadoInicial() {
  return { fase: 1 };
}

function carregarEstado() {
  return JSON.parse(localStorage.getItem(estadoKey)) || estadoInicial();
}

function salvarEstado(e) {
  localStorage.setItem(estadoKey, JSON.stringify(e));
}

// ==========================
// MOTOR DO ORION
// ==========================
function responder(textoUsuario) {
  let estado = carregarEstado();
  let vida = carregarVida();
  let resposta = "";

  // ======================
  // FASE 1 — ACOLHIMENTO
  // ======================
  if (estado.fase === 1) {
    resposta =
      "Estou aqui com você. " +
      "Quer continuar algo que já estava pensando ou começar um assunto novo?";

    estado.fase = 2;
  }

  // ======================
  // FASE 2 — DEFINIR TEMA
  // ======================
  else if (estado.fase === 2) {
    const tema = detectarTema(textoUsuario);
    vida.temaAtual = tema;

    const jaExiste = vida.temas[tema].length > 0;

    resposta = jaExiste
      ? `Isso toca algo que você já trouxe antes sobre ${tema}. O que está diferente agora?`
      : `Vamos organizar isso como algo ligado a ${tema}. O que mais pesa nisso hoje?`;

    estado.fase = 3;
  }

  // ======================
  // FASE 3 — CLAREZA
  // ======================
  else if (estado.fase === 3) {
    resposta =
      "Vamos separar isso com calma. " +
      "O que nessa situação depende de você — e o que não depende?";

    estado.fase = 4;
  }

  // ======================
  // FASE 4 — CAMINHOS
  // ======================
  else if (estado.fase === 4) {
    resposta =
      "Existem alguns caminhos aqui. " +
      "Agir agora, esperar um pouco ou mudar o foco. " +
      "Qual deles faz mais sentido para você hoje?";

    estado.fase = 5;
  }

  // ======================
  // FASE 5 — FECHAMENTO
  // ======================
  else {
    resposta =
      "Isso ficará guardado. " +
      "Você não precisa resolver tudo agora. " +
      "Quando quiser continuar, eu estarei aqui.";

    estado = estadoInicial();
    vida.temaAtual = null;
  }

  // ======================
  // REGISTRO NA VIDA
  // ======================
  if (vida.temaAtual) {
    vida.temas[vida.temaAtual].push({
      texto: textoUsuario,
      data: new Date().toISOString()
    });
  }

  salvarVida(vida);
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

  micBtn.onclick = () => {
    if (ouvindo) return;
    ouvindo = true;
    status.innerText = "Orion está ouvindo...";
    recognition.start();
  };

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
    status.innerText = "Não consegui ouvir.";
  };

  recognition.onend = () => {
    ouvindo = false;
  };
}
