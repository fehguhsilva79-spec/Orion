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
  u.pitch = 1;
  u.volume = 1;

  const br = speechSynthesis.getVoices().find(v => v.lang === "pt-BR");
  if (br) u.voice = br;

  speechSynthesis.speak(u);
}

stopBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
  status.innerText = "Orion em silêncio. Presente.";
});

// ==========================
// ESTRUTURA DE VIDA DO USUÁRIO
// ==========================
const vidaKey = "orion_vida";

function vidaInicial() {
  return {
    assuntos: [], // registros organizados
    assuntoAtual: null
  };
}

function carregarVida() {
  const v = localStorage.getItem(vidaKey);
  return v ? JSON.parse(v) : vidaInicial();
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
  if (/dinheiro|financeiro|conta|grana/.test(texto)) return "Financeiro";
  if (/trabalho|emprego|empresa|chefe/.test(texto)) return "Trabalho";
  if (/relacionamento|amor|casamento|família/.test(texto)) return "Relacionamentos";
  if (/ansioso|triste|cansado|medo|perdido/.test(texto)) return "Emocional";
  return "Geral";
}

// ==========================
// ESTADO DO CICLO DE CONVERSA
// ==========================
const estadoKey = "orion_estado";

function estadoInicial() {
  return {
    fase: 1
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
// MOTOR DE CONVERSA + ORGANIZAÇÃO
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
      "Estou com você. " +
      "Quer continuar algo que já falamos antes ou começar um assunto novo?";

    estado.fase = 2;
  }

  // ======================
  // FASE 2 — DEFINIR ASSUNTO
  // ======================
  else if (estado.fase === 2) {
    const tema = detectarTema(textoUsuario);

    const novoAssunto = {
      tema,
      data: new Date().toISOString(),
      conversas: []
    };

    vida.assuntos.push(novoAssunto);
    vida.assuntoAtual = vida.assuntos.length - 1;

    resposta =
      `Vamos organizar isso como um assunto sobre ${tema}. ` +
      "O que exatamente está pesando nisso hoje?";

    estado.fase = 3;
  }

  // ======================
  // FASE 3 — CLAREZA
  // ======================
  else if (estado.fase === 3) {
    resposta =
      "Vamos separar as coisas com calma. " +
      "O que nessa situação está sob o seu controle agora?";

    estado.fase = 4;
  }

  // ======================
  // FASE 4 — CAMINHOS
  // ======================
  else if (estado.fase === 4) {
    resposta =
      "Existem caminhos possíveis aqui. " +
      "Agir agora, esperar um pouco ou mudar o foco. " +
      "Qual deles parece mais honesto com você hoje?";

    estado.fase = 5;
  }

  // ======================
  // FASE 5 — FECHAMENTO
  // ======================
  else {
    resposta =
      "Não precisa resolver tudo agora. " +
      "Esse assunto ficará guardado, e podemos continuar quando quiser.";

    estado = estadoInicial();
    vida.assuntoAtual = null;
  }

  // ======================
  // SALVAR CONVERSA NO ASSUNTO
  // ======================
  if (vida.assuntoAtual !== null) {
    vida.assuntos[vida.assuntoAtual].conversas.push(
      { autor: "Você", texto: textoUsuario },
      { autor: "Orion", texto: resposta }
    );
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
    status.innerText = "Orion segue com você.";
  };

  recognition.onerror = () => {
    ouvindo = false;
    status.innerText = "Não consegui ouvir. Tente novamente quando quiser.";
  };

  recognition.onend = () => {
    ouvindo = false;
  };
}
