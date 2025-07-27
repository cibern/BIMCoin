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

//*****PASSOS EN EL UTORIAL INTERACTIU */

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
  let fileSizeMB = 0;
  let bimCoinCost = 0;
  let lastLoadedFile = null;

  const panel = document.createElement("div");

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
        </bim-panel-section>
      </bim-panel>
    `;

    // ------------------------- Càrrega fitxer manual -------------------------
    const input = panel.querySelector("#ifc-file-input");
    const btn = panel.querySelector("#ifc-upload-btn");
    btn.onclick = () => input.click();

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      fileSizeMB = file.size / (1024 * 1024);
      fileSizeMB = Math.max(0.01, parseFloat(fileSizeMB.toFixed(2)));
      bimCoinCost = Math.max(10, Math.ceil(fileSizeMB) * 10);
      lastLoadedFile = file;
      renderPanel();

      const arrayBuffer = await file.arrayBuffer();
      window.currentIFCBuffer = arrayBuffer;
      window.currentFileSizeMB = fileSizeMB;
      window.currentBIMCoinCost = bimCoinCost;

      loadedModel = await ifcLoader.load(new Uint8Array(arrayBuffer));
      const indexer = components.get(OBC.IfcRelationsIndexer);
      await indexer.process(loadedModel);
    };

    // ------------------------- Comparar per hash -------------------------
    panel.querySelector("#btn-compare-ifc").onclick = async () => {
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
};


      try {
        showModal("🔄 Carregant models...", null, 15);
        await loadModelByHash(h1, "#ff0000");
        showModal("🔄 Segon model...", null, 55);
        await loadModelByHash(h2, "#00aa00");
        showModal("✅ Models carregats!");
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
  const [relationsTree] = BUIC.tables.relationsTree({ components, models: [] });
  relationsTree.preserveStructureOnFilter = true;
  const panelRelations = BUI.Component.create(() => {
    const onSearch = (e) => {
      const input = /** @type {HTMLInputElement} */ (e.target);
      relationsTree.queryString = input.value;
    };
    return BUI.html`
      <bim-panel label="Relations Tree">
        <bim-panel-section label="Search and Tree">
          <bim-text-input @input=${onSearch} placeholder="Search..." debounce="200"></bim-text-input>
          ${relationsTree}
        </bim-panel-section>
      </bim-panel>
    `;
  });

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
  const panelClassifications = BUI.Component.create(() => {
    return BUI.html`
      <bim-panel label="Classifications">
        <bim-panel-section label="Classification Tree">
          ${classificationsTree}
        </bim-panel-section>
      </bim-panel>
    `;
  });

  // --- Panell propietats ---
  const [propertiesTable, updatePropertiesTable] = BUIC.tables.elementProperties({
    components,
    fragmentIdMap: {},
  });
  propertiesTable.preserveStructureOnFilter = true;
  propertiesTable.indentationInText = false;
  const panelProperties = BUI.Component.create(() => {
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
      <bim-panel label="Properties">
        <bim-panel-section label="Element Data">
          <div style="display: flex; gap: 0.5rem;">
            <bim-button @click=${expandTable} label=${propertiesTable.expanded ? "Collapse" : "Expand"}></bim-button>
            <bim-button @click=${copyAsTSV} label="Copy as TSV"></bim-button>
          </div>
          <bim-text-input @input=${onTextInput} placeholder="Search Property" debounce="250"></bim-text-input>
          ${propertiesTable}
        </bim-panel-section>
      </bim-panel>
    `;
  });

// ===============================
  // FORMULARI BIMCoin i registreModel
  // ===============================
  let formData = {
    filename: "",
    version: "",
    description: "",
    datetime: new Date().toISOString().slice(0, 16), // yyyy-mm-ddThh:mm
  };

let lastHash = null;
let showHashBox = false;
let checkInputHash = "";
let checkInfoResult = null;
let checkErrorMsg = "";
let panelBIMCoin;

panelBIMCoin = BUI.Component.create(() => {
  const onInput = (field) => (e) => {
    formData[field] = e.target.value;
  };
  const registerModel = async () => {
    console.log("-> showProgressBar");

  if (!currentIFCBuffer) {
    alert("Carrega un model IFC primer!");
    hideProgressBar();
    return;
  }

  if (!formData.filename || !formData.version || !formData.description || !formData.datetime) {
    showAlertModal("Si us plau, omple tots els camps!");
    //hideProgressBar();
    return;
  }

  showModal("🔌 Connectant amb Metamask", null, 10);
  await delay(2000);

  if (!window.ethereum) {
    hideModal();
    showAlertModal("Instal·la MetaMask primer!");
    return;
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    const registerContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const tokenContract = new Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, signer);
    showModal("🧾 Calculant hash...", null, 20);
    await delay(2000);
    const hashBuffer = await crypto.subtle.digest('SHA-256', currentIFCBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
    showModal("🔎 Comprovant si ja està registrat...", null, 28);
    await delay(2000);
    const alreadyRegistered = await registerContract.isModelRegistered(hashHex);
    
    if (alreadyRegistered) {
  const info = await registerContract.getModelInfo(hashHex);
  hideModal();
  showAlertModal(
    "Aquest model ja està registrat!",
    renderModelInfoHTML({
      "Nom": info.filename,
      "Hash": hashHex,  // <- aquí passes el hash!
      "Versió": info.version,
      "Descripció": info.description,
      "Data/hora": info.datetime,
      "Autor": info.author
    }),
    "Tancar",
    { large: true, html: true }
  );
  return;
}

    showModal("💰 Verificant saldo de BIMCoin...", null, 35);
    await delay(2000);
    const decimals = await tokenContract.decimals();
    const amount = BigInt(Math.floor(window.currentBIMCoinCost)) * (10n ** BigInt(decimals));
    const balance = await tokenContract.balanceOf(userAddress);

    if (balance < amount) {
      hideModal();
      showAlertModal("❌ No tens prou BIMCoins!");
      return;
    }

    showModal("💸 Enviant pagament amb BIMCoin...", null, 45);
    await delay(2000);
    const txPayment = await tokenContract.transfer(CONTRACT_ADDRESS, amount);
    await txPayment.wait();
    updateBIMCoinInfo();
    showModal("📤 Pujant fitxer a IPFS...", null, 65);
    await delay(2000);
    const file = new File([currentIFCBuffer], formData.filename || "model.ifc");
    let cid;
    try {
      cid = await uploadToLighthouse(file);
    } catch (err) {
      hideModal();
      showAlertModal(
        "Error pujant el fitxer a IPFS:",
        (err && err.message) ? err.message : (err || "Error desconegut"),
        "Tancar"
      );
      return;
    }
    showModal("📸 Capturant imatge...", null, 80);
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
    showModal("⛓️ Registrant el model a la blockchain...", null, 92);
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
    lastHash = hashHex;
    showHashBox = true;
    panelBIMCoin.update();

    const arxiuInfo = {
      nom: formData.filename,
      hash: hashHex,
      data: formData.datetime,
      descripcio: formData.description,
      cid: cid,
      imageCid: imageCid
    };
    showModal("⛓️ Registrant el model a la blockchain...", null, 99);
    showModal("✅ Registrat correctament!", arxiuInfo); // <-- arxiuInfo necessari!
    await delay(4000);
    setTimeout(hideModal, 1400);
  } catch (e) {
    hideModal();
    showAlertModal(
      "❌ Error durant el registre:",
      (e && e.message) ? e.message : (e || "Error desconegut"),
      "Tancar"
    );
  }
};


  // --- Funcions per validar hash ---
  const onCheckInput = (e) => {
    checkInputHash = e.target.value.trim().toLowerCase();
    checkInfoResult = null;
    checkErrorMsg = "";
    panelBIMCoin.update();
  };

  const onCheckHash = async (e) => {
    e.preventDefault();
    if (!checkInputHash) {
      checkErrorMsg = "Posa un hash per validar!";
      checkInfoResult = null;
      panelBIMCoin.update();
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const exists = await contract.isModelRegistered(checkInputHash);
      if (!exists) {
        checkErrorMsg = "No registrat a la blockchain.";
        checkInfoResult = null;
      } else {
        const info = await contract.getModelInfo(checkInputHash);
        checkInfoResult = info;
        checkErrorMsg = "";
      }
      panelBIMCoin.update();
    } catch (e) {
      checkErrorMsg = "Error consultant: " + (e.message || e);
      checkInfoResult = null;
      panelBIMCoin.update();
    }
  };

  return BUI.html`
    <bim-panel label="BIMCoin">
      <bim-panel-section label="Registre Model">
        <form style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem;" onsubmit="return false;">
          <input placeholder="Nom del fitxer/Identificador"
                 value="${formData.filename}" 
                 @input="${onInput('filename')}" 
                 style="padding:0.5rem;border-radius:4px;border:1px solid #ccc;">
          <input placeholder="Versió o checksum"
                 value="${formData.version}"
                 @input="${onInput('version')}"
                 style="padding:0.5rem;border-radius:4px;border:1px solid #ccc;">
          <input placeholder="Descripció/Tipus de model"
                 value="${formData.description}"
                 @input="${onInput('description')}"
                 style="padding:0.5rem;border-radius:4px;border:1px solid #ccc;">
          <input type="datetime-local"
                 value="${formData.datetime}"
                 @input="${onInput('datetime')}"
                 style="padding:0.5rem;border-radius:4px;border:1px solid #ccc;">
        </form>
        <bim-button label="Registrar IFC a Blockchain" @click=${registerModel}></bim-button>

        <!-- Caixa de hash registrat -->
        ${showHashBox && lastHash ? BUI.html`
          <div style="margin-top:1rem;padding:0.5rem;background:#f3f3f3;border-radius:8px;">
            <div><strong>Hash del model registrat:</strong></div>
            <div style="font-family:monospace;word-break:break-all;">${lastHash}</div>
            <bim-button style="margin-top:0.5rem;" label="Copia hash" 
              @click=${async () => {
                await navigator.clipboard.writeText(lastHash);
                alert("Hash copiat al porta-retalls!");
              }}>
            </bim-button>
          </div>
        ` : ""}

        <!-- Validació de hash aquí mateix -->
        <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #ddd;">
  
</div>

      </bim-panel-section>
    </bim-panel>
  `;
});
  
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
  const tabs = [
    { key: 'ifc', label: 'Carrega IFC', panel: createIFCLoaderPanel() },
    { key: 'relations', label: 'Relacions', panel: panelRelations },
    { key: 'classifications', label: 'Classificacions', panel: panelClassifications },
    { key: 'properties', label: 'Propietats', panel: panelProperties },
    { key: 'bimcoin', label: 'Registrar IFC a BlockChain', panel: panelBIMCoin },
    { key: 'checkhash', label: 'Comprova Hash', panel: createCheckHashPanel() }
  ];
  let activeTab = 'ifc';

  const panelTabsContainer = document.createElement("div");
  panelTabsContainer.className = "panel-tabs-container";
  panelTabsContainer.style.height = "100%";
  panelTabsContainer.style.display = "flex";
  panelTabsContainer.style.flexDirection = "column";

  function renderPanelTabs() {
    panelTabsContainer.innerHTML = "";

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
    renderLang(e.target.value);
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




