import { translations } from './translations.js';

// Helper curt per seleccionar per id
const $ = id => document.getElementById(id);

function renderLang(lang) {
  const t = translations[lang];
  if (!t) return;
  $("logo-title").textContent = t.logo;
  $("subtitle").innerHTML = t.subtitle;
  if ($("why-title")) $("why-title").textContent = t.whyTitle;
  if ($("why-list")) $("why-list").innerHTML = t.whyList.map(x => `<li>${x}</li>`).join('');
  if ($("how-title")) $("how-title").textContent = t.howTitle;
  if ($("how-list")) $("how-list").innerHTML = t.howList.map(x => `<li>${x}</li>`).join('');
  if ($("cta-desc")) $("cta-desc").textContent = t.ctaDesc;
  if ($("cta-link")) $("cta-link").textContent = t.ctaBtn;
  if ($("cta-help")) $("cta-help").innerHTML = t.ctaHelp;
  if ($("who-title")) $("who-title").textContent = t.whoTitle;
  if ($("who-list")) $("who-list").innerHTML = t.whoList.map(x => `<li>${x}</li>`).join('');
  if ($("adv-title")) $("adv-title").textContent = t.advTitle;
  if ($("adv-list")) $("adv-list").innerHTML = t.advList.map(x => `<li>${x}</li>`).join('');
  if ($("faq-title")) $("faq-title").textContent = t.faqTitle;
  if ($("faq-list")) $("faq-list").innerHTML = t.faq.map(f => `
    <div class="faq-item">
      <div class="faq-q">${f.q}</div>
      <div class="faq-a">${f.a}</div>
    </div>
  `).join('');
  if ($("contact-link")) $("contact-link").textContent = t.contact;
  document.documentElement.lang = lang;
}

// Inicialitza amb l’idioma per defecte o navegador
function getDefaultLang() {
  const nav = navigator.language || "ca";
  if (translations[nav.slice(0,2)]) return nav.slice(0,2);
  return "ca";
}

document.addEventListener("DOMContentLoaded", () => {
  const initLang = getDefaultLang();
  $("lang-selector").value = initLang;
  renderLang(initLang);

  $("lang-selector").addEventListener("change", e => {
    renderLang(e.target.value);
  });
});
