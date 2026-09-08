// API Serverless pour Vercel / Netlify : Optimisation de texte par IA
// Prompt système officiel configuré selon les exigences du projet.

export default async function handler(req, res) {
  // En-têtes CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const { text = '', type = 'experience' } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Texte manquant ou vide.' });
  }

  const systemPrompt = `Agis comme un coach de carrière et un expert en recrutement. Prends le texte fourni par l'utilisateur et réécris-le dans un langage corporatif, hautement professionnel, formel et percutant pour le marché de l'emploi. Utilise des verbes d'action au début des phrases. Optimise la structure pour qu'elle passe les robots de tri de CV (ATS). Ne renvoie AUCUNE introduction ni conclusion, retourne UNIQUEMENT le texte corrigé et prêt à être inséré.`;

  try {
    // 1. Connexion à l'API Gemini si la clé d'environnement est présente
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nTexte à optimiser (${type}) :\n${text}` }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const optimizedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (optimizedText) {
          return res.status(200).json({ success: true, optimizedText });
        }
      }
    }

    // 2. Connexion OpenAI de secours si configurée
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        const optimizedText = data?.choices?.[0]?.message?.content?.trim();
        if (optimizedText) {
          return res.status(200).json({ success: true, optimizedText });
        }
      }
    }

    // 3. Fallback intelligent haute fidélité (si aucune clé API externe n'est encore configurée dans Vercel)
    const fallbackOptimized = enhanceTextFallback(text, type);
    return res.status(200).json({ success: true, optimizedText: fallbackOptimized, isFallback: true });

  } catch (err) {
    console.error('Erreur API IA:', err);
    const fallbackOptimized = enhanceTextFallback(text, type);
    return res.status(200).json({ success: true, optimizedText: fallbackOptimized, isFallback: true });
  }
}

function enhanceTextFallback(text, type) {
  const rawLines = text.split('\n').map(l => l.trim().replace(/^[-•*–—]\s*/, '')).filter(Boolean);
  
  if (type === 'summary') {
    return text
      .replace(/\b(je suis|j'ai|je fais)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, c => c.toUpperCase());
  }

  const actionVerbs = [
    'Pilotage et optimisation',
    'Conception et déploiement',
    'Gestion proactive et coordination',
    'Restructuration des processus clés',
    'Négociation stratégique et valorisation',
    'Supervision opérationnelle'
  ];

  return rawLines.map((line, idx) => {
    const verb = actionVerbs[idx % actionVerbs.length];
    const cleaned = line.charAt(0).toLowerCase() + line.slice(1);
    return `• ${verb} : ${cleaned}`;
  }).join('\n');
}
