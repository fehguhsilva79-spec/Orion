const micButton = document.getElementById("micButton");
const textInput = document.getElementById("textInput");

let recognition;
let isRecording = false;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    textInput.value = transcript;
  };

  recognition.onerror = function (event) {
    alert("Erro no reconhecimento de voz: " + event.error);
  };

  recognition.onend = function () {
    isRecording = false;
    micButton.innerText = "🎤 Falar agora";
  };
} else {
  alert("Seu navegador não suporta reconhecimento de voz.");
}

micButton.addEventListener("click", () => {
  if (!recognition) return;

  if (!isRecording) {
    recognition.start();
    isRecording = true;
    micButton.innerText = "⏺️ Ouvindo...";
  } else {
    recognition.stop();
    isRecording = false;
    micButton.innerText = "🎤 Falar agora";
  }
});
