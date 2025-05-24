// modals.js
import { generarCertificatPDF } from './pdf.js';
import { formatDate } from './utils.js';

// Mostra el modal principal amb missatge, dades, i opcionalment una barra de progrés
export function showModal(message, arxiuInfo = null, progress = null) {
  let modal = document.getElementById('status-modal');
  let content = document.getElementById('status-modal-content');

  if (!modal) {
    // Crear el modal si no existeix
    modal = document.createElement('div');
    modal.id = 'status-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';

    content = document.createElement('div');
    content.id = 'status-modal-content';
    content.style.width = '400px'; // <---- Canvia el valor si vols més/menys ample
    content.style.minWidth = '400px';
    content.style.maxWidth = '400px';
    content.style.backgroundColor = '#fff';
    content.style.padding = '24px 20px 32px 20px';
    content.style.borderRadius = '14px';
    content.style.boxShadow = '0 0 18px rgba(0,0,0,0.13)';
    content.style.maxWidth = '420px';
    content.style.textAlign = 'center';

    modal.appendChild(content);
    document.body.appendChild(modal);
  } else {
    content.innerHTML = ""; // Netegem el contingut anterior
    modal.style.display = 'flex';
  }

  // Contingut principal
  const msgP = document.createElement('p');
  msgP.innerText = message;
  msgP.style.marginBottom = '1.2em';
  msgP.style.fontSize = '1.16em';
  content.appendChild(msgP);

  // Barra de progrés dins del modal (opcional)
  if (progress !== null && progress !== undefined) {
    let barWrap = document.createElement('div');
    barWrap.style.width = "95%";
    barWrap.style.height = "21px"; // <-- MODIFICA A L'AJUDA QUE VULGUIS
    barWrap.style.background = "#f3f6fa";
    barWrap.style.borderRadius = "9px";
    barWrap.style.boxShadow = "0 2px 10px #2379ca17";
    barWrap.style.margin = "15px auto 16px auto";
    barWrap.id = "modal-progress-bar-wrap";
    barWrap.style.overflow = "hidden";

    let bar = document.createElement('div');
    bar.id = "modal-progress-bar";
    bar.style.height = "100%";
    bar.style.width = `${progress}%`;
    bar.style.background = "linear-gradient(90deg,#2379ca 0%,#27e8c5 100%)";
    bar.style.borderRadius = "9px";
    bar.style.transition = "width 0.36s cubic-bezier(.4,.9,.5,1.1)";
    barWrap.appendChild(bar);

    content.appendChild(barWrap);
  }

  // Si és registre correcte, afegeix botó de PDF i botó de tancar
  if (message.includes("Registrat correctament")) {
    const pdfBtn = document.createElement("button");
    pdfBtn.innerText = "Descarrega PDF de certificat";
    pdfBtn.style.marginTop = "1.2em";
    pdfBtn.style.background = "#2379ca";
    pdfBtn.style.color = "#fff";
    pdfBtn.style.border = "none";
    pdfBtn.style.borderRadius = "7px";
    pdfBtn.style.padding = "0.7em 2em";
    pdfBtn.style.fontSize = "1em";
    pdfBtn.style.cursor = "pointer";
    pdfBtn.onclick = async () => await generarCertificatPDF(arxiuInfo || {});
    content.appendChild(pdfBtn);

    // Missatge informatiu
    const info = document.createElement('div');
    info.style.marginTop = '1.1em';
    info.style.fontSize = '0.95em';
    info.style.color = '#256';
    info.innerText = "Aquest certificat estarà sempre disponible quan es comprovi el hash generat.";
    content.appendChild(info);

    // Botó de tancar només aquí
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Tancar';
    closeBtn.style.marginTop = '1.3em';
    closeBtn.style.background = '#2379ca';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '7px';
    closeBtn.style.padding = '0.7em 2.3em';
    closeBtn.style.fontSize = '1em';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    content.appendChild(closeBtn);
  }
}

// Funció per actualitzar només la barra de progrés del modal (animada)
export function setModalProgressBar(percent) {
  const bar = document.getElementById("modal-progress-bar");
  if (bar) bar.style.width = `${percent}%`;
}

// Amaga el modal principal
export function hideModal() {
  const modal = document.getElementById('status-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Mostra que no hi ha suficient saldo en el moment de la descàrrega.
export function showInsufficientBIMCoinModal(balance, needed) {
  let modal = document.getElementById('insufficient-bimcoin-modal');
  let content = document.getElementById('insufficient-bimcoin-modal-content');

  if (!modal) {
    // Crear el modal si no existeix
    modal = document.createElement('div');
    modal.id = 'insufficient-bimcoin-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.55)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10000';

    content = document.createElement('div');
    content.id = 'insufficient-bimcoin-modal-content';
    content.style.backgroundColor = '#fff';
    content.style.padding = '28px 18px 18px 18px';
    content.style.borderRadius = '12px';
    content.style.boxShadow = '0 8px 32px #124c8d22';
    content.style.maxWidth = '370px';
    content.style.textAlign = 'center';
    content.style.position = 'relative';

    modal.appendChild(content);

    document.body.appendChild(modal);
  } else {
    content = document.getElementById('insufficient-bimcoin-modal-content');
    content.innerHTML = '';
    content.style.position = 'relative';
  }

  // Creu de tancar (✖)
  let closeX = document.createElement('span');
  closeX.innerHTML = '&times;';
  closeX.style.position = 'absolute';
  closeX.style.top = '12px';
  closeX.style.right = '16px';
  closeX.style.fontSize = '1.6em';
  closeX.style.color = '#888';
  closeX.style.cursor = 'pointer';
  closeX.style.fontWeight = 'bold';
  closeX.title = 'Tancar';
  closeX.onclick = () => { modal.style.display = 'none'; };
  content.appendChild(closeX);

  // Contingut principal
  const mainDiv = document.createElement('div');
  mainDiv.innerHTML = `
    <div style="font-size:2.5em;margin-bottom:0.3em;">💸</div>
    <b style="color:#c00;font-size:1.22em;">No tens prou BIMCoins!</b><br><br>
    <span style="color:#195186;font-size:1.1em;">
      Saldo: <b>${balance}</b> BIMC<br>
      Necessari: <b>${needed}</b> BIMC
    </span>
    <br><br>
    <span style="color:#888;font-size:0.98em;">
      Pots adquirir més BIMCoin o sol·licitar-los a l’administrador.
    </span>
  `;
  content.appendChild(mainDiv);

  // Botó de comprar a sota
  const buyBtn = document.createElement('button');
  buyBtn.innerText = 'Comprar BIMCoin';
  buyBtn.style.marginTop = '1.3em';
  buyBtn.style.background = '#2379ca';
  buyBtn.style.color = '#fff';
  buyBtn.style.border = 'none';
  buyBtn.style.borderRadius = '7px';
  buyBtn.style.padding = '0.7em 2.3em';
  buyBtn.style.fontSize = '1em';
  buyBtn.style.cursor = 'pointer';
  buyBtn.onclick = () => {
    modal.style.display = 'none';
  };
  content.appendChild(buyBtn);

  modal.style.display = 'flex';
}

// modals.js

export function showAlertModal(title = "", message = "", closeText = "Tancar", opts = {}) {
  let modal = document.getElementById('alert-modal');
  let content = document.getElementById('alert-modal-content');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'alert-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.45)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10001';

    content = document.createElement('div');
    content.id = 'alert-modal-content';
    // Aquesta línia fa el modal més gran si opts.large és true
    content.style.maxWidth = opts.large ? '540px' : '360px';
    content.style.minWidth = opts.large ? '400px' : 'unset';
    content.style.backgroundColor = '#fff';
    content.style.padding = '30px 26px 28px 26px';
    content.style.borderRadius = '18px';
    content.style.boxShadow = '0 0 18px rgba(0,0,0,0.11)';
    content.style.textAlign = 'center';
    content.style.transition = "max-width 0.2s";
    content.style.overflowWrap = "break-word";
    modal.appendChild(content);
    document.body.appendChild(modal);
  } else {
    content.innerHTML = "";
    modal.style.display = 'flex';
    // Actualitza la mida si cal
    content.style.maxWidth = opts.large ? '540px' : '360px';
    content.style.minWidth = opts.large ? '400px' : 'unset';
  }

  const titleElem = document.createElement('div');
  titleElem.innerText = title;
  titleElem.style.fontWeight = "700";
  titleElem.style.fontSize = "1.18em";
  titleElem.style.marginBottom = "1.25em";
  content.appendChild(titleElem);

  // Si el missatge és HTML (per casos com el model ja registrat), pots injectar-lo així:
  if (opts.html) {
    const htmlDiv = document.createElement('div');
    htmlDiv.innerHTML = message;
    htmlDiv.style.background = "#f6fafd";
    htmlDiv.style.borderRadius = "9px";
    htmlDiv.style.padding = "15px 16px";
    htmlDiv.style.fontSize = "1.07em";
    htmlDiv.style.textAlign = "left";
    htmlDiv.style.marginBottom = "1.3em";
    htmlDiv.style.wordBreak = "break-word";
    content.appendChild(htmlDiv);
  } else {
    const msgElem = document.createElement('div');
    msgElem.innerText = message;
    msgElem.style.marginBottom = "1.3em";
    content.appendChild(msgElem);
  }

  const closeBtn = document.createElement('button');
  closeBtn.innerText = closeText;
  closeBtn.style.marginTop = "1em";
  closeBtn.style.background = "#2379ca";
  closeBtn.style.color = "#fff";
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '7px';
  closeBtn.style.padding = '0.7em 2.3em';
  closeBtn.style.fontSize = '1em';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => { modal.style.display = 'none'; };
  content.appendChild(closeBtn);
}

export function renderModelInfoHTML(infoObj) {
  // Analitza i separa la descripció
  let descr = infoObj["Descripció"] || "";
  let desc = "", cid = "", mb = "", img = "";

  // Regex per extreure CID, MB i IMG
  const cidMatch = descr.match(/CID:\s*([^\s]+)/);
  const mbMatch = descr.match(/MB:\s*([^\s]+)/);
  const imgMatch = descr.match(/IMG:\s*([^\s]+)/);

  desc = descr.split("CID:")[0].trim();
  if (cidMatch) cid = cidMatch[1];
  if (mbMatch) mb = mbMatch[1];
  if (imgMatch) img = imgMatch[1];

  const dataFormatejada = formatDate(infoObj["Data/hora"]); // ⬅️ ÚS AQUÍ

  return `
    <div style="background:#f6fafd;border-radius:9px;padding:15px 16px;font-size:1.07em;text-align:left;overflow-x:auto;">
      <b style="color:#195186;">Nom:</b> ${infoObj["Nom"] || ""}<br>
      <b style="color:#195186;">Hash:</b> <span style="font-family:monospace">${infoObj["Hash"] || ""}</span><br>
      <b style="color:#195186;">Versió:</b> ${infoObj["Versió"] || ""}<br>
      <b style="color:#195186;">Descripció:</b> ${desc || "-"}<br>
      <b style="color:#195186;">Data/hora:</b> ${dataFormatejada}<br>
      <b style="color:#195186;">Autor:</b> ${infoObj["Autor"] || ""}
    </div>
  `;
}






