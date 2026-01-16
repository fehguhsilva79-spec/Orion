function falar(texto) {
  if (!('speechSynthesis' in window)) {
    console.log("Speech Synthesis não suportado");
    return;
  }

  // Cancela qualquer fala anterior
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Garante que as vozes estejam carregadas
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    utterance.voice = voices.find(v => v.lang === "pt-BR") || voices[0];
  }

  speechSynthesis.speak(utterance);
}
