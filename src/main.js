import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUIC from "@thatopen/ui-obc";
import { BrowserProvider, Contract, formatUnits } from "ethers";
import html2canvas from 'html2canvas';
import * as THREE from "three";
import { jsPDF } from "jspdf";
import { generarCertificatPDF } from './pdf.js';
import { showModal, hideModal, showAlertModal, renderModelInfoHTML } from './modals.js';
import { translations } from "./translations.js"; // O el path correcte
import {
  CONTRACT_ADDRESS,
  BIMCOIN_ADDRESS,
  REGISTRY_ADDRESS,
  BIMCOIN_ABI,
  REGISTRY_ABI,
  CONTRACT_ABI
} from './blockchainConfig.js';

import lighthouse from '@lighthouse-web3/sdk';

const LIGHTHOUSE_API_KEY = '75fbb6cf.d218f26d35d24b0aa509182068439be5';

import introJs from 'intro.js';
import 'intro.js/minified/introjs.min.css';
let activeTab = 'ifc';

//12-09-25
let loadedModels = []; // Array de { uuid, label, object }
//12-09-25
const panelTabsContainer = document.createElement("div");
  panelTabsContainer.className = "panel-tabs-container";
  panelTabsContainer.style.height = "100%";
  panelTabsContainer.style.display = "flex";
  panelTabsContainer.style.flexDirection = "column";

  
window.$ = (id) => document.getElementById(id);
//*****PASSOS EN EL TUTORIAL INTERACTIU */

function getCurrentLang() {
  return localStorage.getItem('lang') || 'ca';
}
const $ = (id) => document.getElementById(id);

function getTranslation() {
  const lang = getCurrentLang();
  return translations[lang] || translations.ca;
}

function updateTabLabels(lang) {
  const t = translations[lang] || translations.ca;
  const tabIds = [
    { id: 'tab-btn-ifc', label: t.tabLoadIFC },
    { id: 'tab-btn-relations', label: t.tabRelations },
    { id: 'tab-btn-classifications', label: t.tabClassifications },
    { id: 'tab-btn-properties', label: t.tabProperties },
    { id: 'tab-btn-bimcoin', label: t.tabBimcoin },
    { id: 'tab-btn-checkhash', label: t.tabCheckhash },
    { id: 'btnCopyAsTSV', label: t.btnCopyAsTSV }

  ];
  tabIds.forEach(tab => {
    const el = document.getElementById(tab.id);
    if (el) el.textContent = tab.label;
  });
}
function addPropertiesTabTranslationListener() {
  const btnProperties = document.getElementById('tab-btn-properties');
  if (btnProperties) {
    btnProperties.addEventListener('click', () => {
      const lang = getCurrentLang();
      updatePanelPropertiesTexts(lang); // Traduïm només el panell propietats
    });
  }
}

function updatePanelPropertiesTexts(lang) {
  const t = translations[lang] || translations.ca;
  const panel = document.getElementById('panel-properties');
  if (panel) panel.setAttribute("label", t.panelProperties);

  const section = document.getElementById('panel-properties-section');
  if (section) section.setAttribute("label", t.sectionPropertiesElementData);

  const btnExpandCollapse = document.getElementById('btn-expand-collapse');
  if (btnExpandCollapse) btnExpandCollapse.setAttribute("label", t.btnExpand); // o t.btnCollapse segons l'estat

  const btnCopyAsTSV = document.getElementById('btnCopyAsTSV');
  if (btnCopyAsTSV) btnCopyAsTSV.setAttribute("label", t.btnCopyAsTSV);

  const txtSearchProperty = document.getElementById('txt-search-property');
  if (txtSearchProperty) txtSearchProperty.setAttribute("placeholder", t.phSearchProperty);
}


const tutorialSteps = [
  { intro: '👋 Benvingut al visor IFC ...' },
  { element: '#tab-btn-ifc', intro: "Des d'aquesta pestanya pots carregar un IFC i consultar el cost de registre. També pots comparar 2 IFC a partir dels seus hash previament registrats." },
  { element: '#tab-btn-relations', intro: "Des d'aquesta pestanya pots seleccionar elements del model IFC." },
  { element: '#tab-btn-classifications', intro: "Des d'aquesta pestanya pots filtrar elements de l'IFC." },
  { element: '#tab-btn-properties', intro: "Des d'aquesta pestanya pots cosnultar les propietats de cadascun dels elements del model IFC." },
  { element: '#tab-btn-bimcoin', intro: "Des d'aquesta pestanya pots registrar el model col·Locant-hi metadates com un nom, versió o descripció." },
  { element:'#tab-btn-checkhash', intro: "Des d'aquesta pestanya pots consultar les metadates del model a partir del seu hash." },
  { element:'#visor', intro: "Visualitzador dels arxius IFC. Un cop es registra l'IFC es genera un pdf que incorpora la imatge final del navegador." },
  // etc.
];

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


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
//*****FUNCIÓ QUE PUJA UN FITXER A LIGHTHOUSE I RETONR EL SEU CID (CONTENT IDENTIFIER) */

async function uploadToLighthouse(file) {
  try {
    // La funció 'lighthouse.upload' requereix un array de fitxers, per això es posa [file]
    // LIGHTHOUSE_API_KEY és la clau d'accés personal per autenticar-se amb l'API de Lighthouse
    const response = await lighthouse.upload([file], LIGHTHOUSE_API_KEY);

    // Comprovem si la resposta és vàlida i conté un hash (CID)
    if (response && response.data && response.data.Hash) {
      // Guardem el CID (Content Identifier) retornat per Lighthouse
      const cid = response.data.Hash;

      // Opcional: aquí podríem mostrar un missatge de confirmació a l’usuari
      // Ex: alert(`✅ Fitxer pujat correctament!\n\nCID: ${cid}`);
      alert(`✅ Fitxer pujat correctament!\n\nCID: ${cid}`);
      console.log("🔗 CID IPFS:", cid);
      console.log("🌐 URL d'accés:", `https://gateway.lighthouse.storage/ipfs/${cid}/jj.ifc`);

      // Retornem el CID per poder-lo utilitzar més endavant (ex: guardar-lo en una base de dades o blockchain)
      return cid;

    } else {
      // Si no obtenim un CID, informem l'usuari de l'error
      alert("❌ Error: No s'ha pogut obtenir el CID.");
    }

  } catch (err) {
    // Captura qualsevol error (com problemes de xarxa o resposta invàlida)
    // Mostra l’error a l’usuari amb un missatge personalitzat
    alert(`❌ Error pujant el fitxer: ${err.message || err}`);
  }
}

let components, world, loadedModel = null;
let fileSizeMB = 0;

async function main() {
  // Inicialitza la UI
  BUI.Manager.init();

  components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);

  world = worlds.create();
  const sceneComponent = new OBC.SimpleScene(components);
  sceneComponent.setup();
  world.scene = sceneComponent;
  //world.scene.three.background = null;

  const viewport = document.createElement("bim-viewport");
  viewport.id = "visor"; // <--- Aquí li assignes l'id
  const rendererComponent = new OBC.SimpleRenderer(components, viewport);
  world.renderer = rendererComponent;

  const cameraComponent = new OBC.SimpleCamera(components);
  world.camera = cameraComponent;
  
  viewport.addEventListener("resize", () => {
    rendererComponent.resize();
    cameraComponent.updateAspect();
  });

  const viewerGrids = components.get(OBC.Grids);
  viewerGrids.create(world);
  
  await components.init();
  
//console.log("🎮 Controls de càmera:", cameraComponent.controls);

// --- IFC Loader i buffer real ---
const ifcLoader = components.get(OBC.IfcLoader);
await ifcLoader.setup();
const fragmentsManager = components.get(OBC.FragmentsManager);

fragmentsManager.onFragmentsLoaded.add((model) => {
  if (world.scene) world.scene.three.add(model);
});

  // ---------- PANEL "CARREGA IFC" 100% REACTIU ----------
  function createIFCLoaderPanel() {
    const t = translations[getCurrentLang()] || translations.ca;
  let fileSizeMB = 0;
  let bimCoinCost = 0;
  let lastLoadedFile = null;

  const panel = document.createElement("div");
  function updateModelList() {
    const container = panel.querySelector("#model-browser-list");
    if (!container) return;
  
    container.innerHTML = loadedModels.map((model, index) => `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:0.6em;">
        <label style="flex:1;">
          <input type="checkbox" data-model="${model.uuid}" checked>
          ${model.label}
        </label>
        <button data-delete="${model.uuid}" style="background:#f44336;color:white;border:none;padding:0.3em 0.6em;border-radius:5px;cursor:pointer;">✖</button>
      </div>
    `).join("");
  
    // Assigna funcionalitat als checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.onchange = () => {
        const model = loadedModels.find(m => m.uuid === cb.dataset.model);
        if (model) model.object.visible = cb.checked;
      };
    });
  
    // Assigna funcionalitat als botons d'eliminació
    container.querySelectorAll('button[data-delete]').forEach(btn => {
      btn.onclick = () => {
        const uuid = btn.dataset.delete;
        const model = loadedModels.find(m => m.uuid === uuid);
        if (model) {
          world.scene.three.remove(model.object);
          loadedModels = loadedModels.filter(m => m.uuid !== uuid);
          updateModelList();
        }
      };
    });
  }
  

  const renderPanel = () => {
    panel.innerHTML = `
      <bim-panel label="Carrega IFC">
        <bim-panel-section label="Carrega">
          <input id="ifc-file-input" type="file" accept=".ifc" style="display:none;">
          <bim-button id="ifc-upload-btn" label="Carrega fitxer IFC"></bim-button>
          ${fileSizeMB > 0 ? `
            <div style="margin-top:1rem; padding:0.6rem 0.8rem; border-radius:6px; background:#e7f6fa; color:#195186; font-size:1.13em;">
              <b>Cost estimat:</b> ${bimCoinCost} BIMCoin 
              <span style="font-size:0.9em; color:#8a8a8a">(${fileSizeMB.toFixed(2)} MB)</span>
            </div>
          ` : ""}
        </bim-panel-section>

        <bim-panel-section label="Comparar dos IFC">
          <input type="text" id="hash1" placeholder="Hash del primer model" style="margin-bottom:0.5rem; width:100%; padding:0.4rem;">
          <input type="text" id="hash2" placeholder="Hash del segon model" style="margin-bottom:0.8rem; width:100%; padding:0.4rem;">
          <bim-button id="btn-compare-ifc" label="Carrega i compara"></bim-button>
          <div id="compare-toggles" style="margin-top:1rem;"></div>
        </bim-panel-section>
        
        <bim-panel-section label="Models carregats">
          <div id="model-browser-list" style="font-size:0.9em;line-height:1.8;"></div>
        </bim-panel-section>

      </bim-panel>
    `;

    // ------------------------- Càrrega fitxer manual -------------------------
    const input = panel.querySelector("#ifc-file-input");
    const btn = panel.querySelector("#ifc-upload-btn");
    btn.onclick = () => input.click();

    input.onchange = async (e) => {
      //13-09-25 Avís que si el fitxer és molt gran
      const file = e.target.files[0];
      if (file.size > 30 * 1024 * 1024) {
        const confirmar = confirm("⚠️ El fitxer és gran (>30 MB). Pot trigar alguns segons a carregar-se. Vols continuar?");
        if (!confirmar) return;
      }
      if (!file) return;
      fileSizeMB = file.size / (1024 * 1024);
      fileSizeMB = Math.max(0.01, parseFloat(fileSizeMB.toFixed(2)));
      bimCoinCost = Math.max(10, Math.ceil(fileSizeMB) * 10);
      lastLoadedFile = file;
      renderPanel();

      showModal("📥 Llegint fitxer...", null, 10);
await delay(400);

const arrayBuffer = await file.arrayBuffer();
window.currentIFCBuffer = arrayBuffer;
window.currentFileSizeMB = fileSizeMB;
window.currentBIMCoinCost = bimCoinCost;

showModal("🧠 Carregant geometria IFC...", null, 30);
await delay(400);

const ifcUint8 = new Uint8Array(arrayBuffer);
loadedModel = await ifcLoader.load(ifcUint8);

showModal("🔗 Processant relacions IFC...", null, 60);
await delay(400);

const indexer = components.get(OBC.IfcRelationsIndexer);
await indexer.process(loadedModel);

showModal("✅ Model carregat correctament!", null, 100);
await delay(1000);
hideModal();

    };

    // ------------------------- Comparar per hash -------------------------
    panel.querySelector("#btn-compare-ifc").onclick = async () => {
      const t = translations[getCurrentLang()] || translations.ca;
      const h1 = panel.querySelector("#hash1").value.trim().toLowerCase();
      const h2 = panel.querySelector("#hash2").value.trim().toLowerCase();
      if (!h1 || !h2) return alert("Introdueix els dos hash!");

      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const ifcLoader = components.get(OBC.IfcLoader);
      const indexer = components.get(OBC.IfcRelationsIndexer);

      const loadModelByHash = async (hash, color) => {
        const info = await contract.getModelInfo(hash);
        const match = info.description.match(/CID:\s*([a-z0-9]+)/i);
        if (!match) throw new Error("CID no trobat a la descripció");
        const cid = match[1];
        
        const res = await fetch(`https://gateway.lighthouse.storage/ipfs/${cid}`);
        const buffer = await res.arrayBuffer();
        const model = await ifcLoader.load(new Uint8Array(buffer));

  // Aplica color i transparència a tots els fragments
  model.traverse(obj => {
  if (obj.isMesh && obj.material) {
    const newMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6
    });
    obj.material = newMat;
  }
});

  await indexer.process(model);
  //12-09-25
  loadedModels.push({ uuid: model.uuid, label: hash.slice(0, 8), object: model });
  updateModelList();
  //12-09-25
};
try {
  showModal(t.modalLoadingModels, null, 15);
  await loadModelByHash(h1, "#ff0000");
  showModal(t.modalSecondModel, null, 55);
  await loadModelByHash(h2, "#00aa00");
  showModal(t.modalModelsLoaded);
  setTimeout(hideModal, 2000);
} catch (err) {
  hideModal();
  alert("❌ Error carregant models: " + (err.message || err));
}
};
};

  renderPanel();
  return panel;
}


  // ---------- Resta de panells ----------
  // ... (Relacions, Classificacions, Propietats, BIMCoin, Comprova Hash...)

  // --- Panell relacions ---
  function createPanelRelations() {
    const t = translations[getCurrentLang()] || translations.ca;
  
    // Torna a crear el relationsTree cada cop per garantir la traducció
    const [relationsTree] = BUIC.tables.relationsTree({ components, models: [] });
    relationsTree.preserveStructureOnFilter = true;
  
    // Handler de cerca (input)
    const onSearch = (e) => {
      const input = /** @type {HTMLInputElement} */ (e.target);
      relationsTree.queryString = input.value;
    };
  
    // Component reactiu
    return BUI.Component.create(() => {
      return BUI.html`
        <bim-panel label="${t.tabRelations}">
          <bim-panel-section label="${t.sectionRelationsSearchTree || 'Search and Tree'}">
            <bim-text-input 
              @input=${onSearch} 
              placeholder="${t.sectionRelationsSearchPlaceholder || 'Search...'}" 
              debounce="200">
            </bim-text-input>
            ${relationsTree}
          </bim-panel-section>
        </bim-panel>
      `;
    });
  }
  
  

  // --- Panell classificacions ---
  const [classificationsTree, updateClassificationsTree] = BUIC.tables.classificationTree({
    components,
    classifications: [],
  });
  const classifier = components.get(OBC.Classifier);
  
  fragmentsManager.onFragmentsLoaded.add(async (model) => {
    classifier.byEntity(model);
    await classifier.byPredefinedType(model);
    const classifications = [
      { system: "entities", label: "Entities" },
      { system: "predefinedTypes", label: "Predefined Types" },
    ];
    updateClassificationsTree({ classifications });
  });
  function getPanelClassifications() {
    const t = translations[getCurrentLang()] || translations.ca;
    return BUI.Component.create(() => {
      return BUI.html`
        <bim-panel label="${t.panelClassifications}">
          <bim-panel-section label="${t.sectionClassificationsTree}">
            ${classificationsTree}
          </bim-panel-section>
        </bim-panel>
      `;
    });
  }

  // --- Panell propietats ---
  const [propertiesTable, updatePropertiesTable] = BUIC.tables.elementProperties({
    components,
    fragmentIdMap: {},
  });
  propertiesTable.preserveStructureOnFilter = true;
  propertiesTable.indentationInText = false;
  function getPanelProperties() {
    const t = translations[getCurrentLang()] || translations.ca;
    return BUI.Component.create(() => {
      const onTextInput = (e) => {
        const input = /** @type {HTMLInputElement} */ (e.target);
        propertiesTable.queryString = input.value !== "" ? input.value : null;
      };
      const expandTable = () => {
        propertiesTable.expanded = !propertiesTable.expanded;
      };
      const copyAsTSV = async () => {
        const tsv = propertiesTable.tsv;
        await navigator.clipboard.writeText(tsv);
        const blob = new Blob([tsv], { type: "text/tab-separated-values" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "propietats.tsv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
      return BUI.html`
        <bim-panel label="${t.panelProperties}">
          <bim-panel-section label="${t.sectionPropertiesElementData}">
            <div style="display: flex; gap: 0.5rem;">
              <bim-button @click=${expandTable} label="${propertiesTable.expanded ? t.btnCollapse : t.btnExpand}"></bim-button>
              <bim-button @click=${copyAsTSV} label="${t.btnCopyAsTSV}"></bim-button>
            </div>
            <bim-text-input @input=${onTextInput} placeholder="${t.phSearchProperty}" debounce="250"></bim-text-input>
            ${propertiesTable}
          </bim-panel-section>
        </bim-panel>
      `;
    });
  }

// ===============================
  // FORMULARI BIMCoin i registreModel
  // ===============================
  function createPanelBIMCoin() {
    // Variables d'estat locals (es reinicien cada vegada que canvies idioma/pestanya)
    let formData = {
      filename: "",
      version: "",
      description: "",
      datetime: new Date().toISOString().slice(0, 16),
    };
  
    let lastHash = null;
    let showHashBox = false;
  
    return BUI.Component.create(() => {
      const t = translations[getCurrentLang()] || translations.ca;
  
      // --- Funció per registrar model ---
      const registerModel = async () => {
        if (!currentIFCBuffer) {
          alert(t.errLoadFile || "Carrega un model IFC primer!");
          hideProgressBar && hideProgressBar();
          return;
        }
  
        if (!formData.filename || !formData.version || !formData.description || !formData.datetime) {
          showAlertModal(t.errFillFields || "Si us plau, omple tots els camps!");
          return;
        }
  
        showModal(t.modalConnectingWallet, null, 10);
        await delay(2000);
  
        if (!window.ethereum) {
          hideModal();
          showAlertModal(t.errorNoMetaMask || "Instal·la MetaMask primer!");
          return;
        }
  
        try {
          const provider = new BrowserProvider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();
  
          const registerContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          const tokenContract = new Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, signer);
  
          showModal(t.modalCalculatingHash, null, 20);
          await delay(2000);
          const hashBuffer = await crypto.subtle.digest('SHA-256', currentIFCBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
  
          showModal(t.modalCheckingIfRegistered, null, 28);
          await delay(2000);
          const alreadyRegistered = await registerContract.isModelRegistered(hashHex);
  
          if (alreadyRegistered) {
            const info = await registerContract.getModelInfo(hashHex);
            hideModal();
            showAlertModal(
              t.alreadyRegistered || "Aquest model ja està registrat!",
              renderModelInfoHTML({
                [t.filename || "Nom"]: info.filename,
                [t.hash || "Hash"]: hashHex,
                [t.version || "Versió"]: info.version,
                [t.description || "Descripció"]: info.description,
                [t.datetime || "Data/hora"]: info.datetime,
                [t.author || "Autor"]: info.author
              }),
              t.btnClose || "Tancar",
              { large: true, html: true }
            );
            return;
          }
  
          showModal(t.modalCheckingBalance, null, 35);
          await delay(2000);
          const decimals = await tokenContract.decimals();
          const amount = BigInt(Math.floor(window.currentBIMCoinCost)) * (10n ** BigInt(decimals));
          const balance = await tokenContract.balanceOf(userAddress);
  
          if (balance < amount) {
            hideModal();
            showAlertModal(t.errNoBIMCoin || "❌ No tens prou BIMCoins!");
            return;
          }
  
          showModal(t.modalPaying, null, 45);
          await delay(2000);
          const txPayment = await tokenContract.transfer(CONTRACT_ADDRESS, amount);
          await txPayment.wait();
          updateBIMCoinInfo && updateBIMCoinInfo();
  
          showModal(t.modalUploadingIPFS, null, 65);
          await delay(2000);
          const file = new File([currentIFCBuffer], formData.filename || "model.ifc");
          let cid;
          try {
            cid = await uploadToLighthouse(file);
          } catch (err) {
            hideModal();
            showAlertModal(
              t.errUploadingIPFS || "Error pujant el fitxer a IPFS:",
              (err && err.message) ? err.message : (err || "Error desconegut"),
              t.btnClose || "Tancar"
            );
            return;
          }
  
          showModal(t.modalCapturingImage, null, 80);
          await delay(2000);
          let imageCid = null;
          try {
            const renderer = world.renderer.three;
            renderer.render(world.scene.three, world.camera.three);
            const dataURL = renderer.domElement.toDataURL("image/png");
            const imageBlob = base64ToBlob(dataURL, 'image/png');
            const imageFile = new File([imageBlob], "captura.png", { type: "image/png" });
            imageCid = await uploadToLighthouse(imageFile);
          } catch (err) {
            imageCid = null; // No bloqueja!
          }
  
          showModal(t.modalRegisteringBlockchain, null, 92);
          await delay(2000);
          const fileSizeMB = window.currentFileSizeMB || 0;
          let desc = formData.description + `\nCID: ${cid}\nMB: ${fileSizeMB.toFixed(2)}`;
          if (imageCid) desc += `\nIMG: ${imageCid}`;
  
          const tx = await registerContract.registerModel(
            hashHex,
            formData.filename,
            formData.version,
            desc,
            formData.datetime
          );
          await tx.wait();
          try {
            lastHash = hashHex;
            showHashBox = true;
            if (typeof renderPanelTabs === 'function') renderPanelTabs();
          } catch (e) {
            console.warn("No s'ha pogut actualitzar el panell:", e);
          }
          
  
          const arxiuInfo = {
            nom: formData.filename,
            hash: hashHex,
            data: formData.datetime,
            descripcio: formData.description,
            cid: cid,
            imageCid: imageCid
          };
          showModal(t.modalRegisteredOk, arxiuInfo);
          await delay(4000);
          setTimeout(hideModal, 1400);
        } catch (e) {
          hideModal();
          showAlertModal(
            t.errDuringRegister || "❌ Error durant el registre:",
            (e && e.message) ? e.message : (e || "Error desconegut"),
            t.btnClose || "Tancar"
          );
        }
      };
  
      // --- HANDLERS FORMULARI ---
      const onInput = (field) => (e) => {
        formData[field] = e.target.value;
      };
  
      // --- Render panel ---
      return BUI.html`
        <bim-panel label="${t.tabBimcoin}">
          <bim-panel-section label="${t.registerSection || 'Registre Model'}">
            <form style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem;" onsubmit="return false;">
              <input placeholder="${t.filenamePlaceholder || 'Nom del fitxer/Identificador'}"
                     value="${formData.filename}" 
                     @input="${onInput('filename')}" 
                     style="padding:0.5rem;border-radius:4px;border:1px solid #ccc;">
              <input placeholder="${t.versionPlaceholder || 'Versió o checksum'}"
                     value="${formData.version}"
                     @input="${onInput('version')}"
                     style="padding:0.5rem;border-radius:4px;border:1px solid #ccc;">
              <input placeholder="${t.descriptionPlaceholder || 'Descripció/Tipus de model'}"
                     value="${formData.description}"
                     @input="${onInput('description')}"
                     style="padding:0.5rem;border-radius:4px;border:1px solid #ccc;">
              <input type="datetime-local"
                     value="${formData.datetime}"
                     @input="${onInput('datetime')}"
                     style="padding:0.5rem;border-radius:4px;border:1px solid #ccc;">
            </form>
            <bim-button label="${t.btnRegisterModel || 'Registrar IFC a Blockchain'}" @click=${registerModel}></bim-button>
  
            ${showHashBox && lastHash ? BUI.html`
              <div style="margin-top:1rem;padding:0.5rem;background:#f3f3f3;border-radius:8px;">
                <div><strong>${t.hashRegistered || 'Hash del model registrat:'}</strong></div>
                <div style="font-family:monospace;word-break:break-all;">${lastHash}</div>
                <bim-button style="margin-top:0.5rem;" label="${t.btnCopyHash || 'Copia hash'}" 
                  @click=${async () => {
                    await navigator.clipboard.writeText(lastHash);
                    alert(t.hashCopied || "Hash copiat al porta-retalls!");
                  }}>
                </bim-button>
              </div>
            ` : ""}
          </bim-panel-section>
        </bim-panel>
      `;
    });
  }
  
  
    // ===============================
    // Panell "Comprova Hash"
    // ===============================
    function createCheckHashPanel() {
    let inputHash = "";
    let infoResult = null;
    let errorMsg = "";
  
    const panel = document.createElement("div");
  
    const renderPanel = () => {
      panel.innerHTML = "";
      // Crea el contingut com HTML real!
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = `
        <bim-panel label="Comprova Hash">
          <bim-panel-section label="Consulta">
            <input placeholder="Enganxa el hash aquí"
                   value="${inputHash}"
                   style="padding:0.5rem;width:100%;max-width:32rem;min-width:14rem;box-sizing:border-box;border-radius:4px;border:1px solid #ccc;">
            <bim-button label="Comprova registre" style="margin-top:0.5rem; width: 100%;"></bim-button>
            ${errorMsg ? `<div style="color:red;margin-top:0.5rem;">${errorMsg}</div>` : ""}
            ${infoResult ? `
              <div style="margin-top:1rem;">
                <strong>Nom:</strong> ${infoResult.filename}<br>
                <strong>Versió:</strong> ${infoResult.version}<br>
                <strong>Descripció:</strong> ${infoResult.description}<br>
                <strong>Data/Hora:</strong> ${infoResult.datetime}<br>
                <strong>Autor:</strong> ${infoResult.author}
              </div>
            ` : ""}
          </bim-panel-section>
        </bim-panel>
      `;
      panel.appendChild(tempDiv.firstElementChild);
  
      // Gestiona esdeveniments
      const input = panel.querySelector("input");
      const btn = panel.querySelector("bim-button"); // <-- ARA ÉS bim-button!
  
      input && input.addEventListener("input", (e) => {
        inputHash = e.target.value.trim().toLowerCase();
        infoResult = null;
        errorMsg = "";
        renderPanel();
      });
  
      btn && btn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!inputHash) {
          errorMsg = "Posa un hash per validar!";
          infoResult = null;
          renderPanel();
          return;
        }
        try {
          const provider = new BrowserProvider(window.ethereum);
          const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          const exists = await contract.isModelRegistered(inputHash);
          if (!exists) {
            errorMsg = "No registrat a la blockchain.";
            infoResult = null;
          } else {
            const info = await contract.getModelInfo(inputHash);
            infoResult = info;
            errorMsg = "";
          }
          renderPanel();
        } catch (e) {
          errorMsg = "Error consultant: " + (e.message || e);
          infoResult = null;
          renderPanel();
        }
      });
    };
  
    renderPanel();
    return panel;
  }

  // ----------- PESTANYES AMB EL NOU PANEL -----------
  function getTabs() {
  const t = translations[getCurrentLang()] || translations.ca;
  return [
    { key: 'ifc', label: t.tabLoadIFC, panel: createIFCLoaderPanel() },
    { key: 'relations', label: t.tabRelations, panel: createPanelRelations() },
    { key: 'classifications', label: t.tabClassifications, panel: getPanelClassifications() },
    { key: 'properties', label: t.tabProperties, panel: getPanelProperties() },
    { key: 'bimcoin', label: t.tabBimcoin, panel: createPanelBIMCoin() },
    { key: 'checkhash', label: t.tabCheckhash, panel: createCheckHashPanel() }
  ];
}

 

  

  function renderPanelTabs() {
    panelTabsContainer.innerHTML = "";
    const tabs = getTabs();

    // Pestanyes
    const tabBar = document.createElement("div");
    tabBar.className = "panel-tabs-bar";
    tabs.forEach(tab => {
      const btn = document.createElement("button");
      btn.textContent = tab.label;
      btn.className = activeTab === tab.key ? "active" : "";
      // AFEGEIX L'ID AMB UN PREFIX PER NO XOCAR
      btn.id = `tab-btn-${tab.key}`; // Ex: tab-btn-ifc, tab-btn-relations, etc.
      btn.onclick = () => {
        activeTab = tab.key;
        renderPanelTabs();
        //updatePanelPropertiesTexts(lang);
      
      };
      tabBar.appendChild(btn);
    });

    panelTabsContainer.appendChild(tabBar);

    // Contingut de la pestanya activa
    const content = document.createElement("div");
    content.className = "panel-tabs-content";
    content.appendChild(tabs.find(tab => tab.key === activeTab).panel);

    panelTabsContainer.appendChild(content);
  }
  renderPanelTabs();
  

  // --- Layout final ---
  const app = document.createElement("bim-grid");
  app.layouts = {
    main: {
      template: `
        "panel viewport"
        / 40rem 1fr
      `,
      elements: {
        panel: panelTabsContainer,
        viewport: viewport,
      },
    },
  };
  app.layout = "main";
  document.body.append(app);

  // Highlighter per actualitzar taula propietats
  const highlighter = components.get(OBCF.Highlighter);
  highlighter.setup({ world });
  highlighter.events.select.onHighlight.add((fragmentIdMap) => {
    updatePropertiesTable({ fragmentIdMap });
  });
  highlighter.events.select.onClear.add(() => {
    updatePropertiesTable({ fragmentIdMap: {} });
  });

  // Relations tree indexer (opcional)
  const indexer = components.get(OBC.IfcRelationsIndexer);
  fragmentsManager.onFragmentsLoaded.add(async (model) => {
    if (model.hasProperties) await indexer.process(model);
  });
}

main();


function base64ToBlob(dataURL, mimeType) {
  const byteString = atob(dataURL.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
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
    const lang = e.target.value;
    localStorage.setItem('lang', lang);
    //location.reload(); // Això provoca un F5 automàtic
    renderLang(lang);
    activeTab = 'ifc';     // <---- AFEGEIX AIXÒ!
    //renderPanelTabs();
    updateTabLabels(lang);
    updatePanelPropertiesTexts(lang);
    addPropertiesTabTranslationListener(lang);
    
    
  });
  
});

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




