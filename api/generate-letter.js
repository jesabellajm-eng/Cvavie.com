// API Serverless Vercel : Génération de LETTRE DE PRÉSENTATION par Gemini 2.5 Flash
// Structure JSON stricte fournie par la fondatrice (date_et_lieu, destinataire,
// objet, salutation, corps_lettre en 4 paragraphes, formule_politesse, signature).
// Normes canadiennes et québécoises.

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
// STRUCTURE JSON STRICTE — LETTRE (version fondatrice, validée)
// ═══════════════════════════════════════════════════════════════════════════
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    date_et_lieu: { type: 'STRING', description: 'Ex: Warwick, QC, le 24 septembre 2026' },
    destinataire: {
      type: 'OBJECT',
      properties: {
        nom_recruteur: { type: 'STRING' },
        nom_entreprise: { type: 'STRING' },
        adresse_entreprise: { type: 'STRING', description: 'Ville, Province uniquement' }
      },
      required: ['nom_recruteur', 'nom_entreprise']
    },
    objet: { type: 'STRING', description: 'Ex: Objet : Candidature pour le poste de [titre]' },
    salutation: { type: 'STRING' },
    corps_lettre: {
      type: 'OBJECT',
      properties: {
        paragraphe_accroche: { type: 'STRING' },
        paragraphe_entreprise: { type: 'STRING' },
        paragraphe_candidat: { type: 'STRING' },
        paragraphe_conclusion: { type: 'STRING' }
      },
      required: ['paragraphe_accroche', 'paragraphe_entreprise', 'paragraphe_candidat', 'paragraphe_conclusion']
    },
    formule_politesse: { type: 'STRING' },
    signature_prenom_nom: { type: 'STRING' }
  },
  required: ['date_et_lieu', 'destinataire', 'objet', 'salutation', 'corps_lettre', 'formule_politesse', 'signature_prenom_nom']
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const { cvData = null, letterDraft = {}, jobTarget = '', lang = 'fr' } = req.body || {};
  if (!cvData || typeof cvData !== 'object') {
    return res.status(400).json({ error: 'Données du CV manquantes — la lettre s\'appuie sur le CV.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Clé Gemini non configurée.', code: 'NO_API_KEY' });
  }

  const today = new Date().toLocaleDateString(lang === 'en' ? 'en-CA' : 'fr-CA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const userContent = [
    `Indice de langue (interface utilisateur) : ${lang === 'en' ? 'anglais' : 'français'} — mais la langue réellement détectée dans les données de l'utilisateur prime toujours.`,
    `Date du jour : ${today}.`,
    jobTarget ? `Poste visé : ${jobTarget}.` : '',
    letterDraft.recipientCompany ? `Entreprise cible : ${letterDraft.recipientCompany}.` : '',
    letterDraft.recipientName ? `Destinataire : ${letterDraft.recipientName}.` : '',
    letterDraft.notes ? `Notes de l'utilisateur pour la lettre : ${letterDraft.notes}` : '',
    `\nCV du candidat (source des réalisations à valoriser) :\n${JSON.stringify(cvData, null, 2)}`
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userContent }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 3000,
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

    let letter;
    try {
      letter = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) return res.status(502).json({ error: 'JSON invalide reçu de l\'IA.', code: 'BAD_JSON' });
      letter = JSON.parse(match[0]);
    }

    return res.status(200).json({ success: true, letter });
  } catch (err) {
    console.error('Erreur API generate-letter:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la génération.', code: 'SERVER_ERROR' });
  }
}
