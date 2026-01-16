// ==========================
// ELEMENTOS DA INTERFACE
// ==========================
const micBtn = document.getElementById("mic-btn");
const status = document.getElementById("status");
const output = document.getElementById("output");

// ==========================
// FUNÇÃO DE FALA (SAÍDA)
// ==========================
function falar(texto) {
  if (!("speechSynthesis" in window)) {
    alert("Seu navegador não suporta síntese de voz.");
    return;
  }

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
// RESPOSTAS-BASE DO ORION
// ==========================
const respostas = {
  confusao: [
    "Entendi. Quando muitas coisas se misturam, a mente perde clareza.",
    "Vamos separar isso com calma.",
    "O que mais ocupa sua cabeça agora?"
  ],
  cansaco: [
    "Isso soa como alguém que está carregando mais do que deveria.",
    "Antes de decidir qualquer coisa, vale entender esse peso.",
    "O que hoje mais te drena energia?"
  ],
  medo: [
    "Faz sentido sentir medo quando algo importa de verdade.",
    "O medo costuma aparecer antes da clareza.",
    "O que você acredita que pode perder nessa decisão?"
  ],
  pressao: [
    "Parece que existem expectativas ao redor te empurrando.",
    "Quando a pressão vem de fora, a confusão aumenta por dentro.",
    "Essa decisão é mais sua ou dos outros?"
  ],
  indecisao: [
    "Soa como um conflito interno, não como falta de opção.",
    "Dois caminhos costumam disputar quando ambos têm custo.",
    "O que cada escolha te exige agora?"
  ]
};

// ==========================
// DETECÇÃO DE ESTADO MENTAL
// ==========================
function detectarEstado(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("não sei") || texto.includes("confuso") || texto.includes("perdido")) {
    return "confusao";
  }
  if (texto.includes("cansado") || texto.includes("esgotado") || texto.includes("não aguento")) {
    return "cansaco";
  }
  if (texto.includes("medo") || texto.includes("inseguro") || texto.includes("errado")) {
    return "medo";
  }
  if (texto.includes("preciso") || texto.includes("esperam") || texto.includes("cobram")) {
    return "pressao";
  }
  if (texto.includes("ou") || texto.includes("decidir") || texto.includes("escolher")) {
    return "indecisao";
  }

  return "confusao"; // padrão
}

// ==========================
// GERAR RESPOSTA DO ORION
// ==========================
function gerarResposta(textoUsuario) {
  const estado = detectarEstado(textoUsuario);
  const partes = respostas[estado];

  return `${partes[0]}<br>${partes[1]}<br><br>${partes[2]}`;
}

// ==========================
// RECONHECIMENTO DE VOZ
// ==========================
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  status.innerText = "Reconhecimento de voz não suportado neste navegador.";
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
    status.innerText = "Clareza antes da decisão.";
  };

  recognition.onerror = () => {
    status.innerText = "Erro ao ouvir. Tente novamente.";
  };
}
