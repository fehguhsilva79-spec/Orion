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

  const vozBR = speechSynthesis.getVoices().find(v => v.lang === "pt-BR");
  if (vozBR) u.voice = vozBR;

  speechSynthesis.speak(u);
}

stopBtn.onclick = () => {
  speechSynthesis.cancel();
  status.innerText = "Orion em silêncio. Presente.";
};

// ==========================
// VIDA / MEMÓRIA
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
    lembretes: [],
    temaAtual: null,
    modoAtual: "neutro",
    aguardandoConfirmacao: null
  };
}

function carregarVida() {
  return JSON.parse(localStorage.getItem(vidaKey)) || vidaInicial();
}

function salvarVida(v) {
  localStorage.setItem(vidaKey, JSON.stringify(v));
}

// ==========================
// INTENÇÃO
// ==========================
function detectarIntencao(texto) {
  texto = texto.toLowerCase();
  if (/lembra|não esquece|amanhã|mais tarde|daqui/.test(texto)) return "lembrete";
  if (/importante|guarda isso/.test(texto)) return "importante";
  if (/sim|pode|claro/.test(texto)) return "confirmar";
  if (/não|deixa|esquece/.test(texto)) return "negar";
  return "conversa";
}

// ==========================
// TEMA
// ==========================
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
// MODO DO ORION (OPÇÃO A)
// ==========================
function definirModo(tema) {
  if (tema === "emocional" || tema === "relacionamento") return "acolhedor";
  if (tema === "financeiro" || tema === "trabalho" || tema === "decisoes") return "pratico";
  if (tema === "ideias") return "estimulante";
  return "neutro";
}

// ==========================
// RESPOSTA POR MODO
// ==========================
function responderPorModo(modo, textoBase) {
  const respostas = {
    acolhedor: `Estou com você nisso. ${textoBase}`,
    pratico: `${textoBase} Vamos olhar isso com clareza.`,
    estimulante: `${textoBase} Isso pode virar algo grande.`,
    neutro: textoBase
  };
  return respostas[modo];
}

// ==========================
// HISTÓRICO
// ==========================
function registrar(autor, texto) {
  output.innerHTML += `<strong>${autor}:</strong> ${texto}<br><br>`;
  output.scrollTop = output.scrollHeight;
}

// ==========================
// LEMBRETES
// ==========================
function verificarLembretes() {
  const vida = carregarVida();
  const agora = new Date();

  vida.lembretes.forEach(l => {
    if (!l.feito && new Date(l.quando) <= agora) {
      l.feito = true;
      const msg = `Antes de continuarmos… você me pediu pra te lembrar disso: ${l.texto}`;
      registrar("Orion", msg);
      falar(msg);
    }
  });

  salvarVida(vida);
}

setInterval(verificarLembretes, 60000);

// ==========================
// ESTADO
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
// MOTOR PRINCIPAL
// ==========================
function gerarResposta(textoUsuario) {
  let vida = carregarVida();
  let estado = carregarEstado();

  const intencao = detectarIntencao(textoUsuario);
  const novoTema = detectarTema(textoUsuario);

  if (novoTema !== vida.temaAtual) {
    vida.temaAtual = novoTema;
    vida.modoAtual = definirModo(novoTema);
  }

  // confirmação
  if (vida.aguardandoConfirmacao) {
    if (intencao === "confirmar") {
      vida.lembretes.push({
        texto: vida.aguardandoConfirmacao,
        quando: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        feito: false
      });
      vida.aguardandoConfirmacao = null;
      salvarVida(vida);
      return responderPorModo(vida.modoAtual, "Perfeito. Vou cuidar disso.");
    }

    if (intencao === "negar") {
      vida.aguardandoConfirmacao = null;
      salvarVida(vida);
      return responderPorModo(vida.modoAtual, "Tudo bem. Seguimos.");
    }
  }

  if (intencao === "importante") {
    vida.aguardandoConfirmacao = textoUsuario;
    salvarVida(vida);
    return responderPorModo(vida.modoAtual, "Isso parece importante. Quer que eu te lembre depois?");
  }

  if (intencao === "lembrete") {
    vida.lembretes.push({
      texto: textoUsuario,
      quando: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      feito: false
    });
    salvarVida(vida);
    return responderPorModo(vida.modoAtual, "Certo. Vou te lembrar disso.");
  }

  let respostaBase = "";

  if (estado.fase === 1) {
    respostaBase = "Estou aqui. Quer continuar ou começar algo novo?";
    estado.fase = 2;
  } else if (estado.fase === 2) {
    respostaBase = "O que mais pesa agora?";
    estado.fase = 3;
  } else if (estado.fase === 3) {
    respostaBase = "O que depende de você nisso?";
    estado.fase = 4;
  } else {
    respostaBase = "Isso fica guardado. Estarei aqui.";
    estado = estadoInicial();
    vida.temaAtual = null;
    vida.modoAtual = "neutro";
  }

  vida.temas[vida.temaAtual].push({
    texto: textoUsuario,
    data: new Date().toISOString()
  });

  salvarVida(vida);
  salvarEstado(estado);

  return responderPorModo(vida.modoAtual, respostaBase);
}

// ==========================
// BASE PARA PAINEL DE ASSUNTOS (OPÇÃO B)
// ==========================
function listarAssuntos() {
  const vida = carregarVida();
  return Object.keys(vida.temas).map(t => ({
    tema: t,
    total: vida.temas[t].length
  }));
}

function obterHistoricoPorTema(tema) {
  const vida = carregarVida();
  return vida.temas[tema] || [];
}

// ==========================
// VOZ INPUT
// ==========================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";

  micBtn.onclick = () => {
    if (ouvindo) return;
    ouvindo = true;
    status.innerText = "Orion está ouvindo...";
    recognition.start();
  };

  recognition.onresult = e => {
    ouvindo = false;
    const texto = e.results[0][0].transcript;

    registrar("Você", texto);
    const resposta = gerarResposta(texto);
    registrar("Orion", resposta);
    falar(resposta);

    status.innerText = "Orion permanece com você.";
  };
}
