import { translations } from './translations.js';
import { BrowserProvider, Contract, formatUnits } from "ethers";

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


const BIMCOIN_ADDRESS = "0xE464B8A1FAaC982dEe365D9fB3aC1100737Ef4B5";
const BIMCOIN_ABI = [
  { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "allowance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientAllowance", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "balance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientBalance", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "approver", "type": "address" }], "name": "ERC20InvalidApprover", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }], "name": "ERC20InvalidReceiver", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }], "name": "ERC20InvalidSender", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }], "name": "ERC20InvalidSpender", "type": "error" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" },
  { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" },
  { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];



async function updateBIMCoinInfo() {
  if (!window.ethereum) {
    console.warn("❗️ No hi ha MetaMask o provider disponible.");
    return;
  }

  try {
    console.log("🔌 Connectant amb provider...");
    const provider = new BrowserProvider(window.ethereum);

    console.log("🔐 Obtenint signer...");
    const signer = await provider.getSigner();

    const userAddress = await signer.getAddress();
    console.log("👤 Adreça de l'usuari:", userAddress);

    const contract = new Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, provider);
    console.log("📄 Contracte inicialitzat correctament");

    const [walletRaw, totalRaw, decimals] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.totalSupply(),
      contract.decimals()
    ]);

    console.log("💰 Raw wallet balance:", walletRaw.toString());
    console.log("🏦 Raw total supply:", totalRaw.toString());
    console.log("🔢 Decimals:", decimals);

    const walletBalance = formatUnits(walletRaw.toString(), decimals);
    const totalSupply = formatUnits(totalRaw.toString(), decimals);

    console.log("✅ Formatejat wallet balance:", walletBalance);
    console.log("✅ Formatejat total supply:", totalSupply);

    // Actualitza el DOM
    const walletElem = document.getElementById("walletBalance");
    const totalElem = document.getElementById("totalSupply");

    if (walletElem) {
      walletElem.textContent = `${parseFloat(walletBalance).toFixed(0)} BIMC`;
    } else {
      console.warn("⚠️ No s'ha trobat #walletBalance al DOM");
    }

    if (totalElem) {
      totalElem.textContent = `${parseFloat(totalSupply).toFixed(2)} BIMC`;
    } else {
      console.warn("⚠️ No s'ha trobat #totalSupply al DOM");
    }

  } catch (err) {
    console.error("❌ Error carregant info BIMCoin:", err);
  }
}

updateBIMCoinInfo();



