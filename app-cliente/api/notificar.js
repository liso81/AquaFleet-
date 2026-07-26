export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { cantidadLitros, direccionTexto } = req.body || {};

    const resposta = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: "c7153a73-5046-4d50-8f4c-7f3ab4df77bb",
        filters: [{ field: "tag", key: "rol", relation: "=", value: "motorista" }],
        headings: { en: "Novo pedido de água" },
        contents: {
          en: `${((cantidadLitros || 0) / 1000).toLocaleString()} mil L${direccionTexto ? " — " + direccionTexto : ""}`,
        },
      }),
    });

    const data = await resposta.json();
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
