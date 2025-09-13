import { translations } from './translations.js';
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import {
  CONTRACT_ADDRESS,
  BIMCOIN_ADDRESS,
  REGISTRY_ADDRESS,
  BIMCOIN_ABI,
  REGISTRY_ABI
} from './blockchainConfig.js';

import introJs from 'intro.js';
import 'intro.js/minified/introjs.min.css';

const tutorialSteps = [
  { intro: '👋 Benvingut a BIMCoin! ...' },
  { element: '#nav-visor', intro: "Accedeix al visor per veure i registrar els teus models BIM." },
  { element: '#payment-mockup-section', intro: "Compra BIMCoins per poder fer el registre." },
  { element: '#walletBalance', intro: "💰 Aquí veuràs el saldo de BIMCoins." },
  { element: '#hash-input', intro: "Des d'aquí et podràs descarregar qualsevol model IFC a partir del seu hash." },
  { element: '#transparency-info', intro: "Des d'aquest apartat podràs comprovar la trasnperència de l'entorn." },
   { element: '#lang-selector', intro: "Des d'aquest menú desplegable podràs escollir." },
  // etc.
];

// ------------ MOCKUP PASSAREL·LA EURO → BIMCOIN + WALLET ------------
// ------------ MOCKUP PASSAREL·LA EURO → BIMCOIN + WALLET ------------

// Algoritme de Luhn per validar targetes de crèdit
function isValidCardNumber(cardNumber) {
  const num = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function showPaymentError(msg) {
  const resultDiv = document.getElementById("bimcoin-transfer-result");
  resultDiv.textContent = msg;
  resultDiv.style.color = "red";
  resultDiv.style.display = "block";
  setTimeout(() => { resultDiv.style.display = "none"; }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mockup-payment-form");
  if (form) {
    form.onsubmit = async function(e) {
      e.preventDefault();

      // VALIDACIÓ DE CAMPS
      const euros = parseFloat(document.getElementById("payment-amount").value) || 0;
      if (euros <= 0) return showPaymentError("Import no vàlid");

      const cardInput = form.querySelector('input[placeholder="1234 5678 9012 3456"]');
      const card = cardInput.value.replace(/\s+/g, '');
      if (!/^\d{16}$/.test(card) || !isValidCardNumber(card)) {
        return showPaymentError("Número de targeta no vàlid");
      }

      // Caducitat
      const expiryInput = document.getElementById("mesAny");
      if (!expiryInput.value || !/^\d{4}-\d{2}$/.test(expiryInput.value)) {
        return showPaymentError("Data de caducitat no vàlida");
      }
      const [year, month] = expiryInput.value.split("-");
      const expiryDate = new Date(Number(year), Number(month) - 1, 1);
      const now = new Date();
      if (
        expiryDate.getFullYear() < now.getFullYear() ||
        (expiryDate.getFullYear() === now.getFullYear() && expiryDate.getMonth() < now.getMonth())
      ) {
        return showPaymentError("La targeta està caducada");
      }

      // CVC
      const cvcInput = form.querySelector('input[placeholder="123"]');
      const cvc = cvcInput.value.trim();
      if (!/^\d{3,4}$/.test(cvc)) {
        return showPaymentError("Codi CVC no vàlid");
      }

      document.getElementById("mockup-payment-result").style.display = "block";
      document.getElementById("mockup-payment-result").textContent = "💳 Processant pagament...";

      // Ratio de conversió: 1 € = 10 BIMCoin
      const ratio = 10;
      const bimcAmount = euros * ratio;

      setTimeout(async () => {
        document.getElementById("mockup-payment-result").textContent = "Pagament acceptat! Transferint BIMCoins...";

        let msg = "";
        try {
          if (!window.ethereum) throw new Error("Necessites MetaMask!");
          const provider = new BrowserProvider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();

          // Demana al backend que faci el transfer
          const res = await fetch("http://localhost:3030/send-bimcoin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress: userAddress,
              amount: bimcAmount // pots enviar en BIMC, el backend el convertirà a decimals
            })
          });
          const data = await res.json();
          if (data.status === "ok") {
            msg = `✅ S'han transferit ${bimcAmount} BIMCoins a la teva wallet (${userAddress.slice(0,7)}...)! Tx: ${data.txHash}`;
            let count = 0;
  const interval = setInterval(() => {
    updateBIMCoinInfo();
    if (++count > 6) clearInterval(interval); // S'atura als 30s
  }, 5000);
          } else {
            msg = "❌ Error transferint BIMCoins: " + (data.error || "");
          }
        } catch (err) {
          msg = "❌ Error transferint BIMCoins: " + (err.message || err);
        }
        document.getElementById("mockup-payment-result").style.display = "none";
        const resultDiv = document.getElementById("bimcoin-transfer-result");
        resultDiv.textContent = msg;
        resultDiv.style.color = msg.startsWith("✅") ? "#124c8d" : "red";
        resultDiv.style.display = "block";
        setTimeout(() => resultDiv.style.display = "none", 3500);
        document.getElementById("mockup-payment-form").reset();
      }, 1800);
    }
  }
  
});




// ---------------- RESTA DEL TEU JS SENSE MODIFICAR ------------------

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
  if ($("nav-home")) $("nav-home").textContent = t.navHome;
  if ($("nav-visor")) $("nav-visor").textContent = t.navVisor;
  if ($("nav-verify")) $("nav-verify").textContent = t.navVerify;
  if ($("nav-objectiu")) $("nav-objectiu").textContent = t.navPurpose;
  if ($("nav-faq")) $("nav-faq").textContent = t.navFaq;
  if ($("bimc-euro-info")) $("bimc-euro-info").innerHTML = t.bimcEuroInfo;
  if ($("download-title")) $("download-title").textContent = t.downloadTitle;
  if ($("download-label")) $("download-label").textContent = t.downloadLabel;
  if ($("hash-input")) $("hash-input").placeholder = t.downloadPlaceholder;
  if ($("download-btn")) $("download-btn").textContent = t.downloadBtn;
  if ($("transparency-title")) $("transparency-title").innerHTML = t.transparencyTitle;
  if ($("transparency-tx")) $("transparency-tx").innerHTML = t.transparencyTx;
  if ($("transparency-volume")) $("transparency-volume").innerHTML = t.transparencyVolume;
  if ($("transparency-holders")) $("transparency-holders").innerHTML = t.transparencyHolders;
  if ($("transparency-contract")) $("transparency-contract").innerHTML = t.transparencyContract;
  if ($("transparency-last")) $("transparency-last").innerHTML = t.transparencyLast;
  if ($("transparency-num-models")) $("transparency-num-models").innerHTML = t.transparencyNumModels;
  if ($("buy-title")) $("buy-title").textContent = t.buyTitle;
  if ($("buy-amount-label")) $("buy-amount-label").childNodes[0].nodeValue = t.buyAmountLabel + "\n";
  if ($("buy-card-label")) $("buy-card-label").childNodes[0].nodeValue = t.buyCardLabel + "\n";
  if ($("buy-card-input")) $("buy-card-input").placeholder = t.buyCardPlaceholder;
  if ($("buy-expiry-label")) $("buy-expiry-label").childNodes[0].nodeValue = t.buyExpiryLabel + "\n";
  if ($("buy-cvc-label")) $("buy-cvc-label").childNodes[0].nodeValue = t.buyCvcLabel + "\n";
  if ($("buy-cvc-input")) $("buy-cvc-input").placeholder = t.buyCvcPlaceholder;
  if ($("buy-btn")) $("buy-btn").textContent = t.buyBtn;
  if ($("mockup-payment-result")) $("mockup-payment-result").textContent = ""; // O es mostra des del JS de validació

  if ($("contact-link")) $("contact-link").textContent = t.contact;
  document.documentElement.lang = lang;
}

function getDefaultLang() {
  const nav = navigator.language || "ca";
  if (translations[nav.slice(0,2)]) return nav.slice(0,2);
  return "ca";
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const tutBtn = document.getElementById('tutorial-btn-float');
    if (tutBtn) {
      tutBtn.onclick = (e) => {
        e.preventDefault();
        introJs().setOptions({ steps: tutorialSteps, showProgress: true }).start();
      };
    } else {
      console.warn('No s\'ha trobat el botó tutorial!');
    }
  }, 0);
  const initLang = getDefaultLang();
  $("lang-selector").value = initLang;
  renderLang(initLang);

  $("lang-selector").addEventListener("change", e => {
    renderLang(e.target.value);
  });
});

async function updateBIMCoinInfo() {
  if (!window.ethereum) {
    console.warn("❗️ No hi ha MetaMask o provider disponible.");
    return;
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const contract = new Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, provider);
    const [walletRaw, totalRaw, decimals] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.totalSupply(),
      contract.decimals()
    ]);
    const walletBalance = formatUnits(walletRaw.toString(), decimals);
    const totalSupply = formatUnits(totalRaw.toString(), decimals);
    const walletElem = document.getElementById("walletBalance");
    const totalElem = document.getElementById("totalSupply");
    if (walletElem) walletElem.textContent = `${parseFloat(walletBalance).toFixed(0)} BIMC`;
    if (totalElem) totalElem.textContent = `${parseFloat(totalSupply).toFixed(2)} BIMC`;
  } catch (err) {
    console.error("❌ Error carregant info BIMCoin:", err);
  }
}
updateBIMCoinInfo();

async function updateTransparencyInfo() {
  try {
    if (!window.ethereum) throw new Error("MetaMask no detectat");
    const provider = new BrowserProvider(window.ethereum);
    const contract = new Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, provider);
    const modelContract = new Contract(MODELS_ADDRESS, MODELS_ABI, provider);
    const modelEvents = await modelContract.queryFilter(modelContract.filters.ModelRegistered());
    const numModels = modelEvents.length;
    const decimals = await contract.decimals();
    const filter = contract.filters.Transfer();
    const logs = await contract.queryFilter(filter);
    const txCount = logs.length;
    let totalVolume = logs.reduce((sum, log) => sum + log.args.value, 0n);
    let totalVolumeHuman = formatUnits(totalVolume, decimals);
    let totalVolumeRounded = Math.floor(Number(totalVolumeHuman));
    let lastTx = logs.length ? logs[logs.length - 1] : null;
    let lastTxInfo = lastTx
      ? `Hash: <a href="https://sepolia.etherscan.io/tx/${lastTx.transactionHash}" target="_blank" style="color:#2379ca;">${lastTx.transactionHash.slice(0, 10)}...</a>`
      : "—";
    const uniqueAddresses = new Set();
    logs.forEach(log => {
      uniqueAddresses.add(log.args.to.toLowerCase());
      uniqueAddresses.add(log.args.from.toLowerCase());
    });
    uniqueAddresses.delete("0x0000000000000000000000000000000000000000");
    const holders = uniqueAddresses.size;
    const contractBalanceRaw = await contract.balanceOf(CONTRACT_ADDRESS);
    const contractBalance = Math.floor(Number(formatUnits(contractBalanceRaw, decimals)));
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


