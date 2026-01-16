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
    tristeza: 0,
    ultimoTema: null
  };
}

function salvarMemoria(mem) {
  localStorage.setItem(MEM_KEY, JSON.stringify(mem));
}

// ==========================
// DETECÇÃO
// ==========================
function detectarTema(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("triste")) return "tristeza";

  return "geral";
}

// ==========================
// RESPOSTA EVOLUTIVA
// ==========================
function responder(textoUsuario) {
  const tema = detectarTema(textoUsuario);
  const mem = carregarMemoria();

  let resposta = "";

  if (tema === "tristeza") {
    mem.tristeza++;

    if (mem.tristeza === 1) {
      resposta = "Percebo tristeza na sua voz. Não precisa passar por isso sozinho. O que mais tem pesado hoje?";
    }

    else if (mem.tristeza === 2) {
      resposta = "Você voltou a esse sentimento. Isso indica que ele não foi embora. Ele vem mais do passado ou do presente?";
    }

    else {
      resposta = "Quando a tristeza insiste assim, ela deixa de ser um estado e vira um sinal. Antes de seguir, preciso te perguntar: você está tentando aguentar ou entender o que sente?";
    }
  }

  else {
    resposta = "Estou aqui. Fale no seu tempo. O que está mais vivo em você agora?";
  }

  mem.ultimoTema = tema;
  salvarMemoria(mem);

  return resposta;
}

// ==========================
// VOZ
// ==========================
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  status.innerText = "Reconhecimento de voz não suportado.";
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";

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
    status.innerText = "Erro ao ouvir. Tente novamente.";
  };
}
