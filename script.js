async function enviar() {
  const input = document.getElementById("userInput");
  const texto = input.value.trim();

  if (!texto) return;

  adicionarMensagem("Você", texto);
  input.value = "";

  adicionarMensagem("Orion", "Orion está ouvindo...");

  const respostasOrion = document.querySelectorAll(".orion");
  const ultimaResposta = respostasOrion[respostasOrion.length - 1];

  try {
    const response = await fetch("/api/orion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: texto })
    });

    const data = await response.json();
    ultimaResposta.innerText = "Orion: " + data.reply;
  } catch (erro) {
    ultimaResposta.innerText = "Orion: Houve um erro ao responder.";
  }
}

function adicionarMensagem(autor, texto) {
  const container = document.getElementById("response");

  const mensagem = document.createElement("div");
  mensagem.className = autor === "Orion" ? "orion" : "usuario";
  mensagem.innerText = `${autor}: ${texto}`;

  container.appendChild(mensagem);
  container.scrollTop = container.scrollHeight;
}
