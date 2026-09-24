// Webhook Stripe Serverless pour Vercel
// Écoute checkout.session.completed (paiement unique confirmé) :
//   1. journalise l'accès à vie du courriel client (Supabase / Notion si configurés)
//   2. envoie le courriel de bienvenue bilingue depuis info@cvavie.com (Resend)
//
// Configuration requise côté Stripe + Vercel :
//   - Endpoint Stripe : https://cvavie.com/api/stripe-webhook
//   - Événement : checkout.session.completed
//   - Secret : STRIPE_WEBHOOK_SECRET dans les variables d'environnement Vercel
//   - RESEND_API_KEY déjà configuré pour l'envoi depuis le domaine vérifié cvavie.com

import crypto from 'crypto';
import { normalizeEmail } from './_code.js';

export const config = {
  api: {
    bodyParser: false, // Permet la vérification de signature sur le flux brut
  },
};

const SITE_URL = 'https://cvavie.com';

async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function buildWelcomeEmail(email, lang) {
  const isEn = lang === 'en';
  const safeEmail = escapeHtml(email);
  const dashboardUrl = `${SITE_URL}/?paid=true&email=${encodeURIComponent(email)}&start=builder`;

  const subject = isEn
    ? 'Your CVavie.com lifetime access is activated! 🚀'
    : 'Votre accès à vie CVavie.com est activé ! 🚀';

  const html = `
  <div style="margin:0;padding:36px 16px;background:#090B10;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#131722;border:1px solid #232D3F;border-radius:22px;overflow:hidden;">
      <div style="padding:28px 36px 0;text-align:center;">
        <p style="margin:0;color:#A29BFE;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;">CVavie.com ✦</p>
        <h1 style="margin:12px 0 4px;color:#FFFFFF;font-size:24px;line-height:1.3;font-weight:800;">
          ${isEn ? 'Welcome — your lifetime access is active!' : 'Bienvenue — votre accès à vie est activé !'}
        </h1>
      </div>
      <div style="padding:20px 36px 36px;color:#CBD5E1;font-size:14.5px;line-height:1.7;">
        <p style="margin:0 0 16px;">Bonjour / Hello,</p>
        <p style="margin:0 0 4px;">Merci pour votre confiance ! Votre paiement unique de <strong style="color:#2DD4BF;">23,99&nbsp;$</strong> a été traité avec succès.</p>
        <p style="margin:0 0 22px;color:#94A3B8;">Thank you for your trust! Your one-time payment of <strong style="color:#2DD4BF;">$23.99</strong> has been successfully processed.</p>

        <p style="margin:0 0 10px;font-weight:700;color:#E2E8F0;">Ce qui est inclus dans votre accès à vie / What’s included in your lifetime access :</p>
        <ul style="margin:0 0 22px;padding-left:20px;">
          <li style="margin-bottom:7px;">📄 8 modèles de CV optimisés pour les normes canadiennes et les filtres ATS.</li>
          <li style="margin-bottom:7px;">✉️ 4 structures de lettres de présentation professionnelles assorties.</li>
          <li style="margin-bottom:7px;">🤖 Génération et optimisation bilingues illimitées propulsées par notre IA.</li>
          <li>🛑 Aucun abonnement. Plus jamais rien à payer. <span style="color:#94A3B8;">/ No subscription. Nothing to pay, ever again.</span></li>
        </ul>

        <p style="margin:0 0 4px;font-weight:700;color:#E2E8F0;">Prêt à commencer ? / Ready to start?</p>
        <p style="margin:0 0 18px;color:#94A3B8;">Cliquez ici pour vous connecter à votre espace et créer votre dossier de candidature parfait :<br>Click here to open your workspace and build your perfect application:</p>
        <p style="margin:0 0 26px;text-align:center;">
          <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#9D4EDD 0%,#7C3AED 100%);color:#FFFFFF;text-decoration:none;font-weight:800;font-size:14.5px;padding:14px 30px;border-radius:999px;">Créer mon CV &amp; ma Lettre / Create my Resume &amp; Cover Letter</a>
        </p>

        <p style="margin:0 0 4px;color:#94A3B8;font-size:13px;">Si vous avez des questions, notre équipe est là pour vous aider à cette adresse : <a href="mailto:info@cvavie.com" style="color:#A29BFE;text-decoration:none;font-weight:700;">info@cvavie.com</a>.</p>
        <p style="margin:0 0 24px;color:#64748B;font-size:12px;">Votre accès est rattaché à <strong style="color:#94A3B8;">${safeEmail}</strong> / Your access is linked to this email address.</p>

        <p style="margin:0;color:#E2E8F0;font-weight:700;">L’équipe CVavie.com</p>
        <p style="margin:4px 0 0;color:#A29BFE;font-size:13px;font-weight:600;">Créez. Décidez. Optimisez avec l’IA à vie !</p>
      </div>
    </div>
  </div>`;

  return { subject, html };
}

async function sendWelcomeEmail(email, lang) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('[Stripe Webhook] RESEND_API_KEY manquant — courriel de bienvenue non envoyé.');
    return 'not_configured';
  }

  const { subject, html } = buildWelcomeEmail(email, lang);

  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'CVavie <info@cvavie.com>',
      reply_to: 'info@cvavie.com',
      to: [email],
      subject,
      html
    })
  });

  if (!sendRes.ok) {
    const errText = await sendRes.text();
    console.error('[Stripe Webhook] Échec envoi courriel de bienvenue:', sendRes.status, errText);
    return 'send_failed';
  }
  return 'sent';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event = null;

  try {
    const rawBody = await getRawBody(req);

    if (webhookSecret) {
      const sig = req.headers['stripe-signature'];
      if (!sig) {
        return res.status(400).json({ error: 'En-tête stripe-signature manquant.' });
      }

      // Extraction du timestamp et des signatures
      const parts = sig.split(',').reduce((acc, part) => {
        const [k, v] = part.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {});

      const timestamp = parts.t;
      const expectedSig = parts.v1;

      if (!timestamp || !expectedSig) {
        return res.status(400).json({ error: 'Format de signature Stripe invalide.' });
      }

      // Calcul HMAC SHA256
      const payload = `${timestamp}.${rawBody.toString('utf8')}`;
      const hmac = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedSig, 'hex'))) {
        return res.status(400).json({ error: 'Signature Stripe invalide.' });
      }

      event = JSON.parse(rawBody.toString('utf8'));
    } else {
      // Mode développement / test sans secret de webhook
      event = JSON.parse(rawBody.toString('utf8'));
    }

    const eventType = event?.type;
    console.log(`[Stripe Webhook] Événement reçu : ${eventType}`);

    let customerEmail = null;
    let sessionLang = 'fr';
    let shouldSendWelcome = false;

    if (eventType === 'checkout.session.completed') {
      const session = event.data?.object;
      customerEmail = session?.customer_details?.email || session?.customer_email;
      sessionLang = String(session?.locale || '').toLowerCase().startsWith('en') ? 'en' : 'fr';
      // Courriel de bienvenue uniquement pour le paiement unique confirmé.
      // charge.succeeded est conservé pour la journalisation, sans renvoyer de courriel.
      shouldSendWelcome = session?.payment_status === 'paid' && session?.mode === 'payment';
    } else if (eventType === 'charge.succeeded') {
      const charge = event.data?.object;
      customerEmail = charge?.billing_details?.email || charge?.receipt_email;
    }

    if (customerEmail) {
      const normalizedEmail = normalizeEmail(customerEmail);
      console.log(`[Stripe Webhook] Paiement de 23,99 $ validé pour : ${normalizedEmail}`);

      // 1. Sauvegarde dans Supabase si présent
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/customers`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            email: normalizedEmail,
            paid: true,
            plan: 'lifetime_2399',
            updated_at: new Date().toISOString()
          })
        });
      }

      // 2. Sauvegarde dans Notion si configuré
      const notionToken = process.env.NOTION_TOKEN;
      const notionDatabaseId = process.env.NOTION_DATABASE_ID;
      if (notionToken && notionDatabaseId) {
        await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            parent: { database_id: notionDatabaseId },
            properties: {
              Email: { title: [{ text: { content: normalizedEmail } }] },
              Statut: { select: { name: 'Payé_À_Vie' } },
              Date: { date: { start: new Date().toISOString() } }
            }
          })
        });
      }

      // 3. Courriel de bienvenue officiel (info@cvavie.com via Resend)
      let welcomeEmail = 'skipped';
      if (shouldSendWelcome) {
        welcomeEmail = await sendWelcomeEmail(normalizedEmail, sessionLang);
        console.log(`[Stripe Webhook] Courriel de bienvenue : ${welcomeEmail} → ${normalizedEmail}`);
      }

      return res.status(200).json({ received: true, email: normalizedEmail, status: 'paid', welcomeEmail });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Erreur de traitement:', err);
    return res.status(400).json({ error: `Erreur webhook: ${err.message}` });
  }
}
