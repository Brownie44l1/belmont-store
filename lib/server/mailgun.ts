import "server-only";

type ConfirmationItem = {
  name: string;
  unit_price_cents: number;
  quantity: number;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[character] ?? character)
  );
}

export async function sendOrderConfirmation(
  recipient: string,
  orderId: string,
  totalCents: number,
  items: ConfirmationItem[]
) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL;
  if (!apiKey || !domain || !fromEmail)
    throw new Error("Mailgun is not configured.");

  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e4e4dc">${escapeHtml(
        item.name
      )} × ${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #e4e4dc;text-align:right">${formatPrice(
        item.unit_price_cents * item.quantity
      )}</td>
    </tr>`
    )
    .join("");
  const html = `
    <div style="max-width:600px;margin:0 auto;padding:32px 24px;color:#202724;font-family:Arial,sans-serif">
      <p style="color:#df623c;font-size:12px;font-weight:bold;letter-spacing:1px">BELMONT TECHNOLOGIES</p>
      <h1 style="font-family:Georgia,serif;font-weight:normal">Order received</h1>
      <p>Thank you. Your order <strong>${escapeHtml(
        orderId
      )}</strong> has been saved.</p>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
      <p style="padding-top:12px;text-align:right"><strong>Total: ${formatPrice(
        totalCents
      )}</strong></p>
      <p style="color:#747a72;font-size:13px;line-height:1.6">We will contact you to arrange software delivery or hardware collection.</p>
    </div>`;

  const form = new FormData();
  form.set("from", fromEmail);
  form.set("to", recipient);
  form.set("subject", `Belmont order confirmation ${orderId.slice(0, 8)}`);
  form.set("html", html);

  const response = await fetch(
    `https://api.mailgun.net/v3/${encodeURIComponent(domain)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString(
          "base64"
        )}`,
      },
      body: form,
    }
  );
  if (!response.ok) throw new Error(`Mailgun returned ${response.status}.`);
}

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}
