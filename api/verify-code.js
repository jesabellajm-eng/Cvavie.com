// API Serverless : validation du code de connexion à 6 chiffres.
// Si le code est bon, l'accès à vie du client est confirmé (et son CV cloud renvoyé si Supabase est configuré).

import { normalizeEmail, verifyCode } from './_code.js';
import { checkPaid } from './_stripe.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || '').trim();

  if (!email || !email.includes('@') || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ ok: false, error: 'invalid_input' });
  }

  try {
    // Petite pause anti force-brute (stateless, best effort)
    await new Promise(r => setTimeout(r, 600));

    if (!verifyCode(email, code)) {
      return res.status(200).json({ ok: false, error: 'wrong_code' });
    }

    // Ceinture + bretelles : on reconfirme le statut payé côté serveur
    const paid = await checkPaid(email);
    if (!paid) return res.status(200).json({ ok: false, error: 'not_paid' });

    // CV sauvegardé dans le cloud, si Supabase est configuré
    let cvData = null;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const dbRes = await fetch(`${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(email)}&select=cv_data`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        if (dbRes.ok) {
          const rows = await dbRes.json();
          if (rows?.[0]?.cv_data) cvData = rows[0].cv_data;
        }
      } catch { /* le cloud CV est optionnel */ }
    }

    return res.status(200).json({ ok: true, email, cvData });
  } catch (err) {
    console.error('Erreur verify-code:', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
