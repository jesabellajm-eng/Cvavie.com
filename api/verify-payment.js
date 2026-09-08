// API Serverless pour Vercel : Vérification du statut de paiement d'un client
// Vérifie si le courriel fourni possède l'accès à vie (Stripe ou base de données Supabase/Notion).

const STRIPE_PRODUCT_ID = 'prod_VDoHe2ZDqntJFr';
const STRIPE_PRICE_ID = 'price_1UDMebKC1wvhHSf1dMPEPY67';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const email = (req.method === 'POST' ? req.body?.email : req.query?.email) || '';
  const normalizedEmail = String(email).trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return res.status(400).json({ paid: false, error: 'Courriel invalide.' });
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    // 1. Vérification directe via l'API Stripe
    if (stripeSecretKey) {
      // A) Recherche des sessions de paiement Checkout complétées pour ce client
      const sessionsRes = await fetch(`https://api.stripe.com/v1/checkout/sessions?customer_details[email]=${encodeURIComponent(normalizedEmail)}&status=complete&limit=5`, {
        headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
      });

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        const paidSession = (sessionsData.data || []).find(s => s.payment_status === 'paid' && s.amount_total >= 2399);
        if (paidSession) {
          return res.status(200).json({ paid: true, email: normalizedEmail, source: 'stripe_checkout', sessionId: paidSession.id });
        }
      }

      // B) Recherche par client Stripe et vérification des paiements
      const customerRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(normalizedEmail)}&limit=1`, {
        headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
      });

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        const customer = customerData.data?.[0];

        if (customer) {
          // Vérification des paiements réussis associés à ce client (23,99 $ = 2399 centimes)
          const chargesRes = await fetch(`https://api.stripe.com/v1/charges?customer=${customer.id}&status=succeeded&limit=10`, {
            headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
          });

          if (chargesRes.ok) {
            const chargesData = await chargesRes.json();
            const hasSuccessfulCharge = (chargesData.data || []).some(charge => 
              charge.paid && !charge.refunded && charge.amount >= 2399
            );
            if (hasSuccessfulCharge) {
              return res.status(200).json({ paid: true, email: normalizedEmail, source: 'stripe_charge' });
            }
          }
        }
      }
    }

    // 2. Vérification Supabase si configuré (SUPABASE_URL et SUPABASE_KEY)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (supabaseUrl && supabaseKey) {
      const dbRes = await fetch(`${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(normalizedEmail)}&select=paid,cv_data`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (dbRes.ok) {
        const rows = await dbRes.json();
        if (rows && rows.length > 0 && rows[0].paid) {
          return res.status(200).json({ paid: true, email: normalizedEmail, cvData: rows[0].cv_data, source: 'supabase' });
        }
      }
    }

    // Non trouvé comme payé
    return res.status(200).json({ paid: false, email: normalizedEmail });

  } catch (err) {
    console.error('Erreur lors de la vérification du paiement:', err);
    return res.status(500).json({ paid: false, error: 'Erreur serveur lors de la vérification.' });
  }
}
