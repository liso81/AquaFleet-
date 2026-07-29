export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método não permitido" });
  }

  const { clave } = req.body || {};
  const claveReal = process.env.ADMIN_PASSWORD;

  if (!claveReal) {
    return res.status(500).json({ ok: false, error: "Servidor não configurado" });
  }

  if (clave === claveReal) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: "Senha incorreta." });
}
