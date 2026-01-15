// Seleciona os elementos do HTML pelos IDs que existem
const button = document.getElementById("mic-btn");
const statusEl = document.getElementById("status");
const output = document.getElementById("output");

// Função para enviar a mensagem para o backend
async function sendToOrion(text) {
  statusEl.textContent = "Orion está pensando...";

  try {
    const response = await fetch("/api/orion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await response.json();
    output.textContent = data.reply;
    statusEl.textContent = "Orion está ouvindo";
  } catch (err) {
    output.textContent = "Erro de conexão com o Orion.";
    statusEl.textContent = "Erro";
    console.error(err);
  }
}

// Evento do botão
button.addEventListener("click", () => {
  const userText = prompt("Digite algo para o Orion:");
  if (userText) {
    sendToOrion(userText);
  }
});
