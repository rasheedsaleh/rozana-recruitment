export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const token = context.env.TELEGRAM_BOT_TOKEN;
    const chatId = context.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return new Response("Telegram secrets are not configured", {status:503});

    const role = body.role==="manager" ? "المدير" :
      body.role==="accounting" ? "حسابات" :
      body.role==="viewer" ? "مشاهد" : "موظف";

    const text =
      "🔐 تسجيل دخول جديد — روزنا\n\n" +
      "الاسم: " + String(body.name || "") + "\n" +
      "البريد: " + String(body.email || "") + "\n" +
      "الدور: " + role + "\n" +
      "الوقت: " + String(body.time || "");

    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({chat_id:chatId,text})
    });
    return new Response(r.ok ? "ok" : "telegram error",{status:r.ok?200:502});
  } catch {
    return new Response("bad request",{status:400});
  }
}