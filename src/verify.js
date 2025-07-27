import { updateBIMCoinInfo } from './bimcoin.js';
import { showModal, hideModal } from './modals.js';
import { generarCertificatPDF } from './pdf.js';
import jsPDF from "jspdf";


import {
  CONTRACT_ADDRESS,
  BIMCOIN_ADDRESS,
  REGISTRY_ADDRESS,
  BIMCOIN_ABI,
  REGISTRY_ABI,
  CONTRACT_ABI
} from './blockchainConfig.js';
// L'adreça del contracte de registre de models

let lastEvents = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Mostra saldo BIMCoin
  updateBIMCoinInfo();

  // Mostra adreça contracte
  const contractAddrElem = document.getElementById("contractAddr");
  if (contractAddrElem) contractAddrElem.textContent = CONTRACT_ADDRESS;

  // Botó connectar i llistar models
  const connectBtn = document.getElementById("connect");
  if (connectBtn) connectBtn.onclick = connectWalletAndListHashes;
});

// Llistat de models
async function connectWalletAndListHashes() {
  const resultDiv = document.getElementById("result");
  const addressDiv = document.getElementById("address");
  const searchInput = document.getElementById("search");
  resultDiv.innerHTML = "";
  addressDiv.innerHTML = "";

  // Amaga input de cerca fins que es carreguen dades
  searchInput.value = "";
  searchInput.classList.remove("visible");

  if (!window.ethereum) {
    resultDiv.innerHTML = "<b class='alert'>Necessites MetaMask per fer servir aquesta funció.</b>";
    return;
  }

  // ethers.js a ES Modules (amb Vite funciona directament)
  const { BrowserProvider, Contract } = await import("ethers");

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const userAddress = (await signer.getAddress()).toLowerCase();

  addressDiv.innerHTML = "<b>Adreça connectada:</b> " + userAddress;

  const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  let latestBlock;
  try {
    latestBlock = await provider.getBlockNumber();
  } catch (err) {
    resultDiv.innerHTML = "<b class='alert'>No s'ha pogut obtenir el número de bloc. Xarxa correcta?</b>";
    return;
  }

  try {
    let events = await contract.queryFilter("ModelRegistered", 0, latestBlock);

    lastEvents = events.map(ev => ({
      hash: ev.args.hash,
      filename: ev.args.filename,
      version: ev.args.version,
      description: ev.args.description,
      datetime: ev.args.datetime,
      author: (ev.args.author || "").toString(),
      blockNumber: ev.blockNumber
    }));

    lastEvents.sort((a, b) => b.blockNumber - a.blockNumber);

    // Mostra el camp de cerca només ara
    searchInput.classList.add("visible");

    showFilteredList();

    // Activa el filtratge predictiu
    searchInput.oninput = showFilteredList;

  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = "<b class='alert'>Error consultant els registres o massa dades a processar.<br>Revisa que estàs a la xarxa correcta i que el contracte sigui correcte.</b>";
  }
}

function showFilteredList() {
  const resultDiv = document.getElementById("result");
  const searchInput = document.getElementById("search");
  const searchValue = (searchInput.value || "").toLowerCase().trim();

  let filtered = lastEvents;
  if (searchValue) {
    filtered = filtered.filter(model =>
      (model.filename && model.filename.toLowerCase().includes(searchValue)) ||
      (model.version && model.version.toLowerCase().includes(searchValue)) ||
      (model.description && model.description.toLowerCase().includes(searchValue)) ||
      (model.datetime && String(model.datetime).toLowerCase().includes(searchValue)) ||
      (model.author && String(model.author).toLowerCase().includes(searchValue)) ||
      (model.hash && model.hash.toLowerCase().includes(searchValue))
    );
  }

  filtered = filtered.slice(0, 10);

  if (filtered.length === 0) {
    resultDiv.innerHTML = "<i>No hi ha registres coincidents.</i>";
    return;
  }

  resultDiv.innerHTML = `<h3>A continuació es mostren els 10 últims models IFC registrats a la BlockChain:</h3>`;
  filtered.forEach((model, i) => {
    // Extraure CID del text "CID: xyz" a la descripció
    let cid = null, imageCID = null, fileSizeMB = null;
    const cidMatch = model.description && model.description.match(/CID:\s*([a-z0-9]+)/i);
    if (cidMatch) cid = cidMatch[1];
    const imgMatch = model.description && model.description.match(/IMG:\s*([a-z0-9]+)/i);
    if (imgMatch) imageCID = imgMatch[1];
    const mbMatch = model.description && model.description.match(/MB:\s*([\d.]+)/i);
    if (mbMatch) fileSizeMB = parseFloat(mbMatch[1]);
    let cost = '';
    if (fileSizeMB !== null && !isNaN(fileSizeMB)) {
      cost = Math.ceil(fileSizeMB);
      cost = Math.max(1, cost);
      cost = cost * 10; // cada MB → 10 BIMCoin
    }

resultDiv.innerHTML += `
  <div class="hash-item">
    <b>#${i + 1} — ${model.filename}</b><br>
    <span class="hash">${model.hash}</span>
    <span>Versió: <b>${model.version}</b></span><br>
    <span>Descripció: ${(model.description || '-')
      .replace(/CID:\s*[a-z0-9]+/i, '')
      .replace(/IMG:\s*[a-z0-9]+/i, '')
      .replace(/MB:\s*[\d.]+/i, '')
      .replace(/\n+$/, '')
      .trim()}</span><br>
    <span style="color:#777">Data: ${formatDate(model.datetime)}</span><br>
    <span style="color:#aaa">Author: ${model.author}</span>
    ${imageCID ? `
      <div style="display: flex; align-items: flex-start; gap: 2em; margin-top: 1.2em;">
        <img src="https://gateway.lighthouse.storage/ipfs/${imageCID}" 
          alt="Captura del model" 
          style="max-width: 180px; border-radius: 0.6em; box-shadow: 0 2px 8px #0002; max-height: 160px;">

        <div style="display: flex; flex-direction: column; gap: 1.1em;">
          <div style="display: flex; align-items: center; gap: 0.7em;">
            <button
              class="download-btn"
              data-cid="${cid}"
              data-filename="${model.filename || 'model'}.ifc"
              data-cost="${cost}"
            >
              ⬇️ Descarregar IFC
            </button>
            ${cost ? `
              <span style="font-size:1.1em; color:#195186; background:#e7f6fa; border-radius:7px; padding:0.4em 0.8em; display:inline-block;">
                💰 ${cost} BIMCoin
              </span>
            ` : ""}
          </div>
          <div>
            <button
              class="download-pdf-btn"
              data-index="${i}"
              style="margin-top:0.8em;"
            >
              📄 Descarregar PDF
            </button>
            <span style="margin-left:1em;color:#195186;">Sense cap cost</span>
          </div>
        </div>
      </div>
    ` : ""}
  </div>
`;

  });

  // Listeners per la descàrrega
document.querySelectorAll('.download-btn').forEach(btn => {
  btn.onclick = async function () {
    const cid = btn.getAttribute('data-cid');
    const filename = btn.getAttribute('data-filename') || 'model.ifc';
    const cost = Number(btn.getAttribute('data-cost')) || 0;

    window.onbeforeunload = function(e) {
      e.preventDefault();
      e.returnValue = "La descàrrega està en procés. Si surts, pots perdre el fitxer pel qual ja has pagat!";
      return e.returnValue;
    };

    try {
      if (!cost || isNaN(cost)) {
        await downloadIFC(cid, filename, btn);
        return;
      }

      // 1. Comprovant saldo
      showModal("💰 Comprovant saldo de BIMCoin...");
      await delay(2000);

      const { BrowserProvider, Contract, parseUnits, formatUnits } = await import("ethers");
      const BIMCOIN_ADDRESS = "0xE464B8A1FAaC982dEe365D9fB3aC1100737Ef4B5";
      const BIMCOIN_ABI = [
        "function transfer(address to, uint256 value) public returns (bool)",
        "function decimals() public view returns (uint8)",
        "function balanceOf(address) public view returns (uint256)"
      ];
      const DEST_ADDRESS = "0x03c89df2366f99C8e4E4C9010143d54064c0E893";

      // 2. Connectant a MetaMask
      showModal("🔌 Connectant a MetaMask...");
      await delay(2000);
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const token = new Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, signer);
      const decimals = await token.decimals();
      const value = parseUnits(cost.toString(), decimals);
      const userAddress = await signer.getAddress();
      const balance = await token.balanceOf(userAddress);

      // Comprova saldo
      if (balance < value) {
        hideModal();
        import('./modals.js').then(modals => {
          modals.showInsufficientBIMCoinModal(
            Number(formatUnits(balance, decimals)),
            Number(formatUnits(value, decimals))
          );
        });
        btn.textContent = "⬇️ Descarregar IFC";
        window.onbeforeunload = null;
        return;
      }

      // 3. Pagant amb BIMCoin...
      showModal("💸 Realitzant pagament amb BIMCoin...");
      await delay(2000);
      const tx = await token.transfer(DEST_ADDRESS, value);
      await tx.wait();
      // 👉 ACTUALITZA EL SALDO BIMCOIN AL PANELL
      updateBIMCoinInfo();

      // 4. Baixant l'arxiu...
      showModal("⬇️ Baixant fitxer IFC...");
      await delay(2000);
      await downloadIFC(cid, filename, btn);
      updateBIMCoinInfo();

    } catch (err) {
      hideModal();
      alert("❌ Error en el pagament o descàrrega: " + (err.message || err));
      btn.textContent = "⬇️ Descarregar IFC";
    } finally {
      window.onbeforeunload = null;
      hideModal();
    }
  };
});
// Listener per la descàrrega PDF del certificat
document.querySelectorAll('.download-pdf-btn').forEach(btn => {
  btn.onclick = async function () {
    const idx = parseInt(btn.getAttribute('data-index'), 10);
    const searchInput = document.getElementById("search");
    const searchValue = (searchInput.value || "").toLowerCase().trim();
    let filtered = lastEvents;
    if (searchValue) {
      filtered = filtered.filter(model =>
        (model.filename && model.filename.toLowerCase().includes(searchValue)) ||
        (model.version && model.version.toLowerCase().includes(searchValue)) ||
        (model.description && model.description.toLowerCase().includes(searchValue)) ||
        (model.datetime && String(model.datetime).toLowerCase().includes(searchValue)) ||
        (model.author && String(model.author).toLowerCase().includes(searchValue)) ||
        (model.hash && model.hash.toLowerCase().includes(searchValue))
      );
    }
    filtered = filtered.slice(0, 10);

    const model = filtered[idx];

    // Extreu el CID de la imatge (IMG: ...)
    let imageCid = null;
    const imgMatch = model.description && model.description.match(/IMG:\s*([a-z0-9]+)/i);
    if (imgMatch) imageCid = imgMatch[1];

    if (model) {
      // Passa tota la info a la funció PDF!
      generarCertificatPDF({
        nom: model.filename || "-",
        hash: model.hash || "-",
        data: model.datetime || "-",
        descripcio: model.description || "-",
        imageCid: imageCid // Important!
      });
    }
  }
});


// Funció per la descàrrega amb progrés
// Funció per la descàrrega amb progrés i modal
async function downloadIFC(cid, filename, btn) {
  try {
    showModal("⬇️ Iniciant descàrrega IFC...");
    await delay(2000);
    const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${cid}`);
    if (!response.ok) throw new Error('No s\'ha pogut descarregar el fitxer');
    const contentLength = response.headers.get('Content-Length');
    if (!response.body) throw new Error('La resposta no té body stream!');
    const total = contentLength ? parseInt(contentLength, 10) : null;

    const reader = response.body.getReader();
    let received = 0;
    let chunks = [];

    btn.textContent = "Descarregant... 0%";
    let lastPercent = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total) {
        const percent = Math.floor((received / total) * 100);
        btn.textContent = `Descarregant... ${percent}%`;
        // Actualitza el modal cada 10%
        if (percent - lastPercent >= 10 || percent === 100) {
          showModal(`⬇️ Baixant fitxer... ${percent}%`);
          await delay(2000);
          lastPercent = percent;
        }
      } else {
        btn.textContent = `Descarregant... (${(received / 1024 / 1024).toFixed(1)} MB)`;
      }
    }

    hideModal();

    // Combina els chunks en un blob
    const blob = new Blob(chunks);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      a.remove();
      btn.textContent = "⬇️ Descarregar IFC";
    }, 1000);
  } catch (err) {
    hideModal();
    alert("Error descarregant el fitxer IFC!");
    btn.textContent = "⬇️ Descarregar IFC";
  }
}


}



function formatDate(datetime) {
  if (!datetime) return "";
  const [datePart, timePart] = datetime.split('T');
  const [year, month, day] = datePart.split('-');
  const time = timePart ? timePart.slice(0,5) : '';
  return `${day}/${month}/${year}${time ? ' (' + time + ')' : ''}`;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
