export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/telegram-login") {
      if (request.method === "GET") {
        const configured = !!(
          env.TELEGRAM_BOT_TOKEN &&
          env.TELEGRAM_CHAT_ID
        );

        return new Response(
          JSON.stringify({ configured }),
          {
            status: configured ? 200 : 503,
            headers: {
              "content-type": "application/json; charset=UTF-8"
            }
          }
        );
      }

      if (request.method === "POST") {
        try {
          const body = await request.json();

          const token = env.TELEGRAM_BOT_TOKEN;
          const chatId = env.TELEGRAM_CHAT_ID;

          if (!token || !chatId) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: "Telegram secrets are not configured"
              }),
              {
                status: 503,
                headers: {
                  "content-type": "application/json; charset=UTF-8"
                }
              }
            );
          }

          const role =
            body.role === "manager"
              ? "المدير"
              : body.role === "accounting"
              ? "حسابات"
              : body.role === "viewer"
              ? "مشاهد"
              : "موظف";

          const event =
            body.event === "test"
              ? "🧪 اختبار Telegram — روزنا"
              : body.event === "login"
              ? "🔐 تسجيل دخول جديد — روزنا"
              : "🔔 تنبيه — روزنا";

          const text =
            event +
            "\n\n" +
            "الاسم: " +
            String(body.name || "") +
            "\n" +
            "البريد: " +
            String(body.email || "") +
            "\n" +
            "الدور: " +
            role +
            "\n" +
            "الوقت: " +
            String(body.time || "");

          const response = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json"
              },
              body: JSON.stringify({
                chat_id: chatId,
                text
              })
            }
          );

          const data = await response.json().catch(() => ({}));

          if (!response.ok || data.ok === false) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: data.description || "Telegram API error"
              }),
              {
                status: 502,
                headers: {
                  "content-type": "application/json; charset=UTF-8"
                }
              }
            );
          }

          return new Response(
            JSON.stringify({ ok: true }),
            {
              status: 200,
              headers: {
                "content-type": "application/json; charset=UTF-8"
              }
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: String(error)
            }),
            {
              status: 400,
              headers: {
                "content-type": "application/json; charset=UTF-8"
              }
            }
          );
        }
      }

      return new Response("Method Not Allowed", {
        status: 405
      });
    }

    return new Response("Not Found", {
      status: 404
    });
  }
};
