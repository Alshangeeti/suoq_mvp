// Sends a WhatsApp OTP message via Meta's WhatsApp Cloud API.
// Until WHATSAPP_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID are configured in
// Vercel env vars, this runs in "test mode": it just logs the code and
// returns it in the API response so the login flow can be tested end to
// end without a real WhatsApp Business account.
async function sendWhatsAppOtp(phone, code) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log(`[TEST MODE] WhatsApp OTP for ${phone}: ${code}`);
    return { sent: false, testMode: true };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: `Souq Mauritania — رمز التحقق الخاص بك / votre code: ${code}` }
      })
    });
    if (!res.ok) {
      console.error("WhatsApp send failed:", await res.text());
      return { sent: false, testMode: false };
    }
    return { sent: true, testMode: false };
  } catch (e) {
    console.error("WhatsApp send error:", e);
    return { sent: false, testMode: false };
  }
}

module.exports = { sendWhatsAppOtp };
