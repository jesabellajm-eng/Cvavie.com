// Webhook Stripe Serverless pour Vercel
// Écoute les événements Stripe (checkout.session.completed, charge.succeeded)
// et enregistre l'adresse courriel du client comme 'paid: true' dans Supabase / Notion.

import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false, // Permet la vérification de signature sur le flux brut
  },
};

async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
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

    if (eventType === 'checkout.session.completed') {
      const session = event.data?.object;
      customerEmail = session?.customer_details?.email || session?.customer_email;
    } else if (eventType === 'charge.succeeded') {
      const charge = event.data?.object;
      customerEmail = charge?.billing_details?.email || charge?.receipt_email;
    }

    if (customerEmail) {
      const normalizedEmail = customerEmail.trim().toLowerCase();
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

      return res.status(200).json({ received: true, email: normalizedEmail, status: 'paid' });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Erreur de traitement:', err);
    return res.status(400).json({ error: `Erreur webhook: ${err.message}` });
  }
}
