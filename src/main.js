//import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUIC from "@thatopen/ui-obc";
import { ethers } from "ethers";

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

// IFC Loader i buffer real
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
  await ifcLoader.load(new Uint8Array(arrayBuffer)); // carrega model al viewer!
});

// Afegeix el model a l'escena quan es carrega!
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

// Panell relacions
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

// Panell classificacions
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

// Panell propietats
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

// Panell BIMCoin (hash buffer)
const CONTRACT_ADDRESS = "0x93bd51036318302441Eb871F132EBdB28267291d"; // <-- CANVIA per la teva!
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "hash",
        "type": "string"
      }
    ],
    "name": "registerHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const panelBIMCoin = BUI.Component.create(() => {
  const registerHash = async () => {
    if (!currentIFCBuffer) {
      alert("Carrega un model IFC primer!");
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
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.registerHash(hashHex); // Si la funció es diu diferent, canvia-ho!
      alert("Transacció enviada! Esperant confirmació...");
      await tx.wait();
      alert("Hash registrat correctament a blockchain!\nTx Hash: " + tx.hash);
    } catch (e) {
      alert("Error enviant la transacció: " + (e.message || e));
    }
  };
  return BUI.html`
    <bim-panel label="BIMCoin">
      <bim-panel-section label="Registre">
        <bim-button label="Registrar IFC a Blockchain" @click=${registerHash}></bim-button>
      </bim-panel-section>
    </bim-panel>
  `;
});

// Wrapper de panells
const panelWrapper = document.createElement("div");
panelWrapper.style.display = "flex";
panelWrapper.style.flexDirection = "column";
panelWrapper.style.height = "100%";
panelWrapper.style.overflow = "auto";
panelWrapper.appendChild(panelCustomIFCLoader);
//panelWrapper.appendChild(panelRelations);
//panelWrapper.appendChild(panelClassifications);
//panelWrapper.appendChild(panelProperties);
panelWrapper.appendChild(panelBIMCoin);

// Layout final
const app = document.createElement("bim-grid");
app.layouts = {
  main: {
    template: `
      "panel viewport"
      / 30rem 1fr
    `,
    elements: {
      panel: panelWrapper,
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