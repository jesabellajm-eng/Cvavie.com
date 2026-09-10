// API Serverless pour Vercel : Export PDF texte réel (100 % compatible ATS)
// Reçoit le HTML de la feuille CV déjà rendue côté navigateur, l'injecte dans
// une page dédiée avec les CSS du site, la fait imprimer par Chromium en vrai
// texte, puis renvoie le PDF en téléchargement direct.

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const { html = '', filename = 'mon-cv', lang = 'fr' } = req.body || {};

  if (!html || typeof html !== 'string' || html.length < 50) {
    return res.status(400).json({ error: 'Contenu du CV manquant.' });
  }

  // Garde-fou : on n'imprime jamais autre chose que la feuille du CV.
  if (!html.includes('resume-sheet') && !html.includes('resume-page') && !html.includes('class="resume')) {
    return res.status(400).json({ error: 'Contenu invalide : feuille de CV attendue.' });
  }

  // Taille max raisonnable (~1,5 Mo de HTML)
  if (html.length > 1_500_000) {
    return res.status(413).json({ error: 'CV trop volumineux.' });
  }

  const safeName = String(filename)
    .replace(/[^a-zA-ZÀ-ÿ0-9\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'mon-cv';

  const origin = `https://${req.headers.host || 'cvavie.com'}`;

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 816, height: 1056 },
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });

    const page = await browser.newPage();

    const documentHtml = [
      '<!DOCTYPE html><html lang="' + (lang === 'en' ? 'en' : 'fr') + '"><head><meta charset="utf-8">',
      '<title>' + safeName + '</title>',
      // Mêmes feuilles de style que le site pour une fidélité parfaite
      '<link rel="stylesheet" href="' + origin + '/style.css">',
      '<link rel="stylesheet" href="' + origin + '/restyle-v2.css">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">',
      '<style>',
      '@page{size:letter;margin:0}',
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      'html,body{margin:0;padding:0;background:#fff!important}',
      '.resume-sheet,.resume-page{width:8.5in!important;min-height:11in!important;margin:0 auto!important;box-shadow:none!important;transform:none!important}',
      '</style></head><body>',
      html,
      '</body></html>'
    ].join('\n');

    await page.setContent(documentHtml, { waitUntil: 'networkidle0', timeout: 25000 });

    // Laisser le temps aux polices de se charger complètement
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + safeName + '.pdf"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(pdf));
  } catch (err) {
    console.error('Erreur export PDF:', err);
    return res.status(500).json({
      error: lang === 'en'
        ? 'PDF export failed on the server. Please try again.'
        : 'Échec de l’export PDF côté serveur. Veuillez réessayer.'
    });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
