import express from "express";
import { ethers } from "ethers";
import cors from "cors";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import axios from "axios";

// ----------- DADES DEL CONTRACTE BIMCoin -----------
const BIMCOIN_ADDRESS = "0xE464B8A1FAaC982dEe365D9fB3aC1100737Ef4B5";
const BIMCOIN_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// 🔴 Sense el 0x al davant!
const PRIVATE_KEY = "a99015595fa8a05de52abbfe36c84a1506d3256f8bfc1965564184e8845cffb5";
const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/c7c69abed6d74690ad916ccfca06953a");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, wallet);

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "tmp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// --------- ENDPOINT transferència BIMCoin ----------
app.post("/send-bimcoin", async (req, res) => {
  const { walletAddress, amount } = req.body;
  if (!walletAddress || !amount) return res.status(400).json({ error: "Falten dades" });

  try {
    const decimals = await contract.decimals();
    const amountParsed = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.transfer(walletAddress, amountParsed);
    await tx.wait();
    res.json({ status: "ok", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// ---------- ENDPOINT conversió IFC a DXF (2D: planta SVG->DXF) ----------
app.post("/convert-dxf", async (req, res) => {
  const { cid, filename } = req.body;
  if (!cid || !filename) return res.status(400).json({ error: "Falten dades" });

  const ifcPath = path.join(TEMP_DIR, "model.ifc");
  const svgPath = path.join(TEMP_DIR, "model.svg");
  const dxfPath = path.join(TEMP_DIR, "model.dxf");

  try {
    // 1. Descarrega l’IFC
    const ipfsUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;
    const response = await axios.get(ipfsUrl, { responseType: "stream" });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(ifcPath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    console.log("✅ IFC descarregat correctament");

    // 2. Converteix IFC → SVG (planta 2D)
    const ifcConvertPath = path.join(__dirname, "IfcConvert.exe"); // posa la ruta completa si cal
    console.log("🔷 Executant IfcConvert → SVG...");
    await execPromise(ifcConvertPath, [ifcPath, svgPath]);
    if (!fs.existsSync(svgPath)) throw new Error("El fitxer SVG no s'ha creat");
    console.log("✅ SVG generat correctament");

    // 3. Converteix SVG → DXF amb Inkscape
    const inkscapePath = "inkscape"; // o la ruta sencera de l'EXE
    console.log("🔷 Executant Inkscape → DXF...");
    await execPromise(inkscapePath, [svgPath, "--export-type=dxf", `--export-filename=${dxfPath}`]);
    if (!fs.existsSync(dxfPath)) throw new Error("El fitxer DXF no s'ha creat");
    console.log("✅ DXF generat correctament");

    // 4. Serveix el fitxer DXF
    res.download(dxfPath, filename.replace(/\.ifc$/i, ".dxf"), err => {
      try {
        fs.unlinkSync(ifcPath);
        fs.unlinkSync(svgPath);
        fs.unlinkSync(dxfPath);
      } catch (e) {}
      if (err) console.error("❌ Error enviant el DXF:", err);
    });
  } catch (error) {
    console.error("❌ Error en el procés convert-dxf:", error);
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

// ----------- FUNCIONS UTILS -----------
function execPromise(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Error] ${cmd}:`, stderr || stdout);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

// ----------- INICIA EL SERVIDOR -----------
app.listen(3030, () => {
  console.log("✅ BIMCoin backend actiu a http://localhost:3030");
});
