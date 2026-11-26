import { sheet } from "../_lib/sheets.js";

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch { return json({ error: "Requisição inválida." }, 400); }
  if (b.count) {
    try {
      return json(await sheet(env, { action: "count" }) || { error: "Planilha não configurada." });
    } catch (e) {
      console.error(e);
      return json({ error: "Planilha indisponível." }, 502);
    }
  }
  const code = String(b.code || "").trim().toUpperCase();
  if (!/^(?:ATMOS|PULSE)-[0-9A-F]{5}-[0-9A-F]{5}$/.test(code)) return json({ status: "invalid" });
  try {
    const d = await sheet(env, { action: "checkin", code });
    if (!d) return json({ error: "Planilha não configurada." });
    // o total sempre vem da contagem da planilha, não de quantas leituras foram feitas
    try {
      const c = await sheet(env, { action: "count" });
      if (c && typeof c.total === "number") d.total = c.total;
    } catch (e) { console.error(e); }
    return json(d);
  } catch (e) {
    console.error(e);
    return json({ error: "Planilha indisponível: " + String(e.message).slice(0, 100) }, 502);
  }
}