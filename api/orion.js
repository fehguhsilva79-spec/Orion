export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mensagem vazia" });
  }

  const response = `Entendi. Você disse: "${message}". Ainda estou despertando.`;

  res.status(200).json({ reply: response });
}
