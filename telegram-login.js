export async function onRequestGet(context) {
  const token = context.env.TELEGRAM_BOT_TOKEN;
  const chatId = context.env.TELEGRAM_CHAT_ID;
  return new Response(JSON.stringify({configured: !!(token && chatId)}), {
    status: token && chatId ? 200 : 503,
    headers: {"content-type":"application/json"}
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const token = context.env.TELEGRAM_BOT_TOKEN;
    const chatId = context.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return new Response("Telegram secrets are not configured", {status:503});

    const role = body.role==="manager" ? "المدير" : body.role==="accounting" ? "حسابات" : body.role==="viewer" ? "مشاهد" : "موظف";
    const event = body.event === "test" ? "🧪 اختبار Telegram — روزنا" : body.event === "login" ? "🔐 تسجيل دخول جديد — روزنا" : "🔔 تنبيه — روزنا";
    const text = event + "\n\n" + "الاسم: " + String(body.name || "") + "\n" + "البريد: " + String(body.email || "") + "\n" + "الدور: " + role + "\n" + "الوقت: " + String(body.time || "");
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:chatId,text})});
    const data = await r.json().catch(()=>({}));
    if (!r.ok || data.ok === false) return new Response(JSON.stringify({ok:false,error:data.description||"Telegram API error"}), {status:502,headers:{"content-type":"application/json"}});
    return new Response(JSON.stringify({ok:true}), {status:200,headers:{"content-type":"application/json"}});
  } catch (e) {
    return new Response(JSON.stringify({ok:false,error:String(e)}), {status:400,headers:{"content-type":"application/json"}});
  }
}
