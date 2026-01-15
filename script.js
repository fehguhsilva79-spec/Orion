const statusEl = document.getElementById("status");
const button = document.getElementById("mic-btn");
const output = document.getElementById("output");

async function sendToOrion(text) {
  statusEl.textContent = "Orion está pensando...";
  
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
}

button.addEventListener("click", () => {
  const userText = prompt("Digite algo para o Orion:");
  if (userText) {
    sendToOrion(userText);
  }
});
