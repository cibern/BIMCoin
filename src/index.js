import { translations } from './translations.js';
import { BrowserProvider, Contract, formatUnits } from "ethers";
import {
  CONTRACT_ADDRESS,
  BIMCOIN_ADDRESS,
  REGISTRY_ADDRESS,
  BIMCOIN_ABI,
  REGISTRY_ABI
} from './blockchainConfig.js';

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

//FUNCIÓ QUE ACTUALITZA LA QUANITAT DE BIMCOINS QUE TÉ L'USUARI
async function updateBIMCoinInfo() {
  if (!window.ethereum) {
    console.warn("❗️ No hi ha MetaMask o provider disponible.");
    return;
  }

  try {
    //console.log("🔌 Connectant amb provider...");
    const provider = new BrowserProvider(window.ethereum);

    //console.log("🔐 Obtenint signer...");
    const signer = await provider.getSigner();

    const userAddress = await signer.getAddress();
    //console.log("👤 Adreça de l'usuari:", userAddress);

    const contract = new Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, provider);
    //console.log("📄 Contracte inicialitzat correctament");

    const [walletRaw, totalRaw, decimals] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.totalSupply(),
      contract.decimals()
    ]);

    //console.log("💰 Raw wallet balance:", walletRaw.toString());
    //console.log("🏦 Raw total supply:", totalRaw.toString());
    //console.log("🔢 Decimals:", decimals);

    const walletBalance = formatUnits(walletRaw.toString(), decimals);
    const totalSupply = formatUnits(totalRaw.toString(), decimals);

    //console.log("✅ Formatejat wallet balance:", walletBalance);
    //console.log("✅ Formatejat total supply:", totalSupply);

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
      //console.warn("⚠️ No s'ha trobat #totalSupply al DOM");
    }

  } catch (err) {
    console.error("❌ Error carregant info BIMCoin:", err);
  }
}

updateBIMCoinInfo();

//FUNCIÓ QUE ACTUALITZAR LES DADES DE TRANSPARÈNCIA DE BIMCOIN
async function updateTransparencyInfo() {
  try {
    if (!window.ethereum) throw new Error("MetaMask no detectat");

    const provider = new BrowserProvider(window.ethereum);
    const contract = new Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, provider);
    const modelContract = new Contract(MODELS_ADDRESS, MODELS_ABI, provider);
    const modelEvents = await modelContract.queryFilter(modelContract.filters.ModelRegistered());
    const numModels = modelEvents.length;
    const decimals = await contract.decimals();

    // Consulta events Transfer
    const filter = contract.filters.Transfer();
    const logs = await contract.queryFilter(filter);

    // Número total de transaccions
    const txCount = logs.length;

    // Total BIMCoins transferits (formatUnits retorna string decimal)
    let totalVolume = logs.reduce((sum, log) => sum + log.args.value, 0n);
    let totalVolumeHuman = formatUnits(totalVolume, decimals);
    // → Mostra només la part sencera (sense decimals)
    let totalVolumeRounded = Math.floor(Number(totalVolumeHuman));

    // Darrera transacció
    let lastTx = logs.length ? logs[logs.length - 1] : null;
    let lastTxInfo = lastTx
      ? `Hash: <a href="https://sepolia.etherscan.io/tx/${lastTx.transactionHash}" target="_blank" style="color:#2379ca;">${lastTx.transactionHash.slice(0, 10)}...</a>`
      : "—";

    // 4. Nº de holders (usuaris únics que han rebut tokens alguna vegada)
    const uniqueAddresses = new Set();
    logs.forEach(log => {
      uniqueAddresses.add(log.args.to.toLowerCase());
      uniqueAddresses.add(log.args.from.toLowerCase());
    });
    uniqueAddresses.delete("0x0000000000000000000000000000000000000000");
    const holders = uniqueAddresses.size;

     // 5. Saldo actual del contracte (wallet)
    const contractBalanceRaw = await contract.balanceOf(CONTRACT_ADDRESS);
const contractBalance = Math.floor(Number(formatUnits(contractBalanceRaw, decimals)));


    // Actualitza la web
    document.getElementById("tx-count").textContent = txCount;
    document.getElementById("tx-volume").textContent = totalVolumeRounded + " BIMC";
    document.getElementById("last-tx").innerHTML = lastTxInfo;
    document.getElementById("tx-holders").innerHTML = holders;
    document.getElementById("contract-balance").textContent = contractBalance + " BIMC";
    document.getElementById("num-models").textContent = numModels;

    
  } catch (err) {
    document.getElementById("tx-count").textContent = "-";
    document.getElementById("tx-volume").textContent = "-";
    document.getElementById("last-tx").textContent = "-";
  }
}
const MODELS_ADDRESS = REGISTRY_ADDRESS;
const MODELS_ABI = REGISTRY_ABI;
updateTransparencyInfo();



