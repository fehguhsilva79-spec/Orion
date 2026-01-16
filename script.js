// ==================================================
// ORION v1.0 — Núcleo Cognitivo Local
// Compatível com GitHub Pages e Vercel
// ==================================================

// ==========================
// ELEMENTOS DA INTERFACE
// ==========================
const micBtn = document.getElementById("mic-btn");
const status = document.getElementById("status");
const output = document.getElementById("output");

// ==========================
// CONFIGURAÇÕES GERAIS
// ==========================
const memoriaKey = "orion_memoria_v1";
const faseKey = "orion_fase_v1";

// ==========================
// FUNÇÃO DE FALA
// ==========================
function falar(texto) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();
  const vozBR = voices.find(v => v.lang.includes("pt"));
  if (vozBR) utterance.voice = vozBR;

  speechSynthesis.speak(utterance);
}

// ==========================
// MEMÓRIA LOCAL
// ==========================
function carregarMemoria() {
  const dados = localStorage.getItem(memoriaKey);
  if (!dados) {
    return {
      tristeza: 0,
      cansaco: 0,
      confusao: 0,
      medo: 0,
      pressao: 0
    };
  }
  return JSON.parse(dados);
}

function salvarMemoria(memoria) {
  localStorage.setItem(memoriaKey, JSON.stringify(memoria));
}

function carregarFase() {
  return localStorage.getItem(faseKey) || "acolhimento";
}

function salvarFase(fase) {
  localStorage.setItem(faseKey, fase);
}

// ==========================
// DETECÇÃO EMOCIONAL
// ==========================
function detectarEstado(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("triste") || texto.includes("vazio")) return "tristeza";
  if (texto.includes("cansado") || texto.includes("esgotado")) return "cansaco";
  if (texto.includes("confuso") || texto.includes("perdido")) return "confusao";
  if (texto.includes("medo") || texto.includes("inseguro")) return "medo";
  if (texto.includes("pressão") || texto.includes("cobrança")) return "pressao";

  return "confusao";
}

// ==========================
// GERADOR DE RESPOSTAS
// ==========================
function gerarResposta(textoUsuario) {
  const estado = detectarEstado(textoUsuario);
  const memoria = carregarMemoria();
  let fase = carregarFase();

  memoria[estado]++;
  salvarMemoria(memoria);

  // Progressão de fase
  if (memoria[estado] >= 2 && fase === "acolhimento") {
    fase = "reflexao";
  }

  if (memoria[estado] >= 4 && fase === "reflexao") {
    fase = "consciencia";
  }

  if (memoria[estado] >= 6 && fase === "consciencia") {
    fase = "direcionamento";
  }

  salvarFase(fase);

  // ==========================
  // RESPOSTAS POR FASE
  // ==========================
  let resposta = "";

  if (fase === "acolhimento") {
    resposta = `
      Estou aqui com você.
      Nem tudo precisa ser resolvido agora.
      Quer me dizer um pouco mais sobre isso?
    `;
  }

  if (fase === "reflexao") {
    resposta = `
      Percebo que isso tem se repetido.
      Às vezes, não é o problema que pesa, mas o tempo que ele permanece.
      O que mais te afeta nessa situação?
    `;
  }

  if (fase === "consciencia") {
    resposta = `
      Isso já não parece um momento isolado.
      Parece uma fase.
      O que você tem evitado encarar enquanto isso se repete?
    `;
  }

  if (fase === "direcionamento") {
    resposta = `
      Ficar parado também é uma escolha, mesmo quando dói.
      Não te direi o que fazer.
      Mas te pergunto:
      o que mudaria se você cuidasse disso de forma diferente?
    `;
  }

  return resposta.trim();
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

    output.innerHTML += `<br><br><strong>Orion:</strong><br>${resposta.replace(/\n/g, "<br>")}`;

    falar(resposta);
    status.innerText = "Orion está refletindo com você.";
  };

  recognition.onerror = () => {
    status.innerText = "Erro ao ouvir. Tente novamente.";
  };
}
