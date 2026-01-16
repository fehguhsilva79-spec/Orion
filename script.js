// ==========================
// ELEMENTOS DA INTERFACE
// ==========================
const micBtn = document.getElementById("mic-btn");
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
// MEMÓRIA LEVE (LOCAL)
// ==========================
const memoriaKey = "orion_memoria";

function carregarMemoria() {
  const dados = localStorage.getItem(memoriaKey);
  if (!dados) {
    return {
      confusao: 0,
      cansaco: 0,
      medo: 0,
      pressao: 0,
      indecisao: 0
    };
  }
  return JSON.parse(dados);
}

function salvarMemoria(memoria) {
  localStorage.setItem(memoriaKey, JSON.stringify(memoria));
}

// ==========================
// RESPOSTAS BASE
// ==========================
const respostas = {
  confusao: [
    "Quando muitas ideias se misturam, a mente perde nitidez.",
    "Clareza não surge com pressa.",
    "O que hoje mais te confunde?"
  ],
  cansaco: [
    "O cansaço constante costuma ser um sinal ignorado por muito tempo.",
    "Talvez não seja falta de força, mas excesso de peso.",
    "O que mais te drena energia hoje?"
  ],
  medo: [
    "O medo aparece quando algo importa de verdade.",
    "Ele não significa fraqueza.",
    "O que você teme perder nessa situação?"
  ],
  pressao: [
    "Expectativas externas costumam silenciar a própria voz.",
    "Nem toda cobrança precisa ser atendida.",
    "Essa decisão é sua ou dos outros?"
  ],
  indecisao: [
    "Indecisão geralmente nasce de valores em conflito.",
    "Não é falta de opção, é excesso de custo.",
    "O que cada escolha exige de você agora?"
  ]
};

// ==========================
// DETECTAR ESTADO
// ==========================
function detectarEstado(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("confuso") || texto.includes("perdido") || texto.includes("não sei")) return "confusao";
  if (texto.includes("cansado") || texto.includes("esgotado") || texto.includes("triste")) return "cansaco";
  if (texto.includes("medo") || texto.includes("inseguro")) return "medo";
  if (texto.includes("pressão") || texto.includes("cobrança") || texto.includes("esperam")) return "pressao";
  if (texto.includes("decidir") || texto.includes("escolher") || texto.includes(" ou ")) return "indecisao";

  return "confusao";
}

// ==========================
// GERAR RESPOSTA COM CONTEXTO
// ==========================
function gerarResposta(textoUsuario) {
  const estado = detectarEstado(textoUsuario);
  const memoria = carregarMemoria();

  memoria[estado]++;
  salvarMemoria(memoria);

  const respostasEstado = respostas[estado];

  let resposta = `${respostasEstado[0]}<br>${respostasEstado[1]}`;

  const totalInteracoes =
    memoria.confusao +
    memoria.cansaco +
    memoria.medo +
    memoria.pressao +
    memoria.indecisao;

  if (memoria[estado] >= 3) {
    resposta += `<br><br>Percebo que esse tema tem aparecido com frequência.`;
  }

  if (memoria[estado] >= 5 && totalInteracoes >= 6) {
    resposta += `<br><br>Isso já não parece um momento isolado, mas uma fase.`;
  }

  resposta += `<br><br>${respostasEstado[2]}`;

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

    output.innerHTML = `<strong>Você:</strong> ${texto}`;

    const resposta = gerarResposta(texto);

    output.innerHTML += `<br><br><strong>Orion:</strong><br>${resposta}`;

    falar(resposta.replace(/<br>/g, " "));
    status.innerText = "Orion está refletindo com você.";
  };

  recognition.onerror = () => {
    status.innerText = "Erro ao ouvir. Tente novamente.";
  };
}
