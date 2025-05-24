import { jsPDF } from "jspdf";

// Funció auxiliar per baixar la imatge d'IPFS/Lighthouse i convertir-la a base64
async function getImageAsBase64(imageCid) {
  const url = `https://gateway.lighthouse.storage/ipfs/${imageCid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("No s'ha pogut baixar la imatge, status: " + response.status);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generarCertificatPDF(arxiuInfo = {}) {
  const doc = new jsPDF();

  // Colors i estils
  const colorHeader = "#2379ca";
  const colorLine = "#195186";
  const colorText = "#232b38";
  const colorSoft = "#f4f8fa";

  // Capçalera
  doc.setFillColor(colorHeader);
  doc.roundedRect(5, 8, 200, 20, 4, 4, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255,255,255);
  doc.text("CERTIFICAT D'AUTENTICITAT BIMCOIN", 105, 20, { align: "center" });

  doc.setDrawColor(colorLine);
  doc.setLineWidth(1.1);
  doc.line(10, 32, 200, 32);

  doc.setFontSize(12);
  doc.setTextColor(35, 43, 56);
  doc.text("Aquest document certifica l'autenticitat i el registre d'aquest model BIM a la Blockchain.", 105, 40, { align: "center" });

  // Caixa principal (amb imatge a dalt i text a sota)
  doc.setFillColor(colorSoft);
  doc.roundedRect(10, 46, 190, 110, 2, 2, 'F');

  // --- Imatge a dalt ---
  let yImg = 56;
  let imgHeight = 60;
  let imgWidth = 90;
  let imgX = 60;
  let imgOK = false;

  if (arxiuInfo.imageCid) {
    try {
      const imageDataUrl = await getImageAsBase64(arxiuInfo.imageCid);
      doc.setDrawColor(220);
      doc.setLineWidth(0.2);
      doc.rect(imgX - 2, yImg - 2, imgWidth + 4, imgHeight + 4);
      doc.addImage(imageDataUrl, 'PNG', imgX, yImg, imgWidth, imgHeight);
      imgOK = true;
    } catch (e) {
      doc.setFont(undefined, "italic");
      doc.setFontSize(10);
      doc.text("No s'ha pogut carregar la imatge.", imgX, yImg + 20);
    }
  }

  // --- Textual DATA per sota de la imatge ---
  let yText = yImg + imgHeight + 15;
  doc.setFontSize(12);
  doc.setTextColor(colorText);

  const labels = [
    ["Nom del fitxer:", arxiuInfo.nom || "-"],
    ["Hash registrat:", arxiuInfo.hash || "-"],
    ["Data/versió:", arxiuInfo.data || "-"],
    ["Descripció:", arxiuInfo.descripcio || "-"],
  ];

  let lineCount = 0;
  labels.forEach(([label, value], i) => {
    doc.setFont(undefined, "bold");
    doc.text(label, 24, yText + lineCount * 8);
    doc.setFont(undefined, "normal");
    const valueLines = doc.splitTextToSize(value, 140);
    doc.text(valueLines, 65, yText + lineCount * 8);
    lineCount += valueLines.length;
  });

  // Afegim link de descàrrega amb hash si cal
  if (arxiuInfo.hash) {
    let baseDownloadUrl = window.location.hostname === "localhost"
      ? "http://localhost:5173/BIMCoin/index.html"
      : "https://bimcoin.app/index.html";
    const downloadUrl = `${baseDownloadUrl}?hash=${arxiuInfo.hash}`;
    doc.setTextColor("#2379ca");
    doc.setFontSize(11);
    doc.textWithLink("Descarrega el model (requereix MetaMask)", 24, yText + lineCount * 8 + 8, { url: downloadUrl });
    doc.setTextColor(colorText);
    lineCount += 2; // Espai addicional
  }

  // Calcular peu de pàgina a 260 (A4: 297mm)
  const yFooter = 255;

  // Línia divisòria horitzontal
  doc.setDrawColor(colorLine);
  doc.setLineWidth(0.5);
  doc.line(10, yFooter, 200, yFooter);

  // Caixa de signatura digital
const ySign = yFooter + 10;
const signBoxHeight = 25;
const signBoxWidth = 85;
const signBoxX = 115; // dreta de la pàgina
doc.setDrawColor("#888");
doc.setLineWidth(0.7);
doc.roundedRect(signBoxX, ySign, signBoxWidth, signBoxHeight, 2, 2, 'D');
doc.setFontSize(11);
doc.setTextColor("#888");
doc.text("Signatura digital", signBoxX + signBoxWidth / 2, ySign + signBoxHeight / 2 - 3, { align: "center", baseline: "middle" });
doc.setFontSize(8);
doc.text("Espai reservat per la signatura digital\nCertificada o manual", signBoxX + signBoxWidth / 2, ySign + signBoxHeight / 2 + 6, { align: "center" });

  // Fes el requadre clickable perquè s'obri la finestra de signatura digital
  // (Aquesta funcionalitat dependrà del lector PDF. Es genera un "acction" JavaScript que funciona en Adobe Reader)
  doc.link(signBoxX, ySign, signBoxWidth, signBoxHeight, { 
    url: "javascript:app.execMenuItem('SignDocument')"
  });

  // Peu legal sota la línia
  doc.setFontSize(9);
  doc.setTextColor(128,128,128);
  doc.text("Aquest certificat es pot verificar sempre a través de la consulta del hash a l'aplicació BIMCoin.", 105, yFooter + signBoxHeight + 15, { align: "center" });

  doc.save("certificat_bimcoin.pdf");
}
