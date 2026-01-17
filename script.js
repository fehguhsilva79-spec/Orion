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
// MEMÓRIA LEVE
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
// RESPOSTAS BASE
// ==========================
const respostas = {
  saudacao: [
    "Olá! Estou com você. Fale no seu tempo.",
    "Sempre pronto para ouvir o que importa pra você."
  ],
  desabafo: [
    "Entendo. Quer me contar mais sobre isso?",
    "O que mais tem te incomodado nesse assunto?"
  ],
  pedidoAjuda: [
    "Vamos pensar juntos sobre isso.",
    "Como você imagina uma saída para essa situação?"
  ],
  reflexao: [
    "Interessante. O que essa situação te faz sentir?",
    "Vamos analisar juntos o que isso significa para você."
  ],
  casual: [
    "Continuo aqui, posso ouvir você.",
    "Fale o que quiser, sem pressa."
  ],
  default: [
    "Percebo o que você disse. Quer explorar isso comigo?",
    "Me conte mais para que eu compreenda melhor."
  ]
};

// ==========================
// DETECTAR INTENÇÃO
// ==========================
function detectarIntencao(texto) {
  texto = texto.toLowerCase();

  if (/(olá|oi|bom dia|boa tarde|boa noite)/.test(texto)) return "saudacao";
  if (/(preciso de ajuda|me ajude|não sei o que fazer)/.test(texto)) return "pedidoAjuda";
  if (/(estou triste|estou cansado|ansioso|me sinto|medo)/.test(texto)) return "desabafo";
  if (/(penso|refletindo|me questiono)/.test(texto)) return "reflexao";
  return "casual";
}

// ==========================
// DETECTAR CONTEXTO
// ==========================
function detectarContexto(texto) {
  texto = texto.toLowerCase();

  if (/(dinheiro|contas|financeiro)/.test(texto)) return "financeiro";
  if (/(trabalho|empresa|chefe)/.test(texto)) return "trabalho";
  if (/(amor|relacionamento|parceiro|família)/.test(texto)) return "relacionamento";
  if (/(autoestima|confiança|autoconfiança)/.test(texto)) return "autoestima";
  if (/(futuro|objetivo|meta|planejamento)/.test(texto)) return "futuro";
  return "geral";
}

// ==========================
// INFERIR EMOÇÃO IMPLÍCITA
// ==========================
function inferirEmocao(texto) {
  texto = texto.toLowerCase();

  if (/(triste|deprimido|desanimado|desmotivado)/.test(texto)) return "tristeza";
  if (/(ansioso|nervoso|inseguro)/.test(texto)) return "ansiedade";
  if (/(raiva|irritado|zangado)/.test(texto)) return "raiva";
  if (/(medo|receio|preocupado)/.test(texto)) return "medo";
  if (/(cansado|exausto|sobrecarregado)/.test(texto)) return "cansaço";
  return "neutro";
}

// ==========================
// GERAR RESPOSTA COMPLETA
// ==========================
function gerarResposta(textoUsuario) {
  const intencao = detectarIntencao(textoUsuario);
  const contexto = detectarContexto(textoUsuario);
  const emocao = inferirEmocao(textoUsuario);
  const memoria = carregarMemoria();

  // Inicializa contadores
  if (!memoria[intencao]) memoria[intencao] = 0;
  memoria[intencao]++;
  salvarMemoria(memoria);

  // Base da resposta
  let resposta = "";

  // Conecta intenção + contexto + emoção
  switch (intencao) {
    case "saudacao":
      resposta = respostas.saudacao[Math.min(memoria[intencao]-1, respostas.saudacao.length-1)];
      break;
    case "desabafo":
      resposta = `Percebo ${emocao}. `;
      resposta += respostas.desabafo[Math.min(memoria[intencao]-1, respostas.desabafo.length-1)];
      break;
    case "pedidoAjuda":
      resposta = respostas.pedidoAjuda[Math.min(memoria[intencao]-1, respostas.pedidoAjuda.length-1)];
      break;
    case "reflexao":
      resposta = respostas.reflexao[Math.min(memoria[intencao]-1, respostas.reflexao.length-1)];
      break;
    case "casual":
      resposta = respostas.casual[Math.min(memoria[intencao]-1, respostas.casual.length-1)];
      break;
    default:
      resposta = respostas.default[Math.min(memoria[intencao]-1, respostas.default.length-1)];
  }

  // Contexto adicional para aprofundar
  if (contexto !== "geral" && intencao !== "saudacao") {
    resposta += ` Notei que isso envolve ${contexto}.`;
  }

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
