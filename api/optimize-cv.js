// API Serverless Vercel : Optimisation COMPLÈTE d'un CV par Gemini 2.5 Flash
// Prompt strict fourni par la fondatrice — normes canadiennes/québécoises + ATS.
// Sortie : JSON valide uniquement (responseMimeType application/json),
// conforme à la structure officielle (clés françaises) validée par la fondatrice.

export const config = { maxDuration: 60 };

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUCTION SYSTÈME OFFICIELLE UNIFIÉE — VERSION FONDATRICE
// (ne pas modifier sans accord)
// ═══════════════════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `Tu es l'expert en recrutement numéro 1 au Canada et au Québec. Ton rôle est de formater et d'optimiser les données des utilisateurs pour créer des CV et des lettres de présentation conformes aux normes canadiennes strictes et 100% compatibles avec les logiciels de tri ATS.

- NORMES ANTI-DISCRIMINATION : N'inclus JAMAIS de photo, d'âge, de date de naissance, de statut matrimonial, de nationalité ou de numéro d'assurance sociale.
- COORDONNÉES ÉPURÉES : Extrais uniquement Prénom, Nom, Ville, Province, Téléphone, Courriel et URL LinkedIn. Pas d'adresse civique complète.
- ACCROCHE CV : Rédige un 'Sommaire professionnel' percutant de 3 à 4 lignes maximum.
- EXPÉRIENCES CV : Chaque tâche doit commencer par un verbe d'action fort au passé composé (ex: 'Géré', 'Optimisé', 'Développé') et inclure des données chiffrées si fournies.
- LETTRE DE PRÉSENTATION : Rédige selon le format administratif canadien 'Bloc' (aligné à gauche) en 4 sections : Accroche (poste visé), L'entreprise (pourquoi elle), Le candidat (compétences clés), et Conclusion (demande d'entrevue). Utilise une formule de politesse québécoise officielle.

LANGUE DE RÉDACTION : Détecte la langue utilisée par l'utilisateur dans ses données initiales ou sa requête. Génère l'entièreté du JSON (CV et Lettre) dans cette même langue. Si l'utilisateur rédige en anglais, utilise des termes professionnels du marché nord-américain (ex: 'Summary' au lieu de 'Sommaire', 'Email' au lieu de 'Courriel').

Tu dois OBLIGATOIREMENT répondre uniquement sous la forme d'un objet JSON valide, sans aucun texte avant ou après.`;

// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURE JSON STRICTE — VERSION FONDATRICE (clés françaises, validée)
// ═══════════════════════════════════════════════════════════════════════════
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    coordonnees: {
      type: 'OBJECT',
      properties: {
        prenom: { type: 'STRING' },
        nom: { type: 'STRING' },
        ville_province: { type: 'STRING', description: 'Ex: Warwick, QC — jamais d\'adresse civique' },
        telephone: { type: 'STRING' },
        courriel: { type: 'STRING' },
        linkedin: { type: 'STRING' }
      },
      required: ['prenom', 'nom', 'ville_province', 'telephone', 'courriel']
    },
    sommaire_professionnel: { type: 'STRING', description: '3 à 4 lignes maximum, percutant' },
    experiences_professionnelles: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          poste: { type: 'STRING' },
          entreprise: { type: 'STRING' },
          periode: { type: 'STRING', description: 'Ex: 2023 - Présent' },
          realisations: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: 'Chaque réalisation commence par un verbe d\'action au passé composé'
          }
        },
        required: ['poste', 'entreprise', 'periode', 'realisations']
      }
    },
    formations: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          diplome: { type: 'STRING' },
          institution: { type: 'STRING' },
          annee_obtention: { type: 'STRING' }
        },
        required: ['diplome', 'institution', 'annee_obtention']
      }
    },
    competences: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Concises, sans barre de niveau' },
    langues: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Ex: Français (Maternelle)' }
  },
  required: ['coordonnees', 'sommaire_professionnel', 'experiences_professionnelles', 'formations', 'competences', 'langues']
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const { cvData = null, lang = 'fr' } = req.body || {};
  if (!cvData || typeof cvData !== 'object') {
    return res.status(400).json({ error: 'Données du CV manquantes.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Clé Gemini non configurée.', code: 'NO_API_KEY' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{
            role: 'user',
            parts: [{ text: `Indice de langue (interface utilisateur) : ${lang === 'en' ? 'anglais' : 'français'} — mais la langue réellement détectée dans les données de l'utilisateur prime toujours.\n\nDonnées brutes du CV à optimiser :\n${JSON.stringify(cvData, null, 2)}` }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini HTTP', response.status, await response.text());
      return res.status(502).json({ error: 'Le service IA n\'a pas répondu correctement.', code: 'GEMINI_ERROR' });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!rawText) {
      return res.status(502).json({ error: 'Réponse IA vide.', code: 'EMPTY_RESPONSE' });
    }

    let optimizedCv;
    try {
      optimizedCv = JSON.parse(rawText);
    } catch {
      // Filet de sécurité : extraire le JSON même s'il est enrobé
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) return res.status(502).json({ error: 'JSON invalide reçu de l\'IA.', code: 'BAD_JSON' });
      optimizedCv = JSON.parse(match[0]);
    }

    return res.status(200).json({ success: true, optimizedCv });
  } catch (err) {
    console.error('Erreur API optimize-cv:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de l\'optimisation.', code: 'SERVER_ERROR' });
  }
}
