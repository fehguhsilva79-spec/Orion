// ==========================
// ELEMENTOS
// ==========================
const micBtn = document.getElementById("mic-btn");
const status = document.getElementById("status");
const output = document.getElementById("output");

// ==========================
// FALA (TTS)
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
// MEMÓRIA GLOBAL
// ==========================
const memoriaKey = "orion_estado_vital";

function carregarMemoria() {
  const dados = localStorage.getItem(memoriaKey);
  if (!dados) {
    return {
      tristeza: 0,
      cansaco: 0,
      medo: 0,
      confusao: 0,
      pressao: 0,
      ultimoEstado: null,
      repeticoes: 0
    };
  }
  return JSON.parse(dados);
}

function salvarMemoria(memoria) {
  localStorage.setItem(memoriaKey, JSON.stringify(memoria));
}

// ==========================
// DETECÇÃO EMOCIONAL
// ==========================
function detectarEstado(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("triste") || texto.includes("desanimado")) return "tristeza";
  if (texto.includes("cansado") || texto.includes("esgotado")) return "cansaco";
  if (texto.includes("medo") || texto.includes("inseguro")) return "medo";
  if (texto.includes("pressionado") || texto.includes("cobrança")) return "pressao";
  if (texto.includes("confuso") || texto.includes("perdido") || texto.includes("não sei")) return "confusao";

  return "neutro";
}

// ==========================
// GERADOR DE CONDUÇÃO
// ==========================
function gerarResposta(textoUsuario) {
  const memoria = carregarMemoria();
  const estadoAtual = detectarEstado(textoUsuario);

  if (estadoAtual === memoria.ultimoEstado) {
    memoria.repeticoes++;
  } else {
    memoria.repeticoes = 0;
  }

  memoria.ultimoEstado = estadoAtual;
  if (memoria[estadoAtual] !== undefined) memoria[estadoAtual]++;
  salvarMemoria(memoria);

  // ==========================
  // LÓGICA DE RESPOSTA
  // ==========================
  if (estadoAtual === "tristeza") {
    if (memoria.repeticoes === 0) {
      return "Percebo tristeza. O que fez esse sentimento aparecer hoje?";
    }
    if (memoria.repeticoes === 1) {
      return "Você voltou a esse sentimento. Ele está mais intenso agora ou mais cansativo?";
    }
    return "Quando a tristeza insiste assim, ela deixa de ser um momento e vira um pedido de atenção. O que você tem evitado encarar?";
  }

  if (estadoAtual === "cansaco") {
    if (memoria.repeticoes === 0) {
      return "Esse cansaço parece mais mental do que físico. O que tem ocupado sua cabeça ultimamente?";
    }
    return "Talvez você não precise de mais força, mas de menos peso. O que hoje você carregaria com prazer se pudesse largar o resto?";
  }

  if (estadoAtual === "medo") {
    if (memoria.repeticoes === 0) {
      return "O medo costuma surgir quando algo importa de verdade. Do que exatamente você está tentando se proteger?";
    }
    return "Evitar o medo costuma custar mais energia do que enfrentá-lo aos poucos. Qual seria um primeiro passo seguro?";
  }

  if (estadoAtual === "pressao") {
    if (memoria.repeticoes === 0) {
      return "Nem toda expectativa externa merece prioridade. De quem é essa cobrança que você sente agora?";
    }
    return "Quando tudo parece urgente, algo essencial costuma ser ignorado. O que é realmente inadiável para você hoje?";
  }

  if (estadoAtual === "confusao") {
    if (memoria.repeticoes === 0) {
      return "Confusão geralmente não é falta de opção, é excesso de caminhos. O que você sente que precisa decidir primeiro?";
    }
    return "Antes de decidir, talvez seja mais importante entender o que você não quer mais sustentar.";
  }

  // NEUTRO
  return "Estou com você. Fale no seu tempo.";
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

    output.innerHTML += `<div><strong>Você:</strong> ${texto}</div>`;

    const resposta = gerarResposta(texto);
    output.innerHTML += `<div><strong>Orion:</strong> ${resposta}</div>`;

    falar(resposta);
    status.innerText = "Orion está com você.";
  };

  recognition.onerror = () => {
    status.innerText = "Não consegui ouvir. Tente novamente.";
  };
}
