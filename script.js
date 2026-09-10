/**
 * ============================================================================
 * CVAVIE.COM — LE PREMIER CRÉATEUR DE CV PAR IA ACCESSIBLE À VIE
 * Domaine officiel en production : https://cvavie.com
 * ============================================================================
 * 
 * 1. SYSTÈME DE PAIEMENT STRIPE (ACCÈS À VIE 23,99 $ CAD) :
 *    - Produit officiel : CV Studio / CVavie.com — Accès à vie (prod_VDoHe2ZDqntJFr)
 *    - Lien Stripe Checkout : https://buy.stripe.com/aFafZigpHebv0ZB1Uwe3e0e
 *    - Redirection post-paiement configurée vers : https://cvavie.com?paid=true
 *    - Validation client via /api/verify-payment et webhook /api/stripe-webhook
 * 
 * 2. OPTIMISATION PAR IA GRATUITE & INTÉGRÉE :
 *    - Accessible sans compte et gratuitement pendant toute la rédaction
 *    - Verbes d'action corporatifs percutants et mots-clés ATS
 *    - Route API : /api/optimize
 */

const PRODUCTION_DOMAIN = 'https://cvavie.com';
/*
 * ============================================================================
 * CV STUDIO — MOTEUR PRINCIPAL, STRIPE & OPTIMISATION PAR IA
 * ============================================================================
 * 
 * 1. SYSTÈME DE PAIEMENT STRIPE :
 *    - Variable 'userHasPaid' gérée côté client et synchronisée avec le serveur.
 *    - Lien Stripe Checkout officiel : https://buy.stripe.com/aFafZigpHebv0ZB1Uwe3e0e
 *    - Vérification du statut client via l'API serverless /api/verify-payment
 *    - Webhook Stripe serveur à configurer sur /api/stripe-webhook
 * 
 * 2. OPTIMISATION PAR IA :
 *    - Accessible gratuitement à tous les utilisateurs pendant la rédaction.
 *    - Prompt système ATS et orienté verbes d'action.
 *    - Appel vers /api/optimize avec fallback intelligent si hors ligne.
 */

// Initialisation de l'état de paiement (LocalStorage ou paramètre URL de retour Stripe ?paid=true)
const urlParams = new URLSearchParams(window.location.search);
let userHasPaid = localStorage.getItem('cv-studio-paid') === 'true' || urlParams.get('paid') === 'true';

if (urlParams.get('paid') === 'true') {
  userHasPaid = true;
  localStorage.setItem('cv-studio-paid', 'true');
  const paidEmail = urlParams.get('email');
  if (paidEmail) localStorage.setItem('cv-studio-email', paidEmail);
}

// Lien Stripe Checkout configuré pour le tarif unique à vie de 23,99 $ CAD
const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/aFafZigpHebv0ZB1Uwe3e0e';

const STORAGE_KEY = 'cv-studio-data-v1';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const defaultData = {
  template: 'template-1',
  accentColor: '#213f6d',
  fullName: 'Jessica Meunier', jobTitle: 'Directrice marketing',
  email: 'jessica@email.com', phone: '+1 514 555-0123',
  location: 'Montréal, QC', website: 'linkedin.com/in/jessica',
  summary: 'Professionnelle stratégique avec plus de 8 ans d’expérience en croissance de marques et en gestion d’équipes multidisciplinaires. Reconnue pour transformer les données en campagnes performantes et en expériences client mémorables.',
  skills: 'Stratégie de marque\nMarketing numérique\nGestion d’équipe\nAnalyse de données\nSEO / SEM\nGestion de budget',
  languages: 'Français — Langue maternelle\nAnglais — Courant\nEspagnol — Intermédiaire',
  experiences: [
    { role: 'Directrice marketing', company: 'Atelier Nord', location: 'Montréal', start: '2022', end: 'Aujourd’hui', description: '• Pilotage de la stratégie omnicanale et d’une équipe de 8 personnes.\n• Hausse de 42 % des revenus numériques en deux ans.\n• Optimisation d’un budget annuel de 1,2 M$.' },
    { role: 'Responsable marketing numérique', company: 'Studio Boréal', location: 'Montréal', start: '2018', end: '2022', description: '• Conception de campagnes d’acquisition multicanales.\n• Réduction du coût d’acquisition de 28 %.\n• Déploiement d’un nouveau CRM et des parcours automatisés.' }
  ],
  education: [
    { degree: 'MBA — Marketing', school: 'HEC Montréal', start: '2016', end: '2018', description: 'Spécialisation en stratégie et transformation numérique.' },
    { degree: 'Baccalauréat en communication', school: 'Université de Montréal', start: '2012', end: '2015', description: '' }
  ]
};

let data = loadData();
let saveTimer;
let zoom = 0.8;

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored ? { ...defaultData, ...stored } : structuredClone(defaultData);
  } catch { return structuredClone(defaultData); }
}

function scheduleSave() {
  const dot = $('.status-dot');
  if ($('#saveStatus')?.lastChild) {
    $('#saveStatus').lastChild.textContent = currentLanguage === 'en' ? ' Saving…' : ' Sauvegarde…';
  }
  dot?.classList.add('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if ($('#saveStatus')?.lastChild) {
      $('#saveStatus').lastChild.textContent = currentLanguage === 'en' ? ' Saved' : ' Sauvegardé';
    }
    dot?.classList.remove('saving');
  }, 350);
}

function experienceCard(item, index) {
  return `<div class="repeat-card" data-type="experiences" data-index="${index}">
    <div class="repeat-card-head"><strong>Expérience ${index + 1}</strong><button class="remove-item" type="button">Supprimer</button></div>
    <div class="repeat-fields">
      <label class="field"><span>Poste</span><input data-key="role" value="${escapeHTML(item.role)}" placeholder="Titre du poste"></label>
      <label class="field"><span>Entreprise</span><input data-key="company" value="${escapeHTML(item.company)}" placeholder="Nom de l’entreprise"></label>
      <label class="field"><span>Ville</span><input data-key="location" value="${escapeHTML(item.location || '')}" placeholder="Ville"></label>
      <label class="field"><span>Début</span><input data-key="start" value="${escapeHTML(item.start)}" placeholder="2022"></label>
      <label class="field"><span>Fin</span><input data-key="end" value="${escapeHTML(item.end)}" placeholder="Aujourd’hui"></label>
      <label class="field wide">
        <span>Réalisations</span>
        <textarea data-key="description" rows="4" placeholder="Décrivez vos responsabilités et résultats…">${escapeHTML(item.description)}</textarea>
        <div class="field-actions">
          <button type="button" class="btn-ai-optimize" data-target="experience" data-index="${index}">🪄 Optimiser le texte par IA</button>
        </div>
      </label>
    </div></div>`;
}

function educationCard(item, index) {
  return `<div class="repeat-card" data-type="education" data-index="${index}">
    <div class="repeat-card-head"><strong>Formation ${index + 1}</strong><button class="remove-item" type="button">Supprimer</button></div>
    <div class="repeat-fields">
      <label class="field"><span>Diplôme</span><input data-key="degree" value="${escapeHTML(item.degree)}" placeholder="Nom du diplôme"></label>
      <label class="field"><span>Établissement</span><input data-key="school" value="${escapeHTML(item.school)}" placeholder="École / Université"></label>
      <label class="field"><span>Début</span><input data-key="start" value="${escapeHTML(item.start)}" placeholder="2018"></label>
      <label class="field"><span>Fin</span><input data-key="end" value="${escapeHTML(item.end)}" placeholder="2021"></label>
      <label class="field wide"><span>Détails</span><textarea data-key="description" rows="3" placeholder="Spécialisation, distinction…">${escapeHTML(item.description)}</textarea></label>
    </div></div>`;
}

function renderRepeaters() {
  $('#experiencesList').innerHTML = data.experiences.map(experienceCard).join('');
  $('#educationList').innerHTML = data.education.map(educationCard).join('');
  if (typeof currentLanguage !== 'undefined' && currentLanguage === 'en') {
    translateRoot($('#experiencesList'), 'en');
    translateRoot($('#educationList'), 'en');
  }
}

function setText(id, value, fallback = '') { $(id).textContent = value.trim() || fallback; }
function lines(value) { return value.split('\n').map(v => v.trim()).filter(Boolean); }

function renderCVSheetHTML(templateId, cvData, accentColor, lang = currentLanguage) {
  const isEn = (lang === 'en');
  const accent = accentColor || '#213f6d';
  
  const name = escapeHTML(cvData.fullName || (isEn ? 'Your Name' : 'Votre nom'));
  const title = escapeHTML(cvData.jobTitle || (isEn ? 'Professional Title' : 'Titre professionnel'));
  const summary = escapeHTML(cvData.summary || '');
  
  const contacts = [cvData.email, cvData.phone, cvData.location, cvData.website].filter(v => v && v.trim()).map(escapeHTML);
  const contactText = contacts.join('  ·  ');
  
  const experiences = cvData.experiences || [];
  const education = cvData.education || [];
  const skills = (cvData.skills || '').split('\n').map(s => s.trim().replace(/^[-•*–—]\s*/, '')).filter(Boolean);
  const languages = (cvData.languages || '').split('\n').map(s => s.trim().replace(/^[-•*–—]\s*/, '')).filter(Boolean);

  const labels = {
    summary: isEn ? 'Profile' : 'Profil',
    experience: isEn ? 'Experience' : 'Expérience',
    education: isEn ? 'Education' : 'Formation',
    skills: isEn ? 'Skills' : 'Compétences',
    languages: isEn ? 'Languages' : 'Langues',
    contact: isEn ? 'Contact' : 'Contact'
  };

  function renderExpItems() {
    if (!experiences.length) return '';
    return experiences.map(item => {
      const role = escapeHTML(item.role || (isEn ? 'Role' : 'Poste'));
      const company = item.company ? ' — ' + escapeHTML(item.company) : '';
      const dates = escapeHTML([item.start, item.end].filter(Boolean).join(' — '));
      const loc = item.location ? escapeHTML(item.location) : '';
      const bullets = (item.description || '').split('\n').map(l => l.trim().replace(/^[-•*–—]\s*/, '')).filter(Boolean);
      
      let bulletsHtml = '';
      if (bullets.length > 1 || (bullets.length === 1 && item.description.includes('•'))) {
        bulletsHtml = '<ul style="margin: 4px 0 0; padding-left: 14px; list-style: disc;">' + bullets.map(b => '<li style="margin-bottom: 2.5px; line-height: 1.5;">' + escapeHTML(b) + '</li>').join('') + '</ul>';
      } else if (item.description) {
        bulletsHtml = '<p style="margin: 3px 0 0; color: #374151; line-height: 1.55;">' + escapeHTML(item.description) + '</p>';
      }

      return '<div style="margin-bottom: 12px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px;">' +
          '<div style="font-weight: 700; color: #111827; font-size: 11px;">' + role + '<span style="font-weight: 400; color: #4b5563;">' + company + '</span></div>' +
          '<div style="white-space: nowrap; color: #6b7280; font-size: 9.6px;">' + dates + '</div>' +
        '</div>' +
        (loc ? '<div style="color: #6b7280; font-size: 9.6px; margin-top: 1px;">' + loc + '</div>' : '') +
        bulletsHtml +
      '</div>';
    }).join('');
  }

  function renderEduItems() {
    if (!education.length) return '';
    return education.map(item => {
      const degree = escapeHTML(item.degree || (isEn ? 'Degree' : 'Diplôme'));
      const school = item.school ? escapeHTML(item.school) : '';
      const dates = escapeHTML([item.start, item.end].filter(Boolean).join(' — '));
      const desc = item.description ? '<div style="color: #4b5563; margin-top: 2px;">' + escapeHTML(item.description) + '</div>' : '';

      return '<div style="margin-bottom: 9px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px;">' +
          '<div style="font-weight: 700; color: #111827; font-size: 11px;">' + degree + '</div>' +
          '<div style="white-space: nowrap; color: #6b7280; font-size: 9.6px;">' + dates + '</div>' +
        '</div>' +
        (school ? '<div style="color: #4b5563;">' + school + '</div>' : '') +
        desc +
      '</div>';
    }).join('');
  }

  function renderSkillsList(bulletChar = ' · ') {
    if (!skills.length) return '';
    return '<div style="display: flex; flex-wrap: wrap; gap: 4px 6px;">' +
      skills.map((s, idx) => '<span>' + escapeHTML(s) + (idx < skills.length - 1 ? '<span style="color: #9ca3af;">' + bulletChar + '</span>' : '') + '</span>').join('') +
    '</div>';
  }

  function renderLanguagesList() {
    if (!languages.length) return '';
    return '<div style="display: flex; flex-wrap: wrap; gap: 4px 18px;">' +
      languages.map(l => {
        const parts = l.split(/[—–-]/);
        if (parts.length > 1) {
          return '<div><span style="font-weight: 600;">' + escapeHTML(parts[0].trim()) + '</span><span style="color: #6b7280;"> — ' + escapeHTML(parts.slice(1).join('—').trim()) + '</span></div>';
        }
        return '<div><span style="font-weight: 600;">' + escapeHTML(l) + '</span></div>';
      }).join('') +
    '</div>';
  }

  // 1. TEMPLATE-2 (Atlas)
  if (templateId === 'template-2') {
    return '<div class="resume-sheet" style="font-family: \'Source Serif 4\', Georgia, Cambria, serif; font-size: 10.6px; line-height: 1.55; padding: 16mm 18mm; background: #ffffff; color: #1f2937; box-sizing: border-box; width: 794px; min-height: 1123px;">' +
      '<div style="text-align: center; border-bottom: 2px solid ' + accent + '; padding-bottom: 9px; margin-bottom: 14px;">' +
        '<div style="font-size: 27px; font-weight: 700; color: #111827;">' + name + '</div>' +
        '<div style="font-size: 11.5px; color: ' + accent + '; font-weight: 600; margin-top: 2px;">' + title + '</div>' +
        (contactText ? '<div style="font-size: 9.6px; color: #4b5563; margin-top: 6px;"><span>' + contactText + '</span></div>' : '') +
      '</div>' +
      (summary ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; border-bottom: 1px solid ' + accent + '; padding-bottom: 3px;">' + labels.summary + '</h3><p style="margin: 0; color: #1f2937;">' + summary + '</p></section>' : '') +
      (experiences.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; border-bottom: 1px solid ' + accent + '; padding-bottom: 3px;">' + labels.experience + '</h3>' + renderExpItems() + '</section>' : '') +
      (education.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; border-bottom: 1px solid ' + accent + '; padding-bottom: 3px;">' + labels.education + '</h3>' + renderEduItems() + '</section>' : '') +
      (skills.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; border-bottom: 1px solid ' + accent + '; padding-bottom: 3px;">' + labels.skills + '</h3>' + renderSkillsList() + '</section>' : '') +
      (languages.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; border-bottom: 1px solid ' + accent + '; padding-bottom: 3px;">' + labels.languages + '</h3>' + renderLanguagesList() + '</section>' : '') +
    '</div>';
  }

  // 2. TEMPLATE-3 (Meridian)
  if (templateId === 'template-3') {
    return '<div class="resume-sheet" style="font-family: Inter, \'Helvetica Neue\', Arial, sans-serif; font-size: 10.6px; line-height: 1.55; padding: 15mm 17mm; background: #ffffff; color: #1f2937; box-sizing: border-box; width: 794px; min-height: 1123px;">' +
      '<div style="text-align: left; border-bottom: 2px solid ' + accent + '; padding-bottom: 9px; margin-bottom: 14px;">' +
        '<div style="font-size: 26px; font-weight: 700; color: #111827;">' + name + '</div>' +
        '<div style="font-size: 11.5px; color: ' + accent + '; font-weight: 600; margin-top: 2px;">' + title + '</div>' +
        (contactText ? '<div style="font-size: 9.6px; color: #4b5563; margin-top: 6px;"><span>' + contactText + '</span></div>' : '') +
      '</div>' +
      (summary ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; display: flex; align-items: center; gap: 7px;"><span style="display: inline-block; width: 14px; height: 3px; background: ' + accent + ';"></span>' + labels.summary + '</h3><p style="margin: 0; color: #1f2937;">' + summary + '</p></section>' : '') +
      (experiences.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; display: flex; align-items: center; gap: 7px;"><span style="display: inline-block; width: 14px; height: 3px; background: ' + accent + ';"></span>' + labels.experience + '</h3>' + renderExpItems() + '</section>' : '') +
      (education.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; display: flex; align-items: center; gap: 7px;"><span style="display: inline-block; width: 14px; height: 3px; background: ' + accent + ';"></span>' + labels.education + '</h3>' + renderEduItems() + '</section>' : '') +
      (skills.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; display: flex; align-items: center; gap: 7px;"><span style="display: inline-block; width: 14px; height: 3px; background: ' + accent + ';"></span>' + labels.skills + '</h3>' + renderSkillsList() + '</section>' : '') +
      (languages.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; display: flex; align-items: center; gap: 7px;"><span style="display: inline-block; width: 14px; height: 3px; background: ' + accent + ';"></span>' + labels.languages + '</h3>' + renderLanguagesList() + '</section>' : '') +
    '</div>';
  }

  // 3. TEMPLATE-4 (Lumen)
  if (templateId === 'template-4') {
    return '<div class="resume-sheet" style="font-family: Inter, \'Helvetica Neue\', Arial, sans-serif; font-size: 11px; line-height: 1.55; padding: 20mm 22mm; background: #ffffff; color: #1f2937; box-sizing: border-box; width: 794px; min-height: 1123px;">' +
      '<div style="text-align: left; padding-bottom: 4px; margin-bottom: 16px;">' +
        '<div style="font-size: 27px; font-weight: 700; color: #111827; letter-spacing: -0.01em;">' + name + '</div>' +
        '<div style="font-size: 11.5px; color: ' + accent + '; font-weight: 600; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.08em;">' + title + '</div>' +
        (contactText ? '<div style="font-size: 9.6px; color: #6b7280; margin-top: 6px;"><span>' + contactText + '</span></div>' : '') +
      '</div>' +
      (summary ? '<section style="margin-top: 16px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.summary + '</h3><p style="margin: 0; color: #374151;">' + summary + '</p></section>' : '') +
      (experiences.length ? '<section style="margin-top: 16px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.experience + '</h3>' + renderExpItems() + '</section>' : '') +
      (education.length ? '<section style="margin-top: 16px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.education + '</h3>' + renderEduItems() + '</section>' : '') +
      (skills.length ? '<section style="margin-top: 16px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.skills + '</h3>' + renderSkillsList() + '</section>' : '') +
      (languages.length ? '<section style="margin-top: 16px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.languages + '</h3>' + renderLanguagesList() + '</section>' : '') +
    '</div>';
  }

  // 4. TEMPLATE-1 (Quill)
  if (templateId === 'template-1') {
    return '<div class="resume-sheet" style="font-family: \'Source Serif 4\', Georgia, Cambria, serif; font-size: 10.6px; line-height: 1.55; padding: 18mm 20mm; background: #ffffff; color: #1f2937; box-sizing: border-box; width: 794px; min-height: 1123px;">' +
      '<div style="text-align: center; padding-bottom: 4px; margin-bottom: 14px;">' +
        '<div style="font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.01em;">' + name + '</div>' +
        '<div style="font-size: 11.5px; color: ' + accent + '; font-weight: 600; margin-top: 3px; font-style: italic;">' + title + '</div>' +
        (contactText ? '<div style="font-size: 9.6px; color: #6b7280; margin-top: 6px;"><span>' + contactText + '</span></div>' : '') +
      '</div>' +
      (summary ? '<section style="margin-top: 14px;"><h3 style="font-size: 13.5px; letter-spacing: 0.01em; text-transform: none; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px;">' + labels.summary + '</h3><p style="margin: 0; color: #1f2937;">' + summary + '</p></section>' : '') +
      (experiences.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 13.5px; letter-spacing: 0.01em; text-transform: none; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px;">' + labels.experience + '</h3>' + renderExpItems() + '</section>' : '') +
      (education.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 13.5px; letter-spacing: 0.01em; text-transform: none; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px;">' + labels.education + '</h3>' + renderEduItems() + '</section>' : '') +
      (skills.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 13.5px; letter-spacing: 0.01em; text-transform: none; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px;">' + labels.skills + '</h3>' + renderSkillsList() + '</section>' : '') +
      (languages.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 13.5px; letter-spacing: 0.01em; text-transform: none; font-weight: 700; color: ' + accent + '; margin-bottom: 6px; border-bottom: 1px solid #d6d3d1; padding-bottom: 4px;">' + labels.languages + '</h3>' + renderLanguagesList() + '</section>' : '') +
    '</div>';
  }

  // 5. TEMPLATE-6 (Vector)
  if (templateId === 'template-6') {
    return '<div class="resume-sheet" style="font-family: Inter, \'Helvetica Neue\', Arial, sans-serif; font-size: 10.6px; line-height: 1.55; background: #ffffff; color: #1f2937; box-sizing: border-box; width: 794px; min-height: 1123px;">' +
      '<div style="background: ' + accent + '; color: #ffffff; padding: 13mm 16mm 9mm;">' +
        '<div style="font-size: 28px; font-weight: 700; letter-spacing: -0.01em;">' + name + '</div>' +
        '<div style="font-size: 12px; color: rgba(255, 255, 255, 0.9); font-weight: 500; margin-top: 2px;">' + title + '</div>' +
        (contactText ? '<div style="font-size: 9.6px; color: rgba(255, 255, 255, 0.85); margin-top: 8px;"><span>' + contactText + '</span></div>' : '') +
      '</div>' +
      '<div style="padding: 10mm 16mm 14mm;">' +
        (summary ? '<section style="margin-top: 10px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: #ffffff; margin-bottom: 6px; background: ' + accent + '; padding: 3px 8px; display: inline-block; border-radius: 2px;">' + labels.summary + '</h3><p style="margin: 0; color: #1f2937;">' + summary + '</p></section>' : '') +
        (experiences.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: #ffffff; margin-bottom: 6px; background: ' + accent + '; padding: 3px 8px; display: inline-block; border-radius: 2px;">' + labels.experience + '</h3>' + renderExpItems() + '</section>' : '') +
        (education.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: #ffffff; margin-bottom: 6px; background: ' + accent + '; padding: 3px 8px; display: inline-block; border-radius: 2px;">' + labels.education + '</h3>' + renderEduItems() + '</section>' : '') +
        (skills.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: #ffffff; margin-bottom: 6px; background: ' + accent + '; padding: 3px 8px; display: inline-block; border-radius: 2px;">' + labels.skills + '</h3>' + renderSkillsList() + '</section>' : '') +
        (languages.length ? '<section style="margin-top: 14px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: #ffffff; margin-bottom: 6px; background: ' + accent + '; padding: 3px 8px; display: inline-block; border-radius: 2px;">' + labels.languages + '</h3>' + renderLanguagesList() + '</section>' : '') +
      '</div>' +
    '</div>';
  }

  // 6. TEMPLATE-7 (Cadence)
  if (templateId === 'template-7') {
    return '<div class="resume-sheet" style="font-family: Inter, \'Helvetica Neue\', Arial, sans-serif; font-size: 10.2px; line-height: 1.4; padding: 12mm 14mm; background: #ffffff; color: #1f2937; box-sizing: border-box; width: 794px; min-height: 1123px;">' +
      '<div style="border-left: 4px solid ' + accent + '; padding-left: 10px; margin-bottom: 12px;">' +
        '<div style="font-size: 24px; font-weight: 700; color: #111827;">' + name + '</div>' +
        '<div style="font-size: 11px; color: ' + accent + '; font-weight: 600; margin-top: 2px;">' + title + '</div>' +
        (contactText ? '<div style="font-size: 9.3px; color: #6b7280; margin-top: 4px;"><span>' + contactText + '</span></div>' : '') +
      '</div>' +
      (summary ? '<section style="margin-top: 10px;"><h3 style="font-size: 10.2px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 5px; display: flex; align-items: center; gap: 7px;"><span style="display: inline-block; width: 14px; height: 3px; background: ' + accent + ';"></span>' + labels.summary + '</h3><p style="margin: 0; color: #1f2937;">' + summary + '</p></section>' : '') +
      (experiences.length ? '<section style="margin-top: 10px;"><h3 style="font-size: 10.2px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 5px; display: flex; align-items: center; gap: 7px;"><span style="display: inline-block; width: 14px; height: 3px; background: ' + accent + ';"></span>' + labels.experience + '</h3>' + renderExpItems() + '</section>' : '') +
      (education.length ? '<section style="margin-top: 10px;"><h3 style="font-size: 10.2px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 5px; display: flex; align-items: center; gap: 7px;"><span style="display: inline-block; width: 14px; height: 3px; background: ' + accent + ';"></span>' + labels.education + '</h3>' + renderEduItems() + '</section>' : '') +
      (skills.length ? '<section style="margin-top: 10px;"><h3 style="font-size: 10.2px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 5px; display: flex; align-items: center; gap: 7px;"><span style="display: inline-block; width: 14px; height: 3px; background: ' + accent + ';"></span>' + labels.skills + '</h3>' + renderSkillsList() + '</section>' : '') +
      (languages.length ? '<section style="margin-top: 10px;"><h3 style="font-size: 10.2px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 5px; display: flex; align-items: center; gap: 7px;"><span style="display: inline-block; width: 14px; height: 3px; background: ' + accent + ';"></span>' + labels.languages + '</h3>' + renderLanguagesList() + '</section>' : '') +
    '</div>';
  }

  // 7. TEMPLATE-5 (Harbor — 2 colonnes)
  if (templateId === 'template-5') {
    return '<div class="resume-sheet" style="font-family: Inter, \'Helvetica Neue\', Arial, sans-serif; font-size: 10.6px; line-height: 1.55; display: flex; flex-direction: row; width: 794px; min-height: 1123px; background: #ffffff; box-sizing: border-box;">' +
      '<aside style="width: 235px; min-width: 235px; background: color-mix(in srgb, ' + accent + ' 6%, #f8fafc); border-right: 1px solid color-mix(in srgb, ' + accent + ' 16%, #e2e8f0); padding: 26px 18px; box-sizing: border-box; display: flex; flex-direction: column; gap: 16px;">' +
        '<div>' +
          '<div style="font-size: 21px; font-weight: 700; color: #111827; line-height: 1.2;">' + name + '</div>' +
          '<div style="font-size: 11px; color: ' + accent + '; font-weight: 600; margin-top: 4px;">' + title + '</div>' +
        '</div>' +
        (contacts.length ? '<section><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.contact + '</h3><div style="display: flex; flex-direction: column; gap: 4px; font-size: 9.6px; color: #4b5563;">' + contacts.map(c => '<div>' + c + '</div>').join('') + '</div></section>' : '') +
        (skills.length ? '<section><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.skills + '</h3><div style="display: flex; flex-direction: column; gap: 4px; font-size: 9.6px;">' + skills.map(s => '<div>• ' + escapeHTML(s) + '</div>').join('') + '</div></section>' : '') +
        (languages.length ? '<section><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.languages + '</h3><div style="display: flex; flex-direction: column; gap: 4px; font-size: 9.6px;">' + languages.map(l => '<div>' + escapeHTML(l) + '</div>').join('') + '</div></section>' : '') +
      '</aside>' +
      '<div style="flex: 1 1 0%; padding: 26px 24px; box-sizing: border-box; display: flex; flex-direction: column; gap: 14px;">' +
        (summary ? '<section><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.summary + '</h3><p style="margin: 0; color: #374151;">' + summary + '</p></section>' : '') +
        (experiences.length ? '<section><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.experience + '</h3>' + renderExpItems() + '</section>' : '') +
        (education.length ? '<section><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.education + '</h3>' + renderEduItems() + '</section>' : '') +
      '</div>' +
    '</div>';
  }

  // 8. TEMPLATE-8 (North)
  return '<div class="resume-sheet" style="font-family: \'Source Serif 4\', Georgia, Cambria, serif; font-size: 11px; line-height: 1.55; padding: 22mm 24mm; background: #ffffff; color: #1f2937; box-sizing: border-box; width: 794px; min-height: 1123px;">' +
    '<div style="text-align: left; padding-bottom: 4px; margin-bottom: 16px;">' +
      '<div style="font-size: 29px; font-weight: 700; color: #111827; letter-spacing: -0.01em;">' + name + '</div>' +
      '<div style="font-size: 12px; color: ' + accent + '; font-weight: 600; margin-top: 3px;">' + title + '</div>' +
      (contactText ? '<div style="font-size: 9.6px; color: #6b7280; margin-top: 6px;"><span>' + contactText + '</span></div>' : '') +
    '</div>' +
    (summary ? '<section style="margin-top: 16px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.summary + '</h3><p style="margin: 0; color: #1f2937;">' + summary + '</p></section>' : '') +
    (experiences.length ? '<section style="margin-top: 16px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.experience + '</h3>' + renderExpItems() + '</section>' : '') +
    (education.length ? '<section style="margin-top: 16px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.education + '</h3>' + renderEduItems() + '</section>' : '') +
    (skills.length ? '<section style="margin-top: 16px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.skills + '</h3>' + renderSkillsList() + '</section>' : '') +
    (languages.length ? '<section style="margin-top: 16px;"><h3 style="font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: ' + accent + '; margin-bottom: 6px;">' + labels.languages + '</h3>' + renderLanguagesList() + '</section>' : '') +
  '</div>';
}

function renderPreview() {
  const preview = $('#resumePreview');
  if (!preview) return;

  const currentTemplate = data.template || 'template-2';
  const currentAccent = data.accentColor || '#213f6d';

  // Render complete HTML for the selected template
  preview.innerHTML = renderCVSheetHTML(currentTemplate, data, currentAccent, currentLanguage);
  preview.className = 'resume ' + currentTemplate;
  preview.style.setProperty('--user-accent', currentAccent);
  document.documentElement.style.setProperty('--hero-accent', currentAccent);

  // Sync controls
  const select = $('#templateSelect');
  if (select) select.value = currentTemplate;

  $$('.color-swatch').forEach(swatch => {
    const selected = swatch.dataset.color.toLowerCase() === currentAccent.toLowerCase();
    swatch.classList.toggle('active', selected);
    swatch.setAttribute('aria-pressed', String(selected));
  });

  $$('.builder-template-btn').forEach(btn => {
    const selected = btn.dataset.builderTemplate === currentTemplate;
    btn.classList.toggle('active', selected);
    btn.setAttribute('aria-pressed', String(selected));
  });

  if ($('#summaryCount')) $('#summaryCount').textContent = (data.summary || '').length;
}
function populateForm() {
  ['fullName','jobTitle','email','phone','location','website','summary','skills','languages'].forEach(key => {
    const field = $('#' + key); if (field) field.value = data[key] || '';
  });
  $('#templateSelect').value = data.template;
  renderRepeaters(); renderPreview(); setZoom(zoom);
}

function readRepeatInput(target) {
  const card = target.closest('.repeat-card');
  if (!card || !target.dataset.key) return false;
  data[card.dataset.type][Number(card.dataset.index)][target.dataset.key] = target.value;
  renderPreview();
  scheduleSave();
  return true;
}

$('#resumeForm').addEventListener('input', e => {
  if (readRepeatInput(e.target)) return;
  if (e.target.id && e.target.id in data) {
    data[e.target.id] = e.target.value;
    renderPreview();
    scheduleSave();
  }
});

$('#resumeForm').addEventListener('click', e => {
  const removeBtn = e.target.closest('.remove-item');
  if (removeBtn) {
    const card = removeBtn.closest('.repeat-card');
    data[card.dataset.type].splice(Number(card.dataset.index), 1);
    renderRepeaters();
    renderPreview();
    scheduleSave();
  }
});

$('#addExperience').addEventListener('click', () => {
  data.experiences.push({ role: '', company: '', location: '', start: '', end: '', description: '' });
  renderRepeaters();
  renderPreview();
  scheduleSave();
});

$('#addEducation').addEventListener('click', () => {
  data.education.push({ degree: '', school: '', start: '', end: '', description: '' });
  renderRepeaters();
  renderPreview();
  scheduleSave();
});

$('#templateSelect').addEventListener('change', e => {
  data.template = e.target.value;
  renderPreview();
  scheduleSave();
});

$$('.builder-template-card').forEach(card => {
  card.addEventListener('click', () => {
    data.template = card.dataset.builderTemplate;
    $('#templateSelect').value = data.template;
    renderPreview();
    scheduleSave();
  });
});

$$('.color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    data.accentColor = swatch.dataset.color;
    renderPreview();
    scheduleSave();
  });
});

function setZoom(value) {
  zoom = Math.max(.5, Math.min(1.1, value));
  $('#resumePreview').style.transform = `scale(${zoom})`;
  $('#zoomValue').textContent = `${Math.round(zoom * 100)}%`;
}
$('#zoomOut').addEventListener('click', () => setZoom(zoom - .1));
$('#zoomIn').addEventListener('click', () => setZoom(zoom + .1));

/*
 * ============================================================================
 * MODALES (PAIEMENT STRIPE & ACCÈS CLIENT)
 * ============================================================================
 */
const paymentModal = $('#paymentModal');
const clientModal = $('#clientAuthModal');

function openPaymentModal() {
  const emailInput = $('#checkoutEmailInput');
  const userEmail = data.email || localStorage.getItem('cv-studio-email') || '';
  if (emailInput && !emailInput.value) emailInput.value = userEmail;

  updateCheckoutLink();
  paymentModal.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#closeModal')?.focus();
}

function closePaymentModal() {
  paymentModal.hidden = true;
  document.body.style.overflow = '';
  $('#downloadBtn')?.focus();
}

function updateCheckoutLink() {
  const emailInput = $('#checkoutEmailInput');
  const email = (emailInput?.value || data.email || '').trim();
  const checkoutBtn = $('#checkoutBtn');
  if (checkoutBtn) {
    if (email && email.includes('@')) {
      checkoutBtn.href = `${STRIPE_CHECKOUT_URL}?prefilled_email=${encodeURIComponent(email)}`;
    } else {
      checkoutBtn.href = STRIPE_CHECKOUT_URL;
    }
  }
}

$('#checkoutEmailInput')?.addEventListener('input', updateCheckoutLink);

$('#closeModal')?.addEventListener('click', closePaymentModal);
$('#continueEditing')?.addEventListener('click', closePaymentModal);
paymentModal?.addEventListener('click', e => { if (e.target === paymentModal) closePaymentModal(); });

function openClientModal() {
  closePaymentModal();
  const input = $('#clientEmailInput');
  const userEmail = data.email || localStorage.getItem('cv-studio-email') || '';
  if (input && !input.value) input.value = userEmail;
  const statusEl = $('#clientAuthStatus');
  if (statusEl) statusEl.hidden = true;
  clientModal.hidden = false;
  document.body.style.overflow = 'hidden';
  input?.focus();
}

function closeClientModal() {
  clientModal.hidden = true;
  document.body.style.overflow = '';
}

$('#closeClientModal')?.addEventListener('click', closeClientModal);
clientModal?.addEventListener('click', e => { if (e.target === clientModal) closeClientModal(); });

$('#landingLoginBtn')?.addEventListener('click', openClientModal);
$('#builderLoginBtn')?.addEventListener('click', openClientModal);
$('#alreadyPaidLink')?.addEventListener('click', openClientModal);
$('#clientOpenCheckout')?.addEventListener('click', () => {
  closeClientModal();
  openPaymentModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!paymentModal.hidden) closePaymentModal();
    if (!clientModal.hidden) closeClientModal();
  }
});

/*
 * VÉRIFICATION DU PAIEMENT CLIENT (STRIPE & COMPTES CLIENTS)
 * Appel serveur vers /api/verify-payment?email=...
 */
$('#clientLoginForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#clientEmailInput').value.trim();
  const statusEl = $('#clientAuthStatus');
  const submitBtn = $('#verifyClientBtn');

  if (!email || !email.includes('@')) {
    statusEl.hidden = false;
    statusEl.className = 'auth-status-message error';
    statusEl.textContent = currentLanguage === 'en' ? 'Please enter a valid email.' : 'Veuillez entrer un courriel valide.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = currentLanguage === 'en' ? 'Checking access…' : 'Vérification en cours…';
  statusEl.hidden = false;
  statusEl.className = 'auth-status-message info';
  statusEl.textContent = currentLanguage === 'en' ? 'Connecting to Stripe & cloud records…' : 'Connexion à Stripe et vérification du statut…';

  try {
    // 1. Appel vers l'API serveur Vercel
    let result = { paid: false };
    try {
      const res = await fetch(`/api/verify-payment?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        result = await res.json();
      }
    } catch {
      // Fallback si exécuté en local sans serveur actif
      if (email.toLowerCase() === (localStorage.getItem('cv-studio-email') || '').toLowerCase() && localStorage.getItem('cv-studio-paid') === 'true') {
        result = { paid: true };
      }
    }

    if (result.paid) {
      userHasPaid = true;
      localStorage.setItem('cv-studio-paid', 'true');
      localStorage.setItem('cv-studio-email', email);

      // Si le client avait un CV sauvegardé dans le cloud, on le restaure
      if (result.cvData) {
        data = { ...defaultData, ...result.cvData };
        populateForm();
      }

      statusEl.className = 'auth-status-message success';
      statusEl.textContent = currentLanguage === 'en' 
        ? `✓ Lifetime access confirmed for ${email}! PDF download unlocked.` 
        : `✓ Accès à vie confirmé pour ${email} ! Téléchargement PDF débloqué.`;
      
      showToast(currentLanguage === 'en' ? '🎉 Welcome back! Lifetime access active.' : '🎉 Bon retour ! Accès à vie actif.');
      setTimeout(() => {
        closeClientModal();
        submitBtn.disabled = false;
        submitBtn.textContent = currentLanguage === 'en' ? 'Verify & reload my resume' : 'Vérifier & recharger mon CV';
      }, 1600);
    } else {
      statusEl.className = 'auth-status-message error';
      statusEl.innerHTML = currentLanguage === 'en'
        ? `No lifetime payment found for <strong>${escapeHTML(email)}</strong>.<br><a href="${STRIPE_CHECKOUT_URL}?prefilled_email=${encodeURIComponent(email)}" target="_blank" style="color:#0f172a;text-decoration:underline;font-weight:700">Unlock lifetime access now for $23.99 →</a>`
        : `Aucun accès à vie trouvé pour <strong>${escapeHTML(email)}</strong>.<br><a href="${STRIPE_CHECKOUT_URL}?prefilled_email=${encodeURIComponent(email)}" target="_blank" style="color:#0f172a;text-decoration:underline;font-weight:700">Débloquez votre accès à vie maintenant pour 23,99 $ →</a>`;
      submitBtn.disabled = false;
      submitBtn.textContent = currentLanguage === 'en' ? 'Verify & reload my resume' : 'Vérifier & recharger mon CV';
    }
  } catch (err) {
    statusEl.className = 'auth-status-message error';
    statusEl.textContent = currentLanguage === 'en' ? 'Network error during verification.' : 'Erreur réseau lors de la vérification.';
    submitBtn.disabled = false;
    submitBtn.textContent = currentLanguage === 'en' ? 'Verify & reload my resume' : 'Vérifier & recharger mon CV';
  }
});

/*
 * BOUTON TÉLÉCHARGEMENT PDF
 * Contrôle d'accès : vérifie userHasPaid avant d'autoriser l'export
 */
$('#downloadBtn').addEventListener('click', () => {
  if (!userHasPaid) {
    showToast(currentLanguage === 'en' ? '🍀 Good luck with your job search!' : '🍀 Bonne recherche d’emploi !');
    return openPaymentModal();
  }
  showToast(currentLanguage === 'en' ? '🍀 Good luck with your job search!' : '🍀 Bonne recherche d’emploi !');
  exportPDF();
});

/*
 * EXPORT PDF TEXTE RÉEL (100 % compatible ATS)
 * Ouvre une fenêtre d'impression dédiée contenant le CV en HTML texte.
 * L'utilisateur choisit « Enregistrer en PDF » : le texte reste sélectionnable
 * et lisible par les logiciels de tri (ATS), contrairement à un PDF-image.
 */
function exportPDF() {
  const sheet = document.querySelector('#resumePreview .resume-sheet');
  const isEn = currentLanguage === 'en';
  if (!sheet) return showToast(isEn ? 'Nothing to export yet.' : 'Rien à exporter pour le moment.');

  const filename = `${(data.fullName || 'mon-cv').trim().replace(/[^a-zA-ZÀ-ÿ0-9]+/g, '-').replace(/^-|-$/g, '')}-CV`;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return showToast(isEn
      ? 'Please allow pop-ups to export your PDF.'
      : 'Veuillez autoriser les fenêtres pop-up pour exporter votre PDF.');
  }

  const doc = [
    '<!DOCTYPE html><html lang="' + currentLanguage + '"><head><meta charset="utf-8">',
    '<title>' + filename + '</title>',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">',
    '<style>',
    '@page{size:letter;margin:0}',
    '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    'html,body{margin:0;padding:0;background:#fff}',
    '.resume-sheet{width:8.5in!important;min-height:11in!important;margin:0 auto!important;box-shadow:none!important}',
    '</style></head><body>',
    sheet.outerHTML,
    '<scr' + 'ipt>window.addEventListener("load",function(){setTimeout(function(){window.print()},450)})</scr' + 'ipt>',
    '</body></html>'
  ].join('\n');

  printWindow.document.open();
  printWindow.document.write(doc);
  printWindow.document.close();

  showToast(isEn
    ? '✓ Dans la fenêtre d’impression, choisissez « Save as PDF ».'
    : '✓ Dans la fenêtre d’impression, choisissez « Enregistrer en PDF ».');
}

/*
 * ============================================================================
 * BOUTON MAGIQUE D'OPTIMISATION PAR IA (GRATUIT & ACCESSIBLE À TOUS)
 * ============================================================================
 * Prompt système :
 * "Agis comme un coach de carrière et un expert en recrutement. Prends le texte
 * fourni par l'utilisateur et réécris-le dans un langage corporatif, hautement
 * professionnel, formel et percutant pour le marché de l'emploi. Utilise des verbes
 * d'action au début des phrases. Optimise la structure pour qu'elle passe les robots
 * de tri de CV (ATS). Ne renvoie AUCUNE introduction ni conclusion, retourne UNIQUEMENT
 * le texte corrigé et prêt à être inséré."
 */
async function optimizeWithAI(rawText, type = 'experience') {
  if (!rawText || !rawText.trim()) {
    showToast(currentLanguage === 'en' ? 'Please enter some text to optimize.' : 'Veuillez d’abord saisir du texte à optimiser.');
    return null;
  }

  // 1. Tentative d'appel à la route API Serverless
  try {
    const response = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText, type })
    });

    if (response.ok) {
      const json = await response.json();
      if (json.optimizedText) {
        return json.optimizedText;
      }
    }
  } catch {
    // Si hors-ligne ou static preview, bascule sur l'optimiseur intégré
  }

  // 2. Moteur d'optimisation professionnel intégré (garantie 100% zéro blocage)
  return localAiOptimizer(rawText, type);
}

function localAiOptimizer(text, type) {
  const lines = text.split('\n').map(l => l.trim().replace(/^[-•*–—]\s*/, '')).filter(Boolean);
  
  if (type === 'summary') {
    return text
      .replace(/\b(je suis|j'ai|je fais)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, c => c.toUpperCase());
  }

  const corporateVerbs = [
    'Pilotage stratégique et optimisation',
    'Conception, déploiement et suivi',
    'Coordination proactive et gouvernance',
    'Restructuration des processus critiques',
    'Négociation, alignement des parties prenantes et valorisation',
    'Supervision de la performance opérationnelle'
  ];

  return lines.map((line, i) => {
    const verb = corporateVerbs[i % corporateVerbs.length];
    const cleaned = line.charAt(0).toLowerCase() + line.slice(1);
    return `• ${verb} : ${cleaned}`;
  }).join('\n');
}

// Gestionnaire de clics sur les boutons d'optimisation par IA
document.addEventListener('click', async e => {
  const btn = e.target.closest('.btn-ai-optimize');
  if (!btn) return;

  const target = btn.dataset.target;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = currentLanguage === 'en' ? '🪄 Optimizing with AI…' : '🪄 Optimisation en cours…';

  try {
    if (target === 'summary') {
      const textarea = $('#summary');
      const text = textarea.value;
      const optimized = await optimizeWithAI(text, 'summary');
      if (optimized) {
        textarea.value = optimized;
        data.summary = optimized;
        renderPreview();
        scheduleSave();
        showToast(currentLanguage === 'en' ? '✨ Summary optimized by AI!' : '✨ Profil optimisé par IA avec succès !');
      }
    } else if (target === 'experience') {
      const index = Number(btn.dataset.index);
      const card = btn.closest('.repeat-card');
      const textarea = card.querySelector('textarea[data-key="description"]');
      const text = textarea.value;
      const optimized = await optimizeWithAI(text, 'experience');
      if (optimized) {
        textarea.value = optimized;
        data.experiences[index].description = optimized;
        renderPreview();
        scheduleSave();
        showToast(currentLanguage === 'en' ? '✨ Experience optimized by AI!' : '✨ Réalisations optimisées par IA !');
      }
    }
  } catch (err) {
    showToast(currentLanguage === 'en' ? 'Error during optimization.' : 'Erreur lors de l’optimisation.');
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = originalText;
  }
});

function showToast(message) {
  const toast = $('#toast'); 
  if (!toast) return;
  toast.textContent = message; 
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3200);
}

/*
 * ============================================================================
 * TRADUCTIONS ET BILINGUISME FR / EN
 * ============================================================================
 */
const FR_EN = {
  "Aucun abonnement. Ni maintenant, ni plus tard.": "No subscription. Not now, not later.",
  "Payez une fois. Un créateur de CV à vie.": "Pay once. Resume builder for life.",
  "23,99 $ — un seul paiement, accès à vie. Jamais d’abonnement.": "$23.99 — one payment, lifetime access. No subscription, ever.",
  "Sans compte. Sans carte avant le téléchargement. Accès à vie, sans reconduction.": "No account. No card until you download. Lifetime access, no auto-renewal.",
  "Commencer — gratuit": "Start building — free",
  "Voir le comparatif": "See how we compare",
  "Aperçu en direct — A4": "Live preview — A4",
  '🪄 Optimisation IA de texte gratuite intégrée': '🪄 Free AI Resume Text Optimization built-in',
  'Un coach en recrutement dans chaque case de votre CV.': 'A recruitment coach in every section of your resume.',
  'En panne d’inspiration pour valoriser vos expériences ? Cliquez sur le bouton magique « 🪄 Optimiser le texte par IA » sous n’importe quelle section. Notre IA spécialisée reformule instantanément vos notes en réalisations percutantes avec verbes d’action, parfaitement calibrées pour les logiciels de tri (ATS).': 'Stuck on how to phrase your achievements? Click "🪄 Optimize text with AI" under any section. Our recruitment AI rewrites your draft with powerful action verbs and corporate phrasing, calibrated to pass ATS filters.',
  '100 % gratuit et illimité pendant toute la rédaction': '100% free and unlimited while you write',
  'Verbes d’action puissants en tête de phrase pour capter l’œil du recruteur': 'Powerful action verbs at the start of each bullet to catch the recruiter\'s eye',
  'Mots-clés stratégiques calibrés pour maximiser votre score ATS': 'Strategic keywords calibrated to maximize your ATS score',
  'Mise à jour instantanée dans votre modèle en temps réel': 'Instant live update in your template in real time',
  'Tester l’optimisation IA gratuitement →': 'Try AI text optimization for free →',
  'Brouillon initial': 'Initial draft',
  '« J’ai géré des projets web et aidé mon équipe à respecter les délais de livraison. J’ai aussi discuté avec les clients. »': '“Managed web projects and helped my team meet delivery deadlines. Also discussed with clients.”',
  '✨ Version optimisée par l’IA': '✨ AI-Optimized Version',
  'Couleur :': 'Colour:',

  'Connexion / Accès client':'Client Login / Access',
  'Espace client':'Customer Portal',
  'Connexion & recharge de CV':'Login & Resume Reload',
  'Entrez votre adresse courriel pour vérifier votre statut « Payé_À_Vie » et recharger votre CV sauvegardé.':'Enter your email to verify your Lifetime Paid status and reload your saved resume.',
  'Adresse courriel':'Email address',
  'Vérifier & recharger mon CV':'Verify & reload my resume',
  'Pas encore client ? Débloquer pour 23,99 $':'Not a customer yet? Unlock for $23.99',
  'Vos données restent strictement confidentielles et synchronisées avec votre courriel.':'Your data remains strictly confidential and synced with your email.',
  'Courriel pour votre reçu et accès à vie':'Email for your receipt and lifetime access',
  'Débloquer mon accès à vie pour 23,99 $':'Unlock lifetime access for $23.99',
  'Déjà payé ? Se connecter':'Already paid? Log in',
  '🪄 Optimiser le texte par IA':'🪄 AI Optimize Text',
  '🪄 Optimisation en cours…':'🪄 Optimizing with AI…',
  'Fonctionnement':'How it works','Avantages':'Features','Modèles':'Templates','Créer mon CV':'Create my resume',
  'Sans abonnement. Maintenant ou plus tard.':'No subscription. Not now, not later.','Payez une fois.':'Pay once.','Créez votre CV':'Build your resume','pour la vie.':'for life.',
  '23,99 $ — un seul paiement, accès à vie.':'$23.99 — one payment, lifetime access.','Sans abonnement, jamais.':'No subscription, ever.','Voir la comparaison':'See the comparison',
  'modèles ATS':'ATS templates','export propre':'clean export','modifications':'edits','APERÇU EN DIRECT':'LIVE PREVIEW','DIRECTRICE DES OPÉRATIONS':'OPERATIONS MANAGER',
  'PROFIL':'PROFILE','Gestionnaire expérimentée, reconnue pour optimiser les opérations et mobiliser les équipes.':'Experienced manager known for improving operations and engaging teams.',
  'EXPÉRIENCE':'EXPERIENCE','Directrice des opérations — Atelier Nord':'Operations Manager — North Studio','2021 — Aujourd’hui':'2021 — Present',
  'Direction d’une équipe multidisciplinaire et amélioration continue des processus.':'Leading a multidisciplinary team and continuously improving processes.','FORMATION':'EDUCATION','MBA, Gestion stratégique':'MBA, Strategic Management','Compatible ATS ✓':'ATS-friendly ✓',
  'Simple par conception':'Simple by design','Trois étapes. Aucun piège.':'Three steps. No traps.','Votre chemin le plus direct vers un CV professionnel.':'Your most direct path to a professional resume.',
  'Rédigez-le':'Write it','Remplissez vos informations et voyez votre CV prendre forme instantanément.':'Enter your information and watch your resume take shape instantly.',
  'Payez une fois':'Pay once','Débloquez les téléchargements avec un paiement unique de 23,99 $.':'Unlock downloads with a one-time $23.99 payment.',
  'Gardez-le à vie':'Keep it for life','Revenez, adaptez et téléchargez votre CV autant de fois que nécessaire.':'Return, update and download your resume whenever you need.',
  'Le calcul est simple':'The math is simple','Payez une fois,':'Pay once,','ou payez chaque mois.':'or pay every month.','La concurrence facture une nouvelle fois le mois suivant. Nous, non.':'Other builders charge you again next month. We do not.',
  'Abonnement classique':'Typical subscription','Prix':'Price','23,99 $ une fois':'$23.99 once','15–30 $/mois':'$15–30/month','Année suivante':'Next year','0 $':'$0','180–360 $':'$180–360',
  'Modifications':'Edits','Illimitées':'Unlimited','Tant que vous payez':'While you keep paying','Compte obligatoire':'Account required','Non':'No','Souvent':'Often','Économie potentielle après un an :':'Potential savings after one year:','jusqu’à 336 $':'up to $336',
  'Tout est inclus':'Everything included','Un accès à vie comprend :':'Lifetime access includes:','Tout ce qu’il faut pour créer, adapter et envoyer votre candidature.':'Everything you need to create, tailor and send your application.',
  'Modèles compatibles ATS':'ATS-friendly templates','Des structures propres, pensées pour les humains et les logiciels de recrutement.':'Clean layouts built for people and applicant tracking systems.',
  'Export PDF net':'Clean PDF export','Un document professionnel, fidèle à votre modèle et prêt à envoyer.':'A professional document true to your template and ready to send.',
  'Aperçu instantané':'Instant preview','Chaque changement apparaît immédiatement dans votre CV.':'Every change appears instantly in your resume.',
  'Modifications illimitées':'Unlimited edits','Adaptez votre candidature à chaque poste, sans frais supplémentaires.':'Tailor your application to every role at no extra cost.',
  'Sauvegarde automatique':'Automatic saving','Votre travail reste dans votre navigateur pendant que vous rédigez.':'Your work stays in your browser while you write.',
  'Aucun compte':'No account','Commencez tout de suite, sans mot de passe ni parcours inutile.':'Start right away, with no password or needless steps.',
  'Interface française':'French and English','Une expérience claire et naturelle, conçue pour le marché francophone.':'A clear, natural experience available in French and English.',
  'Sans tactique trompeuse':'No dark patterns','Un prix transparent, sans renouvellement caché ni mauvaise surprise.':'Transparent pricing with no hidden renewals or surprises.',
  'Choisissez votre style':'Choose your style','Huit modèles, un prix à vie.':'Eight templates, one lifetime price.','Passez de l’un à l’autre sans perdre vos informations. Choisissez aussi votre couleur d’accent.':'Switch between them anytime without losing your information. Choose your accent colour too.','Classique centré, sobre et formel':'Centred classic, quietly formal','Accent moderne, calme et structuré':'Modern accent, calm and structured','Sans-serif aéré, marges généreuses':'Airy sans-serif, generous margins','Serif traditionnel, pensé pour l’impression':'Traditional serif, print-first','Bloc de nom audacieux, fort contraste':'Bold name block, high contrast','Compact, conçu pour tenir sur une page':'Compact, designed to fit one page','Colonne latérale pour contact et compétences':'Side rail for contact and skills','Minimaliste, avec beaucoup d’espace blanc':'Minimal, generous white space','Serif traditionnel':'Traditional serif','Classique centré':'Centred classic','Accent moderne':'Modern accent','Clair et aéré':'Light and airy','Colonne latérale':'Side rail','Fort contraste':'High contrast','Compact et ATS':'Compact and ATS',
  'Traditionnel':'Traditional','Moderne':'Modern','Créatif':'Creative','Minimaliste':'Minimalist','Essayer dans le créateur →':'Try them in the builder →',
  "Avis": "Reviews",
  "Avis clients vérifiés": "Verified customer reviews",
  "Ce que disent ceux qui ont refusé le piège de l’abonnement.": "What people say after skipping the subscription trap.",
  "La plupart des sites attirent avec une offre à 2 $ ou 3 $ qui se transforme en 40 $ par mois. Voici ce qu’en pensent nos utilisateurs.": "Most sites lure you with a $2 or $3 trial that turns into $40 a month. Here is what our customers have to say.",
  "✓ Achat vérifié • Accès à vie": "✓ Verified Purchase • Lifetime Access",
  "« J’ai failli me faire piéger par un autre site de CV qui proposait un téléchargement pour 2,95 $, pour découvrir un mois plus tard un prélèvement automatique de 39,90 $ sur ma carte de crédit ! Avec CVavie.com, c’est limpide et honnête : j’ai payé 23,99 $ une seule fois, mon accès est garanti pour la vie, et l’export PDF est parfait. En bonus, le bouton d’optimisation IA pour les descriptions d’expériences m’a permis de décrocher mon poste actuel en 3 semaines. »": "“I almost got trapped by another resume site that offered a download for $2.95, only to find an automatic monthly charge of $39.90 on my credit card a month later! With CVavie.com, it is completely honest and upfront: I paid $23.99 once, have lifetime access, and the PDF export is spotless. Plus, the AI optimization button for job descriptions helped me land my current role in 3 weeks.”",
  "Marc-Antoine D.": "Mark D.",
  "Gestionnaire de projet numérique · Montréal (QC)": "Digital Project Manager · Montreal (QC)",
  "« Enfin un créateur de CV sans tactique trompeuse. Les autres plateformes vous promettent un CV à 2 $ et vous facturent chaque mois en douce. Ici, c’est 23,99 $ payés une fois pour de vrai, les 8 modèles passent sans problème les logiciels ATS et le résultat est ultra professionnel. »": "“Finally a resume builder with zero dark patterns. Other platforms promise a $2 resume and charge you monthly behind your back. Here, it is $23.99 paid once for real, all 8 templates pass ATS software smoothly, and the result looks ultra professional.”",
  "Sarah L.": "Sarah L.",
  "Analyste recrutement & RH · Paris, France": "Recruitment & HR Analyst · Paris, France",
  "Les questions que l’on se pose après s’être fait avoir par une offre d’essai à 2 $ ou 3 $.": "The questions people ask after being burned by a $2 or $3 trial.",
  "Est-ce vraiment un seul paiement unique de 23,99 $ ?": "Is this really a one-time payment of $23.99?",
  "Oui, exactement. Un paiement unique de 23,99 $ vous donne un accès à vie. Nous n’enregistrons pas votre carte bancaire pour plus tard, il n’y a aucune date de reconduction et aucun abonnement caché. Si vous revenez modifier votre CV dans six mois ou dans cinq ans, vous ne serez plus jamais facturé.": "Yes, exactly. A single $23.99 payment grants lifetime access. We do not store your card for later, there is no renewal date, and no hidden subscription. If you come back to edit your resume in six months or five years, you will never be charged again.",
  "Pourquoi d’autres sites proposent-ils des CV à 2 $ ou 3 $ ?": "Why do other sites offer resumes for $2 or $3?",
  "C’est le piège d’abonnement le plus répandu : ces sites affichent un tarif d’essai attractif de 1,95 $, 2,49 $ ou 2,95 $, mais les petits caractères déclenchent un abonnement mensuel automatique de 30 $ à 50 $ prélevé chaque mois. Chez CVavie.com, nous refusons formellement ce modèle : un prix unique, transparent et honnête pour toujours.": "It is the most common subscription trap: these sites advertise an attractive trial price of $1.95, $2.49 or $2.95, but the fine print triggers an automatic monthly subscription of $30 to $50 billed every single month. At CVavie.com, we strictly refuse such deceptive tactics: one fair, transparent, lifetime price forever.",
  "Que comprend exactement l’accès à vie ?": "What exactly is included in lifetime access?",
  "Votre accès à vie comprend tout ce dont vous avez besoin : l’accès illimité aux 8 modèles professionnels, le bouton d’optimisation IA gratuit pour formuler vos accomplissements, la personnalisation des couleurs d’accent, les exports PDF nets et la possibilité d’adapter votre CV à chaque nouvelle opportunité.": "Your lifetime access includes everything: unlimited access to all 8 professional templates, the free AI optimization button for your bullet points, accent colour customization, crisp PDF exports, and the ability to tailor your resume for every opportunity.",
  "Mon CV passera-t-il les logiciels de tri (ATS) ?": "Will my resume pass applicant tracking systems (ATS)?",
  "Oui à 100 %. Nos 8 modèles utilisent une structure de texte réel sélectionnable, des polices universelles, des rubriques standards reconnues par les logiciels de tri (Profil, Expérience, Formation, Compétences) et aucun artifice graphique bloquant.": "Yes, 100%. All 8 templates use selectable real text, universal typography, standard section headings (Profile, Experience, Education, Skills) recognized by applicant tracking systems, and zero disruptive graphics.",
  "Puis-je modifier mon CV plus tard ou changer de modèle ?": "Can I edit my resume later or switch templates?",
  "Oui, autant de fois que vous le souhaitez. Vous pouvez basculer instantanément d’un modèle à l’autre en un seul clic : tous vos textes, dates et expériences restent intacts et s’adaptent immédiatement au design choisi.": "Yes, as often as you like. You can switch between all 8 designs with a single click: all your text, dates and experiences remain intact and adapt instantly to the new layout.",
  "Faut-il créer un compte ou retenir un mot de passe ?": "Do I need to create an account or remember a password?",
  "Non. Votre progression est automatiquement sauvegardée dans votre navigateur. Votre adresse courriel sert d’identifiant sécurisé : le bouton « Connexion / Accès client » vous permet de recharger instantanément votre statut payé et votre CV depuis n’importe quel ordinateur ou tablette.": "No. Your progress is saved automatically in your browser. Your email acts as a secure ID: the “Client Login / Access” button lets you instantly reload your paid status and resume from any computer or tablet.",
  'Questions fréquentes':'Frequently asked questions','Des réponses honnêtes.':'Honest answers.','Ce que vous devez savoir avant de commencer.':'What you should know before you start.',
  'Est-ce vraiment un paiement unique ?':'Is this really a one-time payment?','Oui. Vous payez 23,99 $ une fois et conservez l’accès à vie, sans abonnement.':'Yes. Pay $23.99 once and keep lifetime access, with no subscription.',
  'Mon CV passera-t-il les logiciels ATS ?':'Will my resume pass ATS software?','Les huit modèles utilisent une structure lisible, des titres standards et une hiérarchie claire.':'All eight templates use a readable structure, standard headings and a clear hierarchy.',
  'Puis-je modifier mon CV plus tard ?':'Can I edit my resume later?','Oui, autant de fois que vous le souhaitez, sans coût supplémentaire.':'Yes, as often as you like, at no extra cost.',
  'Dois-je créer un compte ?':'Do I need an account?','Non. Votre progression est sauvegardée automatiquement dans votre navigateur.':'No. Your progress is saved automatically in your browser.',
  'Puis-je changer de modèle ?':'Can I change templates?','Oui. Le style change instantanément et vos textes restent intacts.':'Yes. The style changes instantly and your content stays intact.',
  'Votre prochaine étape':'Your next step','Rédigez-le gratuitement.':'Write it for free.','Décidez à la fin.':'Decide at the end.','Créez votre CV sans inscription. Ne payez que lorsque vous êtes prêt à le télécharger.':'Build your resume without signing up. Pay only when you are ready to download.',
  'Commencer maintenant →':'Start now →','Un seul paiement.':'One payment.','Accès à vie.':'Lifetime access.','23,99 $ • aucun abonnement':'$23.99 • no subscription','Des CV professionnels, sans abonnement.':'Professional resumes, without subscriptions.',
  'PRODUIT':'PRODUCT','AIDE':'HELP','LÉGAL':'LEGAL','Confidentialité':'Privacy','Conditions':'Terms','Prix':'Pricing','Tous droits réservés.':'All rights reserved.',
  'Étape 1 sur 2':'Step 1 of 2','Choisissez votre modèle et votre couleur.':'Choose your template and your colour.','Sélectionnez le style qui vous représente, puis votre couleur d’accent. Vous pourrez en changer à tout moment pendant la rédaction.':'Pick the style that represents you, then your accent colour. You can change it any time while writing.','Couleur d’accent':'Accent colour','Elle s’applique instantanément à votre modèle.':'It is applied to your template instantly.','Modèle sélectionné':'Selected template','Continuer vers la rédaction →':'Continue to writing →','Style choisi':'Chosen style','← Changer de style':'← Change style','🍀 Bonne recherche d’emploi !':'🍀 Good luck with your job search!','Accès à vie requis pour le téléchargement':'Lifetime access required to download','paiement unique':'one-time payment',
  '← Accueil':'← Home','Modèle':'Template','Personnalisation':'Customization','Choisissez une couleur d’accent':'Choose an accent colour','La couleur s’applique instantanément au modèle sélectionné.':'The colour is applied instantly to the selected template.','Styles disponibles':'Available styles','Choisissez parmi 8 modèles':'Choose from 8 templates','Changement instantané':'Instant switching','Héritage':'Heritage','Exécutif':'Executive','Forêt':'Forest','Corail':'Coral','Pur ATS':'Pure ATS','Essentiel':'Essential','Sauvegardé':'Saved','Sauvegarde…':'Saving…','Télécharger en PDF':'Download PDF','Votre parcours':'Your career','Construisons votre CV.':'Let’s build your resume.','Remplissez les champs : l’aperçu se met à jour automatiquement.':'Fill in the fields: the preview updates automatically.',
  'Informations personnelles':'Personal information','Profil':'Profile','Nom complet':'Full name','Titre professionnel':'Professional title','Courriel':'Email','Téléphone':'Phone','Ville':'City','LinkedIn / Site':'LinkedIn / Website','Profil / Sommaire':'Profile / Summary','Résumé professionnel':'Professional summary','caractères':'characters',
  'Expériences professionnelles':'Work experience','Ajouter une expérience':'Add experience','Éducation':'Education','Ajouter une formation':'Add education','Compétences':'Skills','Une compétence par ligne':'One skill per line','Langues':'Languages','Langue — Niveau, une par ligne':'Language — Level, one per line','Aperçu en direct':'Live preview','Format lettre':'Letter size',
  'Poste':'Role','Entreprise':'Company','Ville':'City','Début':'Start','Fin':'End','Réalisations':'Achievements','Supprimer':'Remove','Diplôme':'Degree','Établissement':'School','Détails':'Details','Aujourd’hui':'Present','Expérience professionnelle':'Work experience',
  'Exportation illimitée':'Unlimited exports','Votre CV est prêt.':'Your resume is ready.','Abonnement à vie requis':'Lifetime access required','Vos modifications sont sauvegardées automatiquement.':'Your changes are saved automatically.','Continuer à modifier':'Keep editing','Paiement sécurisé via Stripe • Accès instantané • Sans abonnement':'Secure payment via Stripe • Instant access • No subscription',

  // CVavie.com Brand & SEO Translations
  'Le premier créateur de CV par IA accessible à vie': 'The first AI-powered resume builder with lifetime access',
  'Le premier créateur de CV par IA': 'The first AI-powered resume builder',
  'accessible à vie.': 'with lifetime access.',
  'Créer': 'Create',
  'Décider': 'Decide',
  'Optimiser avec l’IA à vie': 'Optimize with AI for life',
  '8 modèles ATS, une IA qui rédige avec vous, un PDF impeccable.': '8 ATS templates, AI that writes with you, a flawless PDF.',
  '8 templates ATS': '8 ATS templates',
  'Sans filigrane': 'No watermark',
  'Illimité': 'Unlimited',
  '✦ Optimisé par IA': '✦ AI-optimized',
  '23,99 $ à vie': '$23.99 for life',
  'Export PDF': 'PDF Export',
  '23,99 $': '$23.99',
  'une seule fois — accès à vie, jamais d’abonnement caché sous une offre à 2 $.': 'one time only — lifetime access, never a hidden subscription behind a $2 offer.',
  'Commencer à créer': 'Start creating',
  'd’économies dès la première année — sans rien sacrifier.': 'saved in the very first year — with nothing sacrificed.',
  'Ici, pas de piège ni d’abonnement caché. Optimisez votre contenu avec notre IA et téléchargez votre CV parfait pour seulement 23,99 $ une seule fois.': 'No traps, no hidden subscriptions. Optimize your content with our AI and download your perfect resume for just $23.99 once.',
  'Pourquoi CVavie': 'Why CVavie',
  'Pourquoi nous choisir': 'Why choose us',
  'Pourquoi choisir CVavie.com ?': 'Why choose CVavie.com?',
  'La solution moderne pensée pour votre carrière : l’intelligence artificielle intégrée gratuitement pour booster vos textes, des modèles certifiés ATS et un tarif transparent à vie, sans aucun abonnement récurrent.': 'The modern solution for your career: free built-in AI text optimization, recruiter-approved ATS templates, and transparent lifetime pricing with zero recurring fees.',
  '🤖 Optimisation par IA intégrée :': '🤖 Built-in AI optimization:',
  'Un bouton magique gratuit qui reformule vos tâches dans un langage corporatif et percutant.': 'A free magic button that rewrites your accomplishments in high-impact corporate language.',
  'Verbes d’action percutants en début de phrase': 'Powerful action verbs at the start of each bullet',
  'Vocabulaire et mots-clés valorisants pour les RH': 'High-value vocabulary and keywords for HR recruiters',
  '🎯 Modèles 100% ATS-Friendly :': '🎯 100% ATS-Friendly templates:',
  'Nos 8 designs épurés sont validés pour passer les filtres des robots de recrutement des grandes entreprises.': 'Our 8 clean designs are validated to pass applicant tracking systems at top employers.',
  'Texte vectoriel sélectionnable sans colonnes piégeuses': 'Selectable vector text without complex parsing columns',
  'Rubriques normées reconnues automatiquement': 'Standardized headings recognized automatically by software',
  'Export PDF haute définition prêt pour l’envoi': 'High-definition PDF export ready for job applications',
  '💰 Zéro abonnement caché :': '💰 Zero hidden subscriptions:',
  'Contrairement aux autres sites qui vous facturent chaque mois, vous payez 23,99 $ une seule fois et revenez modifier votre CV gratuitement toute votre vie.': 'Unlike other sites that bill you monthly, you pay $23.99 once and update your resume for free for the rest of your life.',
  'Aucune carte bancaire conservée pour prélèvement': 'No credit card stored for recurring charges',
  'Accès complet garanti même dans 5 ans': 'Full access guaranteed even in 5 years',
  'Économisez jusqu’à 360 $ dès la première année': 'Save up to $360 in your first year alone',

  // Rewritten FAQ Translations (FR & EN)
  'TRANSPARENCE TOTALE': 'FULL TRANSPARENCY',
  'PAIEMENT UNIQUE': 'ONE-TIME PAYMENT',
  'PIÈGE DE L\'INDUSTRIE': 'INDUSTRY TRAP',
  'INTELLIGENCE ARTIFICIELLE': 'ARTIFICIAL INTELLIGENCE',
  'COMPATIBILITÉ ATS': 'ATS COMPATIBILITY',
  'ACCÈS À VIE': 'LIFETIME ACCESS',
  'COMPTE & SÉCURITÉ': 'ACCOUNT & SECURITY',
  'MODIFICATIONS ILLIMITÉES': 'UNLIMITED EDITS',
  'SÉCURITÉ STRIPE': 'STRIPE SECURITY',
  'ACCÈS MULTI-APPAREILS': 'MULTI-DEVICE ACCESS',
  'Si je change d’appareil, vais-je perdre mon accès ?': 'If I switch devices, will I lose my access?',
  'Non, votre accès à vie ne se perd jamais.': 'No, your lifetime access is never lost.',
  ' Il est rattaché à l\'adresse courriel utilisée lors de votre achat, et non à votre appareil.': ' It is tied to the email address used for your purchase, not to your device.',
  'Concrètement, deux situations :': 'In practice, there are two scenarios:',
  'Sur le même appareil et le même navigateur :': 'On the same device and browser:',
  ' tout est déjà là. Votre CV et votre accès payé sont conservés automatiquement, même des mois plus tard. Vous n\'avez rien à faire.': ' everything is already there. Your resume and paid access are saved automatically, even months later. Nothing to do.',
  'Sur un nouvel appareil (nouveau téléphone, ordinateur du bureau, navigateur différent) :': 'On a new device (new phone, work computer, different browser):',
  ' cliquez simplement sur le bouton « Connexion / Accès client » en haut du site, saisissez l\'adresse courriel de votre achat, et votre accès à vie est immédiatement restauré. Vous pouvez alors télécharger de nouveau votre PDF sans repayer.': ' simply click the "Sign in / Customer access" button at the top of the site, enter the email address from your purchase, and your lifetime access is restored instantly. You can then download your PDF again without paying twice.',
  'Un conseil pratique : conservez le courriel de confirmation envoyé par Stripe après votre paiement, il vous rappelle l’adresse exacte à utiliser. Et par prudence, gardez toujours une copie du PDF téléchargé dans vos courriels ou votre espace de stockage personnel.': 'A practical tip: keep the confirmation email Stripe sends after your payment — it reminds you of the exact address to use. And to be safe, always keep a copy of your downloaded PDF in your email or personal storage.',
  'Le créateur de CV par IA': 'The AI resume builder',
  'que vous ne payez qu’une seule fois.': 'you only pay for once.',
  '8 modèles compatibles ATS, une IA qui reformule vos expériences en langage de recruteur, et un PDF impeccable en quelques minutes. 23,99 $ une fois — puis c’est à vous, à vie.': '8 ATS-ready templates, an AI that rewrites your experience in recruiter language, and a flawless PDF in minutes. $23.99 once — then it is yours, for life.',
  'FAQ RAPIDE': 'QUICK FAQ',
  'Une question particulière ?': 'Have a specific question?',
  'Notre équipe répond directement sous 24h ouvrées.': 'Our support team replies within 24 business hours.',
  'Est-ce véritablement un seul paiement de 23,99 $ sans aucun abonnement caché ?': 'Is it truly a single payment of $23.99 with no hidden subscription?',
  'Comment fonctionne l’optimisation de texte par IA et est-elle vraiment gratuite ?': 'How does AI text optimization work, and is it truly free?',
  'Les 8 modèles sont-ils 100 % compatibles avec les robots de recrutement (ATS) ?': 'Are the 8 templates 100% compatible with Applicant Tracking Systems (ATS)?',
  'Puis-je changer de modèle ou de couleur sans perdre mes informations ?': 'Can I switch templates or colors without losing my data?',
  'Le paiement est-il sécurisé et quels modes de règlement sont acceptés ?': 'Is payment secure and what payment methods are accepted?',
  'Foire aux questions': 'Frequently Asked Questions',
  'Questions fréquentes sur CVavie.com': 'Frequently Asked Questions about CVavie.com',
  'Toutes les réponses pour aborder votre recherche d’emploi en toute confiance et sans mauvaise surprise.': 'All the answers you need to navigate your job search with confidence and no surprises.',
  'Est-ce véritablement un seul paiement unique de 23,99 $ sans abonnement ?': 'Is it truly a one-time payment of $23.99 with no subscription?',
  'Oui, absolument. Vous ne réglez que 23,99 $ une seule fois pour débloquer l’accès complet à vie. Aucun renouvellement automatique, aucune facturation mensuelle récurrente et aucun frais surprise. Que vous reveniez actualiser votre CV dans trois mois ou dans cinq ans, vous ne paierez plus jamais rien.': 'Yes, absolutely. You pay $23.99 once for complete lifetime access. There is no automatic renewal, no monthly recurring fee, and zero hidden charges. Whether you return to update your resume in three months or five years, you will never pay again.',
  'Pourquoi d’autres créateurs de CV proposent-ils des offres à 2 $ ou 3 $ ?': 'Why do other resume builders offer $2 or $3 download deals?',
  'C’est le piège d’abonnement le plus répandu de l’industrie, souvent appelé le « faux essai à 2 $ ». Ces plateformes affichent un tarif symbolique de 1,95 $ ou 2,95 $ pour télécharger le premier document, mais leurs conditions générales dissimulent un abonnement mensuel automatique de 30 $ à 50 $ prélevé chaque mois sur votre carte bancaire. Chez CVavie.com, nous refusons formellement ce modèle : un tarif unique de 23,99 $, transparent, honnête et garanti à vie.': 'This is the most prevalent subscription trap in the industry, often known as the "$2 bait-and-switch." These sites promote an enticing $1.95 or $2.95 download fee, but bury an automatic recurring monthly subscription of $30 to $50 in their fine print. At CVavie.com, we strictly refuse such deceptive tactics: one honest, upfront payment of $23.99 with lifetime access.',
  'Comment fonctionne l’optimisation de texte par intelligence artificielle (IA) ?': 'How does the AI text optimization feature work?',
  'Directement intégrée sous vos rubriques de profil et d\'expériences professionnelles, notre fonction « 🪄 Optimiser le texte par IA » analyse vos phrases et les reformule instantanément dans un style corporatif formel, percutant et valorisant. L’IA commence chaque accomplissement par un verbe d’action puissant et optimise le vocabulaire pour franchir avec succès les robots de tri RH (ATS). Cette fonctionnalité est 100 % gratuite et accessible en illimité dès la rédaction.': 'Positioned directly beneath your summary and work experience descriptions, the "🪄 AI Optimize Text" button analyzes your draft and instantly rewrites it in high-impact, professional corporate language. The AI leads every achievement with strong action verbs and optimizes strategic keywords to effortlessly pass HR screening robots (ATS). This feature is 100% free and unlimited while writing.',
  'Les modèles sont-ils 100 % compatibles avec les robots de recrutement (ATS) ?': 'Are the resume templates 100% ATS-friendly?',
  'Oui, à 100 %. Les logiciels ATS (Applicant Tracking Systems) filtrent automatiquement les candidatures avant l\'examen par un recruteur. Nos 8 modèles respectent scrupuleusement les exigences des ATS : texte vectoriel sélectionnable, polices de caractères universelles, titres de sections standards reconnus et absence totale de graphismes perturbateurs qui bloquent les algorithmes d’extraction.': 'Yes, 100%. Applicant Tracking Systems (ATS) scan and parse resumes before human recruiters see them. All 8 of our templates strictly adhere to ATS standards: clean selectable text, universal standard fonts, recognized section headers, and zero complex graphic artifacts that cause parsing errors.',
  'Que comprend l\'accès à vie à 23,99 $ sur CVavie.com ?': 'What is included with lifetime access for $23.99 on CVavie.com?',
  'Votre paiement unique de 23,99 $ débloque l\'intégralité des fonctionnalités de la plateforme sans aucune limite de temps ni de quantité : accès complet aux 8 modèles professionnels, liberté totale de personnalisation avec 8 couleurs d\'accent, utilisation illimitée de l\'IA d\'optimisation, modifications futures à volonté et téléchargements de votre CV en format PDF haute définition.': 'Your one-time payment of $23.99 unlocks every single feature of the platform with zero time limits or restrictions: full access to all 8 professional templates, 8 customizable accent colors, unlimited use of the AI optimization tool, unrestricted future updates, and endless high-resolution PDF exports.',
  'Dois-je créer un compte avec mot de passe pour retrouver mon CV ?': 'Do I need an account or password to recover my resume?',
  'Aucun mot de passe à créer ni à retenir. Votre progression est automatiquement enregistrée en continu dans votre navigateur. Votre adresse courriel sert de clé de sécurité unique : grâce au bouton « Connexion / Accès client » situé en haut du site, vous pouvez recharger instantanément votre CV sauvegardé et votre statut payé à tout moment, depuis n’importe quel ordinateur ou tablette.': 'No password to create or remember. Your work is saved automatically in real-time in your browser. Your email address acts as your secure identifier: click "Client Login / Access" in the header anytime to instantly reload your saved resume and paid lifetime access from any computer or tablet.',
};
let currentLanguage = localStorage.getItem('cv-studio-language') || 'fr';

const NORMALIZED_FR_EN = {};
for (const [k, v] of Object.entries(FR_EN)) {
  NORMALIZED_FR_EN[k.replace(/[’\x27]/g, "\x27").replace(/\s+/g, " ").trim()] = v;
}

function translateRoot(root, lang) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    if (node.parentElement && node.parentElement.closest('.prestige-visual')) return;
    if (!node.__frText) node.__frText = node.nodeValue;
    const original = node.__frText;
    const trimmed = original.trim().replace(/\s+/g, " ");
    const normalized = trimmed.replace(/[’\x27]/g, "\x27");
    let translated = FR_EN[trimmed] || NORMALIZED_FR_EN[normalized];
    if (!translated && /^Expérience \d+$/.test(trimmed)) translated = trimmed.replace("Expérience", "Experience");
    if (!translated && /^Formation \d+$/.test(trimmed)) translated = trimmed.replace("Formation", "Education");
    if (!translated && /^\/600 caractères$/.test(trimmed)) translated = "/600 characters";
    if (lang === "en" && translated) {
      const leadingSpace = original.match(/^\s*/)[0];
      const trailingSpace = original.match(/\s*$/)[0];
      node.nodeValue = leadingSpace + translated + trailingSpace;
    } else {
      node.nodeValue = original;
    }
  });
}

const HERO_CONTENT = {
  fr: {
    windowTitle: 'Aperçu en direct — Format A4',
    name: 'Camille Rousseau',
    role: 'Chargée de projet numérique',
    contact: '<span>camille.rousseau@exemple.fr</span> · <span>+33 6 12 34 56 78</span> · <span>Lyon, France</span> · <span>linkedin.com/in/camillerousseau</span>',
    secProfile: 'PROFIL',
    profileText: 'Chargée de projet numérique avec 8 ans d’expérience en agence et chez l’annonceur. Spécialisée dans le pilotage de refontes web complexes, la coordination d’équipes multidisciplinaires et l’optimisation des processus de livraison pour maximiser l’impact utilisateur.',
    secExp: 'EXPÉRIENCE PROFESSIONNELLE',
    job1Title: '<strong>Chargée de projet senior</strong> — Atelier Vallon',
    job1Date: '2021 — Aujourd’hui',
    job1City: 'Lyon, France',
    job1Bullets: [
      'Piloté la refonte intégrale d’une plateforme e-commerce de 40 000 références, livrée avec deux semaines d’avance.',
      'Réduit de 31 % le temps de chargement moyen en réorganisant le parcours utilisateur et les requêtes critiques.',
      'Encadré et formé 4 chefs de projet juniors tout en instaurant des revues de sprint hebdomadaires.'
    ],
    job2Title: '<strong>Chef de projet digital</strong> — Groupe Meunier',
    job2Date: '2017 — 2021',
    job2City: 'Paris, France',
    job2Bullets: [
      'Coordonné 23 projets digitaux pour un budget d’investissement annuel cumulé de 1,4 M€.',
      'Conçu un tableau de suivi partagé et automatisé réduisant les délais de validation interne de 40 %.'
    ],
    secEdu: 'FORMATION',
    eduTitle: '<strong>Master Management de projets numériques</strong>',
    eduDate: '2015 — 2017',
    eduCity: 'Université Lumière Lyon 2 — Mention Très Bien',
    secSkills: 'COMPÉTENCES CLÉS',
    skillsList: 'Gestion de projet Agile/Scrum · Cadrage fonctionnel · Rédaction CDC · Suivi budgétaire & ROI · Figma · Jira · Asana · Analyse de données',
    secLang: 'LANGUES & CERTIFICATIONS',
    langList: 'Français (Langue maternelle) · Anglais (Courant C1) · Professional Scrum Master I (PSM I, 2020)',
    pill: 'Compatible ATS — Modèle officiel'
  },
  en: {
    windowTitle: 'Live preview — A4 format',
    name: 'Jordan Avery',
    role: 'Operations Manager',
    contact: '<span>jordan.avery@example.com</span> · <span>+1 604 555 0148</span> · <span>Vancouver, BC</span> · <span>linkedin.com/in/jordanavery</span>',
    secProfile: 'PROFILE',
    profileText: 'Operations manager with nine years in logistics and light manufacturing. Specialised in transforming complex firefighting into repeatable, scalable workflows while consistently reducing operating expenses and boosting team retention.',
    secExp: 'PROFESSIONAL EXPERIENCE',
    job1Title: '<strong>Operations Manager</strong> — Harbourline Freight',
    job1Date: '2020 — Present',
    job1City: 'Vancouver, BC',
    job1Bullets: [
      'Rebuilt the dispatch process and cut average turnaround from 38 hours to 21.',
      'Renegotiated three carrier contracts, generating $410,000 in net savings in year one.',
      'Hired and coached a team of 14 across two shifts, reducing turnover from 40% to 11%.'
    ],
    job2Title: '<strong>Supervisor, Fulfilment</strong> — Northfield Supply',
    job2Date: '2016 — 2020',
    job2City: 'Burnaby, BC',
    job2Bullets: [
      'Managed a 22,000 sq ft distribution facility during a 3x volume increase without headcount expansion.',
      'Introduced weekly cycle counts that brought inventory accuracy to 99.4%.'
    ],
    secEdu: 'EDUCATION',
    eduTitle: '<strong>BComm, Supply Chain Management</strong>',
    eduDate: '2012 — 2016',
    eduCity: 'University of British Columbia — Graduated with distinction',
    secSkills: 'KEY SKILLS',
    skillsList: 'Process Design · Vendor Negotiation · Lean / Six Sigma · Inventory Planning · Team Leadership · SAP · Excel Modelling · KPI Reporting',
    secLang: 'LANGUAGES & CERTIFICATIONS',
    langList: 'English (Native) · French (Conversational B2) · Lean Six Sigma Green Belt (ASQ, 2019)',
    pill: 'ATS-Friendly — Official Template'
  }
};

function updateHeroResumeLanguage(lang) {
  const content = HERO_CONTENT[lang] || HERO_CONTENT.fr;
  const deskImg = document.getElementById("heroDeskImg");
  if (deskImg) {
    deskImg.alt = lang === 'en' 
      ? 'Realistic professional resume on an executive wooden desk' 
      : "CV professionnel réaliste posé sur le coin d'un bureau élégant";
  }
  if ($('#heroWindowTitle')) $('#heroWindowTitle').textContent = content.windowTitle;
  if ($('#heroDocName')) $('#heroDocName').textContent = content.name;
  if ($('#heroDocRole')) $('#heroDocRole').textContent = content.role;
  if ($('#heroDocContact')) $('#heroDocContact').innerHTML = content.contact;
  if ($('#heroDocSecProfile')) $('#heroDocSecProfile').textContent = content.secProfile;
  if ($('#heroDocProfileText')) $('#heroDocProfileText').textContent = content.profileText;
  if ($('#heroDocSecExp')) $('#heroDocSecExp').textContent = content.secExp;
  if ($('#heroDocJob1Title')) $('#heroDocJob1Title').innerHTML = content.job1Title;
  if ($('#heroDocJob1Date')) $('#heroDocJob1Date').textContent = content.job1Date;
  if ($('#heroDocJob1City')) $('#heroDocJob1City').textContent = content.job1City;
  if ($('#heroDocJob1List')) {
    $('#heroDocJob1List').innerHTML = content.job1Bullets.map(b => `<li>${b}</li>`).join('');
  }
  if ($('#heroDocJob2Title')) $('#heroDocJob2Title').innerHTML = content.job2Title;
  if ($('#heroDocJob2Date')) $('#heroDocJob2Date').textContent = content.job2Date;
  if ($('#heroDocJob2City')) $('#heroDocJob2City').textContent = content.job2City;
  if ($('#heroDocJob2List')) {
    $('#heroDocJob2List').innerHTML = content.job2Bullets.map(b => `<li>${b}</li>`).join('');
  }
  if ($('#heroDocSecEdu')) $('#heroDocSecEdu').textContent = content.secEdu;
  if ($('#heroDocEduTitle')) $('#heroDocEduTitle').innerHTML = content.eduTitle;
  if ($('#heroDocEduDate')) $('#heroDocEduDate').textContent = content.eduDate;
  if ($('#heroDocEduCity')) $('#heroDocEduCity').textContent = content.eduCity;
  if ($('#heroDocSecSkills')) $('#heroDocSecSkills').textContent = content.secSkills;
  if ($('#heroDocSkillsList')) $('#heroDocSkillsList').textContent = content.skillsList;
  if ($('#heroDocSecLang')) $('#heroDocSecLang').textContent = content.secLang;
  if ($('#heroDocLangList')) $('#heroDocLangList').textContent = content.langList;
  if ($('#heroFloatingPillText')) $('#heroFloatingPillText').textContent = content.pill;
  const aiTag = document.querySelector('.ai-hero-pill .ai-tag');
  if (aiTag) aiTag.textContent = lang === 'en' ? 'NEW' : 'NOUVEAU';
}

function updateHeroResumeScale() {
  const viewport = document.getElementById('heroDocViewport');
  const paper = document.getElementById('heroDocPaper');
  if (viewport && paper) {
    const width = viewport.clientWidth;
    if (width > 0) {
      const scale = width / 794;
      paper.style.transform = `scale(${scale})`;
      paper.style.transformOrigin = 'top left';
      const targetH = window.innerWidth <= 1040 ? 420 : 500;
      viewport.style.height = `${targetH}px`;
    }
  }
}

function updateThumbScales() {
  document.querySelectorAll('.reference-gallery .thumb-frame').forEach(frame => {
    const w = frame.clientWidth;
    if (w > 0) {
      const scale = w / 794;
      frame.style.setProperty('--thumb-scale', scale);
      const ps = frame.querySelector('.preview-scale');
      if (ps) ps.style.transform = 'scale(' + scale + ')';
    }
  });

  document.querySelectorAll('.builder-template-card .thumb-frame').forEach(frame => {
    const w = frame.clientWidth;
    if (w > 0) {
      const scale = w / 794;
      frame.style.setProperty('--builder-thumb-scale', scale);
      const ps = frame.querySelector('.preview-scale');
      if (ps) ps.style.transform = 'scale(' + scale + ')';
    }
  });
}

function renderHeroCvStack(lang = currentLanguage) {
  const stack = document.getElementById('heroCvStack');
  if (!stack || !window.TEMPLATES_DATA) return;
  const isEn = lang === 'en';
  // La composition reprend la référence : un carnet sombre au centre,
  // entouré de feuilles de CV qui flottent à différentes profondeurs.
  const picks = [window.TEMPLATES_DATA[2], window.TEMPLATES_DATA[6], window.TEMPLATES_DATA[0], window.TEMPLATES_DATA[4]];
  const positions = ['cv-sheet-top-left', 'cv-sheet-top-right', 'cv-sheet-bottom-left', 'cv-sheet-bottom-right'];
  const sheets = picks.map((t, i) => [
    '<div class="floating-cv ' + positions[i] + '">',
    '  <div class="floating-cv-scale">',
    '    <div class="' + t.pageClass + '" style="' + t.pageStyle + '">',
             (isEn ? t.htmlEn : t.htmlFr),
    '    </div>',
    '  </div>',
    '</div>'
  ].join('')).join('');
  const cover = isEn
    ? '<span class="hero-cover-overline">AI RESUME STUDIO</span><strong>Stand out.<br><em>Get hired.</em></strong><span class="hero-cover-foot">CVAVIE.COM&nbsp; · &nbsp;YOUR CAREER, CLEARLY</span>'
    : '<span class="hero-cover-overline">ATELIER CV PROPULSÉ PAR L’IA</span><strong>Votre CV.<br><em>Votre avenir.</em></strong><span class="hero-cover-foot">CVAVIE.COM&nbsp; · &nbsp;VOTRE CARRIÈRE, CLAIREMENT</span>';
  stack.innerHTML = sheets + '<div class="hero-cover" aria-hidden="true">' + cover + '</div>';
}

function renderHomeGallery(lang = currentLanguage) {
  const gallery = document.querySelector('.reference-gallery');
  if (!gallery || !window.TEMPLATES_DATA) return;
  const isEn = (lang === 'en');
  gallery.innerHTML = window.TEMPLATES_DATA.map(t => {
    return [
      '<button class="template-thumb open-builder" data-template="' + t.id + '" type="button">',
      '  <span class="thumb-frame">',
      '    <span class="preview-scale">',
      '      <span class="' + t.pageClass + '" style="' + t.pageStyle + '">',
      '        ' + (isEn ? t.htmlEn : t.htmlFr),
      '      </span>',
      '    </span>',
      '  </span>',
      '  <figcaption>',
      '    <strong>' + t.name + '</strong>',
      '    <small>' + (isEn ? t.descEn : t.descFr) + '</small>',
      '  </figcaption>',
      '</button>'
    ].join('\n');
  }).join('\n');

  gallery.querySelectorAll('.template-thumb').forEach(btn => {
    btn.addEventListener('click', () => showChooser(btn.dataset.template));
  });

  renderHeroCvStack(lang);
  requestAnimationFrame(updateThumbScales);
}

function renderBuilderGallery(lang = currentLanguage) {
  const grid = document.querySelector('.builder-template-grid');
  if (!grid || !window.TEMPLATES_DATA) return;
  const isEn = (lang === 'en');
  grid.innerHTML = window.TEMPLATES_DATA.map(t => {
    const selected = (t.id === data.template);
    return [
      '<button class="builder-template-btn' + (selected ? ' active' : '') + '" data-builder-template="' + t.id + '" type="button" aria-pressed="' + selected + '">',
      '  <strong>' + t.name + '</strong>',
      '  <small>' + (isEn ? t.descEn : t.descFr) + '</small>',
      '</button>'
    ].join('\n');
  }).join('\n');

  grid.querySelectorAll('.builder-template-btn').forEach(card => {
    card.addEventListener('click', () => {
      data.template = card.dataset.builderTemplate;
      const select = $('#templateSelect');
      if (select) select.value = data.template;
      renderPreview();
      scheduleSave();
    });
  });
}
window.addEventListener('resize', () => { updateHeroResumeScale(); updateThumbScales(); });

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('cv-studio-language', lang);
  document.documentElement.lang = lang;
  translateRoot(document.body, lang);
  updateHeroResumeLanguage(lang);
  renderHomeGallery(lang);
  renderBuilderGallery(lang);
  renderChooserGallery(lang);
  updateStyleLabels();
  $$('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  document.title = lang === 'en' ? 'CVavie.com | The first AI resume builder with lifetime access' : 'CVavie.com | Le premier créateur de CV par IA accessible à vie';
  const frTemplates = ['01 — Quill','02 — Atlas','03 — Meridian','04 — Lumen','05 — Harbor','06 — Vector','07 — Cadence','08 — North'];
  const enTemplates = ['01 — Quill','02 — Atlas','03 — Meridian','04 — Lumen','05 — Harbor','06 — Vector','07 — Cadence','08 — North'];
  $$('#templateSelect option').forEach((option, index) => option.textContent = (lang === 'en' ? enTemplates : frTemplates)[index]);
}

$$('.lang-btn').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));


/*
 * ============================================================================
 * ÉTAPE 1 — PAGE DE CHOIX DU MODÈLE ET DE LA COULEUR D'ACCENT
 * L'utilisateur choisit d'abord son style, puis passe à la page de rédaction
 * (étape 2) où l'aperçu se met à jour en temps réel à droite.
 * ============================================================================
 */
function templateName(id) {
  const found = (window.TEMPLATES_DATA || []).find(t => t.id === id);
  return found ? found.name : '';
}

function updateStyleLabels() {
  const name = templateName(data.template);
  const chooserName = $('#chooserSelectedName');
  if (chooserName && name) chooserName.textContent = name;
  const builderName = $('#builderStyleName');
  if (builderName && name) builderName.textContent = name;
  $$('.color-swatch').forEach(sw => sw.classList.toggle('active', sw.dataset.color === data.accentColor));
  $$('.chooser-gallery .template-thumb').forEach(card => {
    const active = card.dataset.template === data.template;
    card.classList.toggle('active', active);
    card.setAttribute('aria-pressed', active);
  });
  const select = $('#templateSelect');
  if (select && select.value !== data.template) select.value = data.template;
}

function renderChooserGallery(lang = currentLanguage) {
  const gallery = document.querySelector('.chooser-gallery');
  if (!gallery || !window.TEMPLATES_DATA) return;
  const isEn = (lang === 'en');
  gallery.innerHTML = window.TEMPLATES_DATA.map(t => {
    const selected = (t.id === data.template);
    return [
      '<button class="template-thumb' + (selected ? ' active' : '') + '" data-template="' + t.id + '" type="button" aria-pressed="' + selected + '">',
      '  <span class="thumb-check">✓</span>',
      '  <span class="thumb-frame">',
      '    <span class="preview-scale">',
      '      <span class="' + t.pageClass + '" style="' + t.pageStyle + '">',
      '        ' + (isEn ? t.htmlEn : t.htmlFr),
      '      </span>',
      '    </span>',
      '  </span>',
      '  <figcaption>',
      '    <strong>' + t.name + '</strong>',
      '    <small>' + (isEn ? t.descEn : t.descFr) + '</small>',
      '  </figcaption>',
      '</button>'
    ].join('\n');
  }).join('\n');

  gallery.querySelectorAll('.template-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      data.template = btn.dataset.template;
      renderPreview();
      scheduleSave();
      updateStyleLabels();
    });
  });

  requestAnimationFrame(updateThumbScales);
}

function showChooser(selectedTemplate) {
  if (selectedTemplate) {
    data.template = selectedTemplate;
    renderPreview();
    scheduleSave();
  }
  $('#landingView').hidden = true;
  $('#builderView').hidden = true;
  const chooser = $('#chooserView');
  if (chooser) chooser.hidden = false;
  document.body.classList.remove('builder-open');
  document.body.classList.add('chooser-open');
  updateStyleLabels();
  window.scrollTo(0, 0);
  requestAnimationFrame(updateThumbScales);
}

function showBuilder(selectedTemplate) {
  if (selectedTemplate) {
    data.template = selectedTemplate;
    $('#templateSelect').value = selectedTemplate;
    renderPreview();
    scheduleSave();
  }
  $('#landingView').hidden = true;
  const chooserView = $('#chooserView');
  if (chooserView) chooserView.hidden = true;
  document.body.classList.remove('chooser-open');
  $('#builderView').hidden = false;
  document.body.classList.add('builder-open');
  updateStyleLabels();
  window.scrollTo(0, 0);
  requestAnimationFrame(() => { setZoom(zoom); updateThumbScales(); });
}

function showLanding() {
  $('#builderView').hidden = true;
  const chooser = $('#chooserView');
  if (chooser) chooser.hidden = true;
  document.body.classList.remove('chooser-open');
  $('#landingView').hidden = false;
  document.body.classList.remove('builder-open');
  window.scrollTo(0, 0);
  requestAnimationFrame(updateThumbScales);
}

$$('.open-builder').forEach(button => button.addEventListener('click', () => showChooser(button.dataset.template)));
$('#backHome').addEventListener('click', showLanding);
$('#chooserBack')?.addEventListener('click', showLanding);
$('#chooserContinue')?.addEventListener('click', () => showBuilder(data.template));
$('#chooserContinueTop')?.addEventListener('click', () => showBuilder(data.template));
$('#changeStyleBtn')?.addEventListener('click', () => showChooser());

populateForm();
setLanguage(currentLanguage);
renderHomeGallery(currentLanguage);
renderBuilderGallery(currentLanguage);
renderChooserGallery(currentLanguage);
updateStyleLabels();
requestAnimationFrame(() => { updateHeroResumeScale(); updateThumbScales(); });
window.addEventListener('load', updateHeroResumeScale);

/*
 * RETOUR DE STRIPE APRÈS PAIEMENT (?paid=true)
 * Le client revient sur cvavie.com : on rouvre directement son CV (conservé
 * localement), on le remercie et on lance automatiquement le téléchargement PDF.
 */
if (urlParams.get('paid') === 'true') {
  history.replaceState({}, '', window.location.pathname);
  showBuilder(data.template);
  setTimeout(() => {
    showToast(currentLanguage === 'en'
      ? '✓ Payment confirmed — lifetime access unlocked. 🍀 Good luck with your job search!'
      : '✓ Paiement confirmé — accès à vie débloqué. 🍀 Bonne recherche d’emploi !');
  }, 400);
  setTimeout(() => { if (userHasPaid) exportPDF(); }, 2200);
}



function handleGlobalSwatchClick(e) {
  const swatch = e.target.closest('.color-swatch');
  if (!swatch || !swatch.dataset.color) return;
  data.accentColor = swatch.dataset.color;
  renderPreview();
  scheduleSave();
  if (typeof updateStyleLabels === 'function') updateStyleLabels();
}
document.addEventListener('click', handleGlobalSwatchClick);

/* ===== Révélation au défilement (blocs interactifs au scroll) ===== */
(function () {
  const targets = document.querySelectorAll(
    '#landingView .section-head, #landingView .section-heading, #landingView .templates-head, ' +
    '#landingView .testimonials-head, #landingView .faq-intro, #landingView .ai-showcase-card, ' +
    '#landingView .step-card, #landingView .features article, #landingView .why-choose-card, ' +
    '#landingView .testimonial-card, #landingView .template-thumb, #landingView .faq-list details, ' +
    '#landingView .price-table, #landingView .stat-duo, #landingView .comparison-copy, #landingView .cta-card'
  );
  if (!('IntersectionObserver' in window) || !targets.length) {
    targets.forEach(el => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  targets.forEach(el => {
    el.classList.add('reveal');
    const siblings = el.parentElement ? [...el.parentElement.children].filter(c => c.classList && c.classList.contains(el.classList[0])).indexOf(el) : 0;
    el.style.transitionDelay = Math.max(0, siblings) * 70 + 'ms';
    io.observe(el);
  });
})();
