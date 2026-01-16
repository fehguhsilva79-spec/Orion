export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mensagem vazia" });
  }

  // Lista de respostas pré-programadas
  const respostas = [
    `Interessante! Você disse: "${message}".`,
    `Entendi, "${message}". Continue...`,
    `Hmm... "${message}" parece importante.`,
    `Certo, "${message}". Estou pensando sobre isso.`,
    `"${message}" registrado. Vamos em frente.`
  ];

  // Escolhe uma resposta aleatória
  const respostaAleatoria = respostas[Math.floor(Math.random() * respostas.length)];

  res.status(200).json({ reply: respostaAleatoria });
}
