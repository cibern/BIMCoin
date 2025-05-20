import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUIC from "@thatopen/ui-obc";
import { BrowserProvider, Contract } from "ethers";

import lighthouse from '@lighthouse-web3/sdk';

const LIGHTHOUSE_API_KEY = '75fbb6cf.d218f26d35d24b0aa509182068439be5';

async function uploadToLighthouse(file) {
  try {
    // Ha de ser un array de fitxers! [file]
    const response = await lighthouse.upload([file], LIGHTHOUSE_API_KEY);

    if (response && response.data && response.data.Hash) {
      const cid = response.data.Hash;
      // ALERT BONIC! També pots fer servir SweetAlert2 o similar per estilitzar
      alert(`✅ Fitxer pujat correctament!\n\nCID: ${cid}`);

      // Retorna el CID si vols utilitzar-lo després
      return cid;
    } else {
      alert("❌ Error: No s'ha pogut obtenir el CID.");
    }
  } catch (err) {
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

  const viewport = document.createElement("bim-viewport");
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
    let lastLoadedFile = null; // Opcional, el pots guardar si vols

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
        </bim-panel>
      `;

      const input = panel.querySelector("#ifc-file-input");
      const btn = panel.querySelector("#ifc-upload-btn");
      btn.onclick = () => input.click();

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        fileSizeMB = file.size / (1024 * 1024);
        bimCoinCost = Math.max(10, Math.ceil(fileSizeMB) * 10);
        lastLoadedFile = file;
        renderPanel();
        //const cid = await uploadToLighthouse(file);
    

        
        

        // Opcional: Carrega el model al visor
        const arrayBuffer = await file.arrayBuffer();
        const ifcUint8 = new Uint8Array(arrayBuffer);
      window.currentIFCBuffer = arrayBuffer; // IMPORTANT! Així el panell BIMCoin el veu
      window.currentFileSizeMB = fileSizeMB;
      window.currentBIMCoinCost = bimCoinCost;
      loadedModel = await ifcLoader.load(new Uint8Array(arrayBuffer));
      if (!loadedModel) {
        alert("No s'ha pogut carregar el model IFC!");
        return;
      }
      // Força indexació de relacions (important!)
      const indexer = components.get(OBC.IfcRelationsIndexer);
      await indexer.process(loadedModel);

      

      // Classificació
      const classifier = components.get(OBC.Classifier);
      

      const thickItems = classifier.find({
        entities: ["IFCWALLSTANDARDCASE", "IFCWALL"],
      });

      const thinItems = classifier.find({
        entities: ["IFCDOOR", "IFCWINDOW", "IFCPLATE", "IFCMEMBER"],
      });

      




      classifier.byModel(loadedModel.uuid, loadedModel);
      await classifier.byEntity(loadedModel);
      //console.log("ENTITATS AL CLASSIFIER:", classifier._entities);
      // --- Llista tots els tipus d'entitat presents al model carregat
      const allEntityTypes = Object.values(loadedModel._properties)
      .map(p => p.constructor?.name)
      .filter(Boolean);
      console.log("TOTS ELS TIPUS D'ENTITAT AL MODEL:", [...new Set(allEntityTypes)]);

      // Troba entitats de tipus "building storey" (en qualsevol format)
      const storeyTypes = [...new Set(allEntityTypes)].filter(
        t => t.toLowerCase().includes("buildingstorey")
      );

      let storeys = {};
for (const type of storeyTypes) {
  const found = classifier.find({ entities: [type] });
  storeys = { ...storeys, ...found };
}
console.log("STOREYS TROBATS:", storeys);

      

      // Busca plantes
      //const storeys = classifier.find({ entities: ["IfcBuildingStorey"] });
      //console.log("DESPRÉS de byEntity - STOREYS:", storeys);
      //console.log("LOADEDMODEL:", loadedModel);

      // Prova de llistar els fragments trobats:
      if (Object.keys(storeys).length > 0) {
  alert(`S'han trobat ${Object.keys(storeys).length} plantes/storeys!`);
} else {
  //alert("NO s'han trobat plantes/storeys al model!");
}
      //await addPlansPanel(loadedModel);   // <--- CRIDA AQUÍ!
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

  const CONTRACT_ADDRESS = "0x03c89df2366f99C8e4E4C9010143d54064c0E893"; // <-- CANVIA per la teva!
  const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string", "name": "hash", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "filename", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "version", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "description", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "datetime", "type": "string" },
      { "indexed": true,  "internalType": "address", "name": "author", "type": "address" }
    ],
    "name": "ModelRegistered",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "hash", "type": "string" },
      { "internalType": "string", "name": "filename", "type": "string" },
      { "internalType": "string", "name": "version", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "string", "name": "datetime", "type": "string" }
    ],
    "name": "registerModel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "hash", "type": "string" }
    ],
    "name": "getModelInfo",
    "outputs": [
      { "internalType": "string", "name": "filename", "type": "string" },
      { "internalType": "string", "name": "version", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "string", "name": "datetime", "type": "string" },
      { "internalType": "address", "name": "author", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "hash", "type": "string" }
    ],
    "name": "isModelRegistered",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "name": "isRegistered",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "name": "models",
    "outputs": [
      { "internalType": "string", "name": "filename", "type": "string" },
      { "internalType": "string", "name": "version", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "string", "name": "datetime", "type": "string" },
      { "internalType": "address", "name": "author", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];


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
    if (!currentIFCBuffer) {
      alert("Carrega un model IFC primer!");
      return;
    }
    if (!formData.filename || !formData.version || !formData.description || !formData.datetime) {
      alert("Si us plau, omple tots els camps!");
      return;
    }

    // Puja el fitxer a Lighthouse
    const file = new File([currentIFCBuffer], formData.filename || "model.ifc");
    let cid;
    try {
      cid = await uploadToLighthouse(file);  // Aquesta funció hauria de tornar el CID
      alert("Fitxer pujat a IPFS! CID: " + cid);
    } catch (err) {
      alert("Error pujant el fitxer a IPFS: " + (err.message || err));
      return;
  }
    const hashBuffer = await crypto.subtle.digest('SHA-256', currentIFCBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
    console.log("Hash generat per aquest model IFC:", hashHex);

    if (!window.ethereum) {
      alert("Instal·la MetaMask primer!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const alreadyRegistered = await contract.isModelRegistered(hashHex);
      if (alreadyRegistered) {
        const info = await contract.getModelInfo(hashHex);
        alert(
          "Aquest model ja està registrat a la blockchain!\n" +
          `Nom: ${info.filename}\nVersió: ${info.version}\nDescripció: ${info.description}\nData/hora: ${info.datetime}\nAutor: ${info.author}`
        );
        return;
      }

      const tx = await contract.registerModel(
        hashHex,
        formData.filename,
        formData.version,
        formData.description + `\nCID: ${cid}\nMB: ${fileSizeMB.toFixed(2)}`,  // <--- Aquí inclous CID i MB
        formData.datetime
      );

      alert("Transacció enviada! Esperant confirmació...");
      await tx.wait();
      lastHash = hashHex;
      showHashBox = true;
      panelBIMCoin.update();
    } catch (e) {
      alert("Error enviant la transacció: " + (e.message || e));
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

async function addPlansPanel(model) {
  // Elimina el panell anterior si ja existeix!
  const oldPanel = document.getElementById("plans-panel");
  if (oldPanel) oldPanel.remove();

  // PREPARA COMPONENTS
  const plans = components.get(OBCF.Plans);
  plans.world = world;

  try {
    await plans.generate(model);
    if (!plans.list || plans.list.length === 0) {
      alert("El model IFC s'ha carregat però NO s'han trobat plantes (storeys).");
      return;
    }
  } catch (e) {
    alert("No s'ha pogut generar els plànols per aquest model IFC. Potser la seva estructura no conté plantes o la jerarquia no és correcta.");
    return;
  }

  // Set up CLASSIFIER, CULLER, CLIP EDGES
  const classifier = components.get(OBC.Classifier);
  classifier.byModel(model.uuid, model);
  classifier.byEntity(model);

  const modelItems = classifier.find({ models: [model.uuid] });

  // Elements gruixuts (parets)
  const thickItems = classifier.find({ entities: ["IFCWALLSTANDARDCASE", "IFCWALL"] });
  // Elements fins (portes, finestres, etc)
  const thinItems = classifier.find({ entities: ["IFCDOOR", "IFCWINDOW", "IFCPLATE", "IFCMEMBER"] });

  const edges = components.get(OBCF.ClipEdges);
  const fragments = components.get(OBC.FragmentsManager);

  // Crea estils "thick" i "thin"
  const grayFill = new THREE.MeshBasicMaterial({ color: "gray", side: 2 });
  const blackLine = new THREE.LineBasicMaterial({ color: "black" });
  const blackOutline = new THREE.MeshBasicMaterial({ color: "black", opacity: 0.5, side: 2, transparent: true });
  edges.styles.create("thick", new Set(), world, blackLine, grayFill, blackOutline);

  for (const fragID in thickItems) {
    const foundFrag = fragments.list.get(fragID);
    if (!foundFrag) continue;
    const { mesh } = foundFrag;
    edges.styles.list.thick.fragments[fragID] = new Set(thickItems[fragID]);
    edges.styles.list.thick.meshes.add(mesh);
  }
  edges.styles.create("thin", new Set(), world);
  for (const fragID in thinItems) {
    const foundFrag = fragments.list.get(fragID);
    if (!foundFrag) continue;
    const { mesh } = foundFrag;
    edges.styles.list.thin.fragments[fragID] = new Set(thinItems[fragID]);
    edges.styles.list.thin.meshes.add(mesh);
  }
  await edges.update(true);

  // Highlighter & Culling
  const highlighter = components.get(OBCF.Highlighter);
  highlighter.setup({ world });
  const cullers = components.get(OBC.Cullers);
  const culler = cullers.create(world);
  for (const fragment of model.items) culler.add(fragment.mesh);
  culler.needsUpdate = true;
  world.camera.controls.addEventListener("sleep", () => { culler.needsUpdate = true; });

  // UI PANEL de PLANS
  const panel = BUI.Component.create(() => {
    // Variables d'estat
    const minGloss = world.renderer.postproduction.customEffects.minGloss;
    const whiteColor = new THREE.Color("white");
    const defaultBackground = world.scene.three.background;

    // Llistat de botons per a cada planta
    const planButtons = plans.list.map(plan => BUI.html`
      <bim-button label="${plan.name}"
        @click=${() => {
          world.renderer.postproduction.customEffects.minGloss = 0.1;
          highlighter.backupColor = whiteColor;
          classifier.setColor(modelItems, whiteColor);
          world.scene.three.background = whiteColor;
          plans.goTo(plan.id);
          culler.needsUpdate = true;
        }}></bim-button>
    `);

    // Botó per sortir a 3D
    const exitButton = BUI.html`
      <bim-button label="Torna a 3D"
        style="margin-top:1rem;"
        @click=${() => {
          highlighter.backupColor = null;
          highlighter.clear();
          world.renderer.postproduction.customEffects.minGloss = minGloss;
          classifier.resetColor(modelItems);
          world.scene.three.background = defaultBackground;
          plans.exitPlanView();
          culler.needsUpdate = true;
        }}>
      </bim-button>
    `;

    return BUI.html`
      <bim-panel id="plans-panel" label="Plantes IFC" style="max-width: 32rem;">
        <bim-panel-section label="Llistat de plantes">
          ${planButtons}
          ${exitButton}
        </bim-panel-section>
      </bim-panel>
    `;
  });

  // Afegeix el panel a la pàgina
  document.body.append(panel);
}