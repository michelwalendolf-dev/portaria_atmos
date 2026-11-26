import { sheet } from "../_lib/sheets.js";

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function onRequestPost({ request, env }) {
  try {
    return await tratar(request, env);
  } catch (e) {
    console.error(e);
    return json({ error: "Falha no servidor: " + String(e && e.message || e).slice(0, 100) }, 500);
  }
}

async function tratar(request, env) {
  let b; try { b = await request.json(); } catch { return json({ error: "Requisição inválida." }, 400); }
  if (b.count) {
    let erro;
    for (let t = 0; t < 2; t++) {
      try {
        return json(await sheet(env, { action: "count" }) || { error: "Planilha não configurada." });
      } catch (e) {
        erro = e;
        await new Promise(r => setTimeout(r, 500));
      }
    }
    console.error(erro);
    return json({ error: "Planilha indisponível: " + String(erro.message).slice(0, 100) }, 502);
  }
  const code = String(b.code || "").trim().toUpperCase();
  if (!/^(?:ATMOS|PULSE)-[0-9A-F]{5}-[0-9A-F]{5}$/.test(code)) return json({ status: "invalid" });
  try {
    return json(await sheet(env, { action: "checkin", code }) || { error: "Planilha não configurada." });
  } catch (e) {
    console.error(e);
    return json({ error: "Planilha indisponível: " + String(e.message).slice(0, 100) }, 502);
  }
}

// DIAGNÓSTICO TEMPORÁRIO: abra /api/checkin no navegador para ver a resposta crua da planilha. Apague depois.
export async function onRequestGet({ env }) {
  if (!env.SHEETS_URL) return json({ diag: "SHEETS_URL não configurada" });
  try {
    const r = await fetch(env.SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ token: env.SHEETS_TOKEN, action: "count" }),
      redirect: "follow"
    });
    const txt = await r.text();
    return json({ diag: true, http: r.status, tipo: r.headers.get("content-type"), corpo: txt.slice(0, 300) });
  } catch (e) {
    return json({ diag: true, falhou: String(e && e.message || e) });
  }
}