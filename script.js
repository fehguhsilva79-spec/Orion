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
// VOZ (FALA)
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
// USUÁRIO / PLANO / IA
// ==========================
const userKey = "orion_user";

function userInicial() {
  return {
    plano: "free", // free | premium
    iaUsoHoje: 0,
    ultimoUso: new Date().toDateString()
  };
}

function carregarUser() {
  let user = JSON.parse(localStorage.getItem(userKey)) || userInicial();

  // reset diário simples
  if (user.ultimoUso !== new Date().toDateString()) {
    user.iaUsoHoje = 0;
    user.ultimoUso = new Date().toDateString();
    salvarUser(user);
  }

  return user;
}

function salvarUser(u) {
  localStorage.setItem(userKey, JSON.stringify(u));
}

function podeUsarIA(user) {
  if (user.plano === "premium") return true;

  if (user.iaUsoHoje < 3) {
    user.iaUsoHoje++;
    salvarUser(user);
    return true;
  }

  return false;
}

// ==========================
// VIDA DO USUÁRIO
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
// HISTÓRICO POR TEMA
// ==========================
function mostrarHistorico(tema) {
  const vida = carregarVida();
  output.innerHTML = "";

  registrar("Orion", `Tema: ${tema}`);

  const historico = vida.temas[tema];

  if (!historico || historico.length === 0) {
    const msg = "Ainda não há nada registrado aqui. Podemos começar agora.";
    registrar("Orion", msg);
    falar(msg);
    return;
  }

  historico.forEach(reg => {
    registrar("Você", reg.texto);
  });

  const msg = "Esse é o caminho que você já percorreu aqui. O que mudou desde a última vez?";
  registrar("Orion", msg);
  falar(msg);
}

// ==========================
// INTERFACE → TEMA
// ==========================
temasBtns.forEach(btn => {
  btn.onclick = () => {
    const vida = carregarVida();

    temasBtns.forEach(b => b.classList.remove("ativo"));
    btn.classList.add("ativo");

    vida.temaAtual = btn.dataset.tema;
    salvarVida(vida);

    mostrarHistorico(vida.temaAtual);
  };
});

// ==========================
// UTILIDADES
// ==========================
function registrar(autor, texto) {
  output.innerHTML += `<strong>${autor}:</strong> ${texto}<br><br>`;
  output.scrollTop = output.scrollHeight;
}

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
// ESTADO DE CONVERSA
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
// RESPOSTAS (ABSTRAÇÃO)
// ==========================
function gerarResposta(textoUsuario) {
  const user = carregarUser();

  if (podeUsarIA(user)) {
    return respostaComIA(textoUsuario);
  }

  return respostaLocal(textoUsuario);
}

// ==========================
// MOTOR LOCAL (ATUAL)
// ==========================
function respostaLocal(textoUsuario) {
  let estado = carregarEstado();
  let vida = carregarVida();
  let resposta = "";

  if (!vida.temaAtual) {
    vida.temaAtual = detectarTema(textoUsuario);
  }

  if (estado.fase === 1) {
    resposta = "Estou aqui com você. Quer continuar algo que já estava pensando ou começar algo novo?";
    estado.fase = 2;
  } else if (estado.fase === 2) {
    const jaExiste = vida.temas[vida.temaAtual].length > 0;

    resposta = jaExiste
      ? `Você já falou antes sobre ${vida.temaAtual}. O que mudou desde então?`
      : `Vamos organizar isso dentro de ${vida.temaAtual}. O que mais pesa agora?`;

    estado.fase = 3;
  } else if (estado.fase === 3) {
    resposta = "O que nessa situação depende de você — e o que não depende?";
    estado.fase = 4;
  } else if (estado.fase === 4) {
    resposta = "Agir agora, esperar ou mudar o foco. Qual faz mais sentido hoje?";
    estado.fase = 5;
  } else {
    resposta = "Isso fica guardado. Quando quiser continuar, estarei aqui.";

    estado = estadoInicial();
    vida.temaAtual = null;
    temasBtns.forEach(b => b.classList.remove("ativo"));
  }

  if (vida.temaAtual) {
    vida.temas[vida.temaAtual].push({
      texto: textoUsuario,
      data: new Date().toISOString()
    });
  }

  salvarVida(vida);
  salvarEstado(estado);
  return resposta;
}

// ==========================
// STUB DE IA (FUTURA)
// ==========================
function respostaComIA(textoUsuario) {
  return "Estou refletindo sobre isso com você. Me conte um pouco mais.";
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

  micBtn.onclick = () => {
    if (ouvindo) return;
    ouvindo = true;
    status.innerText = "Orion está ouvindo...";
    recognition.start();
  };

  recognition.onresult = (event) => {
    ouvindo = false;

    const texto = event.results[0][0].transcript;
    registrar("Você", texto);

    const resposta = gerarResposta(texto);
    registrar("Orion", resposta);
    falar(resposta);

    status.innerText = "Orion permanece com você.";
  };

  recognition.onerror = () => {
    ouvindo = false;
    status.innerText = "Não consegui ouvir.";
  };

  recognition.onend = () => {
    ouvindo = false;
  };
}
