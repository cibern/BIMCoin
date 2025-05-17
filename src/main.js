import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUIC from "@thatopen/ui-obc";
import { BrowserProvider, Contract } from "ethers";


async function main() {
  // Inicialitza la UI
  BUI.Manager.init();

  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);

  const world = worlds.create();
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

  let currentIFCBuffer = null;

  // INPUT FILE PERSONALITZAT (no BUIC!)
  const inputFile = document.createElement('input');
  inputFile.type = 'file';
  inputFile.accept = '.ifc';
  inputFile.style.display = 'none';
  document.body.appendChild(inputFile);

  inputFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    currentIFCBuffer = arrayBuffer;
    await ifcLoader.load(new Uint8Array(arrayBuffer));
  });

  // Afegir model a escena
  const fragmentsManager = components.get(OBC.FragmentsManager);
  fragmentsManager.onFragmentsLoaded.add((model) => {
    if (world.scene) world.scene.three.add(model);
  });

  // Panell per carregar IFC
  const panelCustomIFCLoader = BUI.Component.create(() => {
    const onUploadClick = () => inputFile.click();
    return BUI.html`
      <bim-panel label="Carrega IFC">
        <bim-panel-section label="Carrega">
          <bim-button label="Carrega fitxer IFC" @click=${onUploadClick}></bim-button>
        </bim-panel-section>
      </bim-panel>
    `;
  });

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


  const panelBIMCoin = BUI.Component.create(() => {
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
      const hashBuffer = await crypto.subtle.digest('SHA-256', currentIFCBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (!window.ethereum) {
        alert("Instal·la MetaMask primer!");
        return;
      }

      try {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // **Nova validació!**
    const alreadyRegistered = await contract.isModelRegistered(hashHex);
    if (alreadyRegistered) {
      // Opcional: mostra info extra
      const info = await contract.getModelInfo(hashHex);
      alert(
        "Aquest model ja està registrat a la blockchain!\n" +
        `Nom: ${info.filename}\nVersió: ${info.version}\nDescripció: ${info.description}\nData/hora: ${info.datetime}\nAutor: ${info.author}`
      );
      return;
    }


        // Crida la funció registerModel amb tots els camps!
        const tx = await contract.registerModel(
          hashHex,
          formData.filename,
          formData.version,
          formData.description,
          formData.datetime
        );

        alert("Transacció enviada! Esperant confirmació...");
        await tx.wait();
        alert("Model registrat correctament a blockchain!\nTx Hash: " + tx.hash);
      } catch (e) {
        alert("Error enviant la transacció: " + (e.message || e));
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
        </bim-panel-section>
      </bim-panel>
    `;
  });

  // ===============================
  // Panell Lateral amb Pestanyes (TABS)
  // ===============================
  const tabs = [
    { key: 'ifc', label: 'Carrega IFC', panel: panelCustomIFCLoader },
    { key: 'relations', label: 'Relacions', panel: panelRelations },
    { key: 'classifications', label: 'Classificacions', panel: panelClassifications },
    { key: 'properties', label: 'Propietats', panel: panelProperties },
    { key: 'bimcoin', label: 'BIMCoin', panel: panelBIMCoin },
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
        / 30rem 1fr
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




