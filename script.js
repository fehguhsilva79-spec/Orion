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
// MEMÓRIA LOCAL
// ==========================
const memoriaKey = "orion_memoria";

function carregarMemoria() {
  const dados = localStorage.getItem(memoriaKey);
  if (!dados) return { conversas: [] };
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
    "Como está se sentindo hoje?"
  ],
  desabafo: [
    "Percebo sua emoção. Quer me contar mais sobre isso?",
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
  financeiro: [
    "Situações financeiras podem gerar preocupação.",
    "Vamos analisar juntos o que podemos fazer."
  ],
  default: [
    "Estou com você. Pode continuar.",
    "Fale no seu tempo."
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
// INFERIR EMOÇÃO
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
// GERAR RESPOSTA FINAL
// ==========================
function gerarResposta(textoUsuario) {
  const memoria = carregarMemoria();
  const intencao = detectarIntencao(textoUsuario);
  const contexto = detectarContexto(textoUsuario);
  const emocao = inferirEmocao(textoUsuario);

  // Incrementa memória da intenção
  if (!memoria[intencao]) memoria[intencao] = 0;
  memoria[intencao]++;
  // Armazena conversa completa
  memoria.conversas.push({ usuario: textoUsuario, orion: null });
  salvarMemoria(memoria);

  // Base da resposta
  let resposta = "";

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
    case "financeiro":
      resposta = respostas.financeiro[Math.min(memoria[intencao]-1, respostas.financeiro.length-1)];
      break;
    default:
      resposta = respostas.default[Math.min(memoria[intencao]-1, respostas.default.length-1)];
  }

  // Adiciona contexto para profundidade
  if (contexto !== "geral" && intencao !== "saudacao") {
    resposta += ` Notei que isso envolve ${contexto}.`;
  }

  // Atualiza a conversa na memória
  memoria.conversas[memoria.conversas.length-1].orion = resposta;
  salvarMemoria(memoria);

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

    // Saída formatada com classes para CSS atualizado
    output.innerHTML += `<div class="usuario"><strong>Você:</strong> ${texto}</div>`;

    const resposta = gerarResposta(texto);

    output.innerHTML += `<div class="orion"><strong>Orion:</strong> ${resposta}</div><br>`;

    falar(resposta);
    status.innerText = "Orion está refletindo com você.";

    // Scroll automático
    output.scrollTop = output.scrollHeight;
  };

  recognition.onerror = () => {
    status.innerText = "Erro ao ouvir. Tente novamente.";
  };
}
