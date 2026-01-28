// ==========================
// ELEMENTOS
// ==========================
const micBtn = document.getElementById("mic-btn");
const stopBtn = document.getElementById("stop-btn");
const status = document.getElementById("status");
const output = document.getElementById("output");
const temasBtns = document.querySelectorAll("[data-tema]");

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
// INTENÇÃO
// ==========================
function detectarIntencao(texto) {
  texto = texto.toLowerCase();
  if (/lembra|não esquece|amanhã|mais tarde|daqui/.test(texto)) return "lembrete";
  if (/importante|guarda isso/.test(texto)) return "importante";
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
// HISTÓRICO
// ==========================
function registrar(autor, texto) {
  output.innerHTML += `<strong>${autor}:</strong> ${texto}<br><br>`;
  output.scrollTop = output.scrollHeight;
}

// ==========================
// LEMBRETES AUTOMÁTICOS
// ==========================
function verificarLembretes() {
  const vida = carregarVida();
  const agora = new Date();

  const pendentes = vida.lembretes.filter(l => !l.feito);

  if (pendentes.length === 0) return;

  const lembrete = pendentes[0];
  lembrete.feito = true;

  salvarVida(vida);

  const msg = `Antes de continuarmos… você me pediu pra te lembrar disso: ${lembrete.texto}`;
  registrar("Orion", msg);
  falar(msg);
}

// roda ao abrir o app
setTimeout(verificarLembretes, 2000);

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
  let resposta = "";

  const intencao = detectarIntencao(textoUsuario);

  if (!vida.temaAtual) vida.temaAtual = detectarTema(textoUsuario);

  if (intencao === "lembrete") {
    vida.lembretes.push({
      texto: textoUsuario,
      data: new Date().toISOString(),
      feito: false
    });

    salvarVida(vida);
    return "Certo. Vou guardar isso e te lembrar depois.";
  }

  if (estado.fase === 1) {
    resposta = "Estou aqui com você. Quer continuar algo ou começar algo novo?";
    estado.fase = 2;
  } else if (estado.fase === 2) {
    resposta = `Vamos falar sobre ${vida.temaAtual}. O que mais pesa agora?`;
    estado.fase = 3;
  } else if (estado.fase === 3) {
    resposta = "O que depende de você nisso — e o que não depende?";
    estado.fase = 4;
  } else {
    resposta = "Isso fica guardado. Quando quiser continuar, estarei aqui.";
    estado = estadoInicial();
    vida.temaAtual = null;
  }

  vida.temas[vida.temaAtual].push({
    texto: textoUsuario,
    data: new Date().toISOString()
  });

  salvarVida(vida);
  salvarEstado(estado);

  return resposta;
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
