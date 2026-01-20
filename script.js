// ==========================
// ELEMENTOS DA INTERFACE
// ==========================
const micBtn = document.getElementById("mic-btn");
const stopBtn = document.getElementById("stop-btn");
const statusEl = document.getElementById("status");
const output = document.getElementById("output");

// ==========================
// CONTEXTO DE SESSÃO (CORAÇÃO DO ORION)
// ==========================
const session = {
  ativa: false,
  tema: null,
  emocao: null,
  profundidade: 0,
  ultimaFala: "",
  silencioPermitido: false
};

// ==========================
// VOZ DO ORION
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
  const voz = voices.find(v => v.lang === "pt-BR");
  if (voz) u.voice = voz;

  speechSynthesis.speak(u);
}

// ==========================
// PARAR FALA
// ==========================
stopBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
  statusEl.innerText = "Orion permaneceu em silêncio.";
});

// ==========================
// MEMÓRIA LEVE (APENAS PADRÕES)
// ==========================
const MEM_KEY = "orion_memoria";

function loadMemory() {
  return JSON.parse(localStorage.getItem(MEM_KEY)) || {};
}

function saveMemory(mem) {
  localStorage.setItem(MEM_KEY, JSON.stringify(mem));
}

// ==========================
// DETECÇÃO SEMÂNTICA SIMPLES
// ==========================
function detectarTema(texto) {
  texto = texto.toLowerCase();

  if (/dinheiro|financeiro|conta|dívida|grana/.test(texto)) return "financeiro";
  if (/trabalho|emprego|empresa|chefe/.test(texto)) return "trabalho";
  if (/relacionamento|amor|casamento|família/.test(texto)) return "relacionamento";
  if (/futuro|decisão|escolha|vida/.test(texto)) return "decisão";

  return "geral";
}

function detectarEmocao(texto) {
  texto = texto.toLowerCase();

  if (/triste|desanimado|sem vontade/.test(texto)) return "tristeza";
  if (/ansioso|preocupado|tenso/.test(texto)) return "ansiedade";
  if (/raiva|irritado|ódio/.test(texto)) return "raiva";
  if (/medo|inseguro/.test(texto)) return "medo";
  if (/cansado|exausto/.test(texto)) return "cansaço";

  return "neutro";
}

// ==========================
// GERADOR DE CONVERSA CONTÍNUA
// ==========================
function gerarResposta(texto) {
  const temaAtual = detectarTema(texto);
  const emocaoAtual = detectarEmocao(texto);

  // Início de sessão
  if (!session.ativa) {
    session.ativa = true;
    session.tema = temaAtual;
    session.emocao = emocaoAtual;
    session.profundidade = 1;

    return "Estou aqui. O que te trouxe até esse momento?";
  }

  // Continuação de tema
  if (temaAtual === session.tema) {
    session.profundidade++;

    if (session.profundidade === 2) {
      return `Percebo ${session.emocao || "algo importante"} nisso. O que mais pesa para você agora?`;
    }

    if (session.profundidade === 3) {
      return "Se você fosse totalmente honesto consigo mesmo, o que estaria evitando admitir?";
    }

    if (session.profundidade >= 4) {
      session.silencioPermitido = true;
      return "Fique em silêncio por alguns segundos. Às vezes a clareza vem sem palavras.";
    }
  }

  // Mudança de tema consciente
  session.tema = temaAtual;
  session.emocao = emocaoAtual;
  session.profundidade = 1;

  return "Entendo. Vamos olhar para isso com calma. O que você sente agora?";
}

// ==========================
// RECONHECIMENTO DE VOZ
// ==========================
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  statusEl.innerText = "Reconhecimento de voz não suportado.";
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.continuous = false;

  micBtn.addEventListener("click", () => {
    statusEl.innerText = "Orion está ouvindo...";
    recognition.start();
  });

  recognition.onresult = (e) => {
    const texto = e.results[0][0].transcript;
    output.innerHTML += `<strong>Você:</strong> ${texto}<br>`;

    const resposta = gerarResposta(texto);

    if (resposta) {
      output.innerHTML += `<strong>Orion:</strong> ${resposta}<br><br>`;
      falar(resposta);
    }

    statusEl.innerText = "Orion permanece presente.";
  };

  recognition.onerror = () => {
    statusEl.innerText = "Houve um erro ao ouvir. Tente novamente.";
  };
}
