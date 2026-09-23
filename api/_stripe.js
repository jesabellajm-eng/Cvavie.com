// Helper partagé : vérification qu'un courriel possède l'accès à vie (paiement Stripe de 23,99 $+).

export async function checkPaid(normalizedEmail) {
  // Mode test : courriels listés dans TEST_PAID_EMAILS (Vercel env, séparés par des virgules)
  // Sautent la vérification Stripe — le code à 6 chiffres reste obligatoire pour se connecter,
  // donc aucun accès n'est possible sans accès à la boîte courriel correspondante.
  const testEmails = (process.env.TEST_PAID_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  if (testEmails.includes(normalizedEmail)) return true;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return false;

  const headers = { 'Authorization': `Bearer ${stripeSecretKey}` };

  // A) Sessions Checkout complétées pour ce courriel
  const sessionsRes = await fetch(`https://api.stripe.com/v1/checkout/sessions?customer_details[email]=${encodeURIComponent(normalizedEmail)}&status=complete&limit=5`, { headers });
  if (sessionsRes.ok) {
    const sessionsData = await sessionsRes.json();
    const paidSession = (sessionsData.data || []).find(s => s.payment_status === 'paid' && s.amount_total >= 2399);
    if (paidSession) return true;
  }

  // B) Client Stripe + paiements réussis
  const customerRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(normalizedEmail)}&limit=1`, { headers });
  if (customerRes.ok) {
    const customerData = await customerRes.json();
    const customer = customerData.data?.[0];
    if (customer) {
      const chargesRes = await fetch(`https://api.stripe.com/v1/charges?customer=${customer.id}&status=succeeded&limit=10`, { headers });
      if (chargesRes.ok) {
        const chargesData = await chargesRes.json();
        return (chargesData.data || []).some(charge => charge.paid && !charge.refunded && charge.amount >= 2399);
      }
    }
  }

  return false;
}
