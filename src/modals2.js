// --- MOSTRA EL MODAL ---
// --- MOSTRA EL MODAL DESCÀRREGA ---
export function showDownloadModal() {
  document.getElementById("download-modal").style.display = "flex";
  resetDownloadModal();
}

// --- Tanca el modal descàrrega ---
function hideDownloadModal() {
  document.getElementById("download-modal").style.display = "none";
  resetDownloadModal();
}

// --- Obrir el modal amb el botó principal únic ---
document.getElementById("convert-download-modal-btn").onclick = showDownloadModal;

// --- Tanca el modal des de X o Tancar ---
document.getElementById("close-download-modal").onclick = hideDownloadModal;
document.getElementById("cancel-download-modal").onclick = hideDownloadModal;

// --- Reseteja contingut del modal descàrrega ---
function resetDownloadModal() {
  document.getElementById("levels-download-list").innerHTML = '';
  document.getElementById("modal-download-actions").innerHTML = '';
  document.getElementById("modal-download-result").textContent = '';
  document.getElementById("ifc-download-upload").value = '';
  document.getElementById("cancel-download-modal").style.display = "none";
  window._lastIfcDownloadFile = null;
}

// --- Obrir input file (des del botó dins modal) ---
document.getElementById("load-ifc-download-btn").onclick = () => {
  document.getElementById("ifc-download-upload").click();
};

// --- Quan es carrega l’IFC... ---
document.getElementById("ifc-download-upload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("modal-download-result").textContent = "Analitzant nivells...";
  const formData = new FormData();
  formData.append("file", file);

  let levels = [];
  let status = "";
  try {
    const response = await fetch("http://localhost:8000/get_levels", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    levels = data.levels || [];
    status = data.status || "";
    if (status.startsWith("error")) {
      document.getElementById("modal-download-result").textContent = "Error: " + status;
      return;
    }
  } catch (err) {
    document.getElementById("modal-download-result").textContent = "Error llegint nivells de l'IFC.";
    return;
  }

  // Mostra nivells com a checkboxes
  document.getElementById("modal-download-result").textContent = "Nivells trobats:";
  const levelsDiv = document.getElementById("levels-download-list");
  levelsDiv.innerHTML = '';
  levels.forEach((level, i) => {
    const id = `level-download-check-${i}`;
    const label = document.createElement("label");
    label.style.display = "block";
    label.innerHTML = `<input type="checkbox" id="${id}" value="${level}" checked> ${level}`;
    levelsDiv.appendChild(label);
  });

  // Mostra botons de descàrrega després de carregar nivells
  const actionsDiv = document.getElementById("modal-download-actions");
  actionsDiv.innerHTML = `
    <button id="download-dxf3d-action-btn">Descarrega DXF 3D</button>
    <button id="download-dxf2d-action-btn">Descarrega DXF 2D</button>
    <button id="download-pdf-action-btn">Descarrega PDF</button>
  `;

  // Guarda fitxer per a conversions posteriors
  window._lastIfcDownloadFile = file;
  document.getElementById("cancel-download-modal").style.display = "block";
});

// --- ACCIÓ: Descarrega DXF 3D (tot el model, sense filtrar nivells) ---
document.addEventListener("click", async (e) => {
  if (e.target && e.target.id === "download-dxf3d-action-btn") {
    const file = window._lastIfcDownloadFile;
    if (!file) return;
    document.getElementById("modal-download-result").textContent = "Convertint a DXF 3D...";

    // 1. IFC → OBJ
    const formData = new FormData();
    formData.append("file", file);
    const objResponse = await fetch("http://localhost:8000/convert", { method: "POST", body: formData });
    if (!objResponse.ok) {
      document.getElementById("modal-download-result").textContent = "Error convertint IFC a OBJ!";
      return;
    }
    const objBlob = await objResponse.blob();

    // 2. OBJ → DXF
    const objToDxfForm = new FormData();
    objToDxfForm.append("file", new File([objBlob], "model.obj"));
    const dxfResponse = await fetch("http://localhost:8000/obj2dxf", { method: "POST", body: objToDxfForm });
    if (!dxfResponse.ok) {
      document.getElementById("modal-download-result").textContent = "Error convertint OBJ a DXF!";
      return;
    }
    const dxfBlob = await dxfResponse.blob();
    const url = window.URL.createObjectURL(dxfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "model_3d.dxf";
    a.click();
    window.URL.revokeObjectURL(url);

    document.getElementById("modal-download-result").textContent = "DXF 3D descarregat!";
  }
});

// --- ACCIÓ: Descarrega DXF 2D segons nivells seleccionats ---
document.addEventListener("click", async (e) => {
  if (e.target && e.target.id === "download-dxf2d-action-btn") {
    const file = window._lastIfcDownloadFile;
    if (!file) return;
    // Recull nivells seleccionats
    const levelsDiv = document.getElementById("levels-download-list");
    const checked = Array.from(levelsDiv.querySelectorAll("input[type=checkbox]:checked")).map(cb => cb.value);

    if (!checked.length) {
      document.getElementById("modal-download-result").textContent = "Selecciona almenys un nivell!";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("levels", JSON.stringify(checked));

    document.getElementById("modal-download-result").textContent = "Convertint a DXF 2D...";

    // Nova crida a backend
    const dxfResponse = await fetch("http://localhost:8000/dxf2d", {
      method: "POST",
      body: formData,
    });

    if (!dxfResponse.ok) {
      document.getElementById("modal-download-result").textContent = "Error convertint a DXF 2D!";
      return;
    }

    // Descarrega DXF
    const dxfBlob = await dxfResponse.blob();
    const url = window.URL.createObjectURL(dxfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nivells_planta.dxf";
    a.click();
    window.URL.revokeObjectURL(url);

    document.getElementById("modal-download-result").textContent = "DXF 2D descarregat!";
  }
});

// --- ACCIÓ: Descarrega PDF ---
document.addEventListener("click", async (e) => {
  if (e.target && e.target.id === "download-pdf-action-btn") {
    document.getElementById("modal-download-result").textContent = "Funcionalitat PDF pendent!";
  }
});
