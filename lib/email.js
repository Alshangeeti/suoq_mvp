// Sends a login code by email via Resend (resend.com). Until RESEND_API_KEY
// is configured, runs in test mode: the code is returned to the UI so the
// flow stays testable — same pattern as the WhatsApp sender.
async function sendEmailOtp(email, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Souq Mauritania <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.OTP_TEST_MODE === "0") {
      return { sent: false, testMode: false, unavailable: true };
    }
    console.log(`[TEST MODE] Email OTP for ${email}: ${code}`);
    return { sent: false, testMode: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `${code} — رمز الدخول / code de connexion`,
        html: `<div dir="rtl" style="font-family:sans-serif"><h2>سوق موريتانيا</h2><p>رمز الدخول الخاص بك / votre code :</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p><p>صالح لمدة 5 دقائق.</p></div>`
      })
    });
    if (!res.ok) {
      console.error("Resend send failed:", await res.text());
      return { sent: false, testMode: false };
    }
    return { sent: true, testMode: false };
  } catch (e) {
    console.error("Resend error:", e);
    return { sent: false, testMode: false };
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

module.exports = { sendEmailOtp, isValidEmail };
