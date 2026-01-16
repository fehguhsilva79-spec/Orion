// ==========================
// ELEMENTOS
// ==========================
const micBtn = document.getElementById("mic-btn");
const status = document.getElementById("status");
const output = document.getElementById("output");

// ==========================
// VOZ
// ==========================
function falar(texto) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(texto);
  msg.lang = "pt-BR";
  msg.rate = 1;
  msg.pitch = 1;

  const voices = speechSynthesis.getVoices();
  const vozBR = voices.find(v => v.lang === "pt-BR");
  if (vozBR) msg.voice = vozBR;

  speechSynthesis.speak(msg);
}

// ==========================
// MEMÓRIA
// ==========================
const MEM_KEY = "orion_memoria_v1";

function carregarMemoria() {
  return JSON.parse(localStorage.getItem(MEM_KEY)) || {
    cansaco: 0,
    tristeza: 0,
    dinheiro: 0,
    geral: 0
  };
}

function salvarMemoria(mem) {
  localStorage.setItem(MEM_KEY, JSON.stringify(mem));
}

// ==========================
// DETECÇÃO DE TEMA
// ==========================
function detectarTema(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("dinheiro") || texto.includes("conta") || texto.includes("falta"))
    return "dinheiro";

  if (texto.includes("triste") || texto.includes("desanimado"))
    return "tristeza";

  if (texto.includes("cansado") || texto.includes("esgotado"))
    return "cansaco";

  return "geral";
}

// ==========================
// GERADOR DE RESPOSTA EVOLUTIVA
// ==========================
function responder(textoUsuario) {
  const tema = detectarTema(textoUsuario);
  const mem = carregarMemoria();

  mem[tema]++;
  salvarMemoria(mem);

  let resposta = "";

  if (tema === "dinheiro") {
    if (mem.dinheiro === 1) {
      resposta = "A falta de dinheiro pesa mais do que números. Ela afeta segurança e dignidade. Quer me dizer o que mais te preocupa nisso agora?";
    } else if (mem.dinheiro === 2) {
      resposta = "Percebo que esse assunto está voltando. Isso indica pressão constante. O que hoje te dá mais medo nessa situação?";
    } else {
      resposta = "Isso já não parece um episódio isolado, mas uma fase. Antes de pensar em solução, precisamos entender onde está o maior aperto. É no presente ou no futuro?";
    }
  }

  else if (tema === "tristeza") {
    if (mem.tristeza === 1) {
      resposta = "Tristeza costuma surgir quando algo importante está sendo sustentado sozinho. O que você tem carregado sem dividir?";
    } else {
      resposta = "Quando a tristeza insiste, ela pede atenção, não força. O que você sente que está faltando hoje?";
    }
  }

  else if (tema === "cansaco") {
    resposta = "Cansaço prolongado raramente é físico. Normalmente vem de esforço sem retorno. Onde você sente que está dando muito e recebendo pouco?";
  }

  else {
    resposta = "Estou com você. Fale no seu ritmo. O que mais está ocupando sua mente agora?";
  }

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

  micBtn.onclick = () => {
    status.innerText = "Orion está ouvindo...";
    recognition.start();
  };

  recognition.onresult = (event) => {
    const texto = event.results[0][0].transcript;

    output.innerHTML += `<p><strong>Você:</strong> ${texto}</p>`;

    const resposta = responder(texto);

    output.innerHTML += `<p><strong>Orion:</strong> ${resposta}</p>`;
    falar(resposta);

    status.innerText = "Orion está com você.";
  };

  recognition.onerror = () => {
    status.innerText = "Não consegui ouvir. Tente novamente.";
  };
}
