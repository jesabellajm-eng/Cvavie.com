// API Serverless : envoi du code de connexion à 6 chiffres par courriel (Resend).
// Le code n'est envoyé QUE si le courriel possède déjà l'accès à vie (Stripe).

import { normalizeEmail, generateCode } from './_code.js';
import { checkPaid } from './_stripe.js';

function buildEmail(code, lang) {
  const fr = lang !== 'en';
  const subject = fr ? `Votre code de connexion CVavie : ${code}` : `Your CVavie login code: ${code}`;
  const html = `
  <div style="margin:0;padding:32px 16px;background:#090B10;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#131722;border:1px solid #232D3F;border-radius:20px;padding:36px;text-align:center;">
      <p style="margin:0 0 4px;color:#A29BFE;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">CVavie.com ✦</p>
      <h1 style="margin:8px 0 16px;color:#F1F5F9;font-size:22px;font-weight:700;">
        ${fr ? 'Votre code de connexion' : 'Your login code'}
      </h1>
      <p style="margin:0 0 24px;color:#94A3B8;font-size:14px;line-height:1.6;">
        ${fr
          ? 'Entrez ce code dans la fenêtre « Connexion / Accès client » pour réactiver votre accès à vie :'
          : 'Enter this code in the “Client Login / Access” window to restore your lifetime access:'}
      </p>
      <div style="margin:0 auto 24px;display:inline-block;background:#0E1420;border:2px solid #9D4EDD;border-radius:14px;padding:16px 36px;">
        <span style="color:#A29BFE;font-size:38px;font-weight:800;letter-spacing:.35em;font-family:'Courier New',monospace;">${code}</span>
      </div>
      <p style="margin:0 0 6px;color:#64748B;font-size:12px;line-height:1.6;">
        ${fr
          ? 'Ce code est valide environ 20 minutes. Si vous n\'avez pas demandé ce code, ignorez simplement ce courriel.'
          : 'This code is valid for about 20 minutes. If you did not request it, simply ignore this email.'}
      </p>
      <p style="margin:16px 0 0;color:#2DD4BF;font-size:12px;font-weight:600;">
        ${fr ? '✓ Paiement unique • Accès à vie • Zéro abonnement' : '✓ One-time payment • Lifetime access • Zero subscription'}
      </p>
    </div>
  </div>`;
  return { subject, html };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ sent: false, error: 'method_not_allowed' });

  const email = normalizeEmail(req.body?.email);
  const lang = req.body?.lang === 'en' ? 'en' : 'fr';

  if (!email || !email.includes('@')) {
    return res.status(400).json({ sent: false, error: 'invalid_email' });
  }

  try {
    // 1. On ne révèle jamais si un courriel existe ou non : on envoie le code
    //    seulement si l'accès à vie est confirmé, sinon on répond paid:false.
    const paid = await checkPaid(email);
    if (!paid) return res.status(200).json({ sent: false, paid: false });

    // 2. Envoi du code via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error('RESEND_API_KEY manquant — impossible d\'envoyer le code.');
      return res.status(200).json({ sent: false, paid: true, mailer: 'not_configured' });
    }

    const code = generateCode(email);
    const { subject, html } = buildEmail(code, lang);

    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'CVavie <info@cvavie.com>',
        to: [email],
        subject,
        html
      })
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error('Échec envoi Resend:', sendRes.status, errText);
      return res.status(200).json({ sent: false, paid: true, mailer: 'send_failed' });
    }

    return res.status(200).json({ sent: true, paid: true });
  } catch (err) {
    console.error('Erreur send-code:', err);
    return res.status(500).json({ sent: false, error: 'server_error' });
  }
}
