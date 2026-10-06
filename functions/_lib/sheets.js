export async function sheet(env, payload) {
  if (!env.SHEETS_URL) return null;
  const r = await fetch(env.SHEETS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token: env.SHEETS_TOKEN, ...payload }),
    redirect: "follow"
  });
  if (!r.ok) throw new Error("Planilha " + r.status);
  const d = await r.json();
  if (d.error) throw new Error("Planilha: " + d.error);
  return d;
}
