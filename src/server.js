import express from "express";
import { ethers } from "ethers";
import cors from "cors";

// DADES DEL CONTRACTE
const BIMCOIN_ADDRESS = "0xE464B8A1FAaC982dEe365D9fB3aC1100737Ef4B5";           // Adreça del contracte BIMCoin
const BIMCOIN_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
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

const PRIVATE_KEY = "a99015595fa8a05de52abbfe36c84a1506d3256f8bfc1965564184e8845cffb5"; // ⚠️ Només pel backend! (wallet que té BIMCoin)

const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/c7c69abed6d74690ad916ccfca06953a");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, wallet);

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint per transferir BIMCoin
app.post("/send-bimcoin", async (req, res) => {
  const { walletAddress, amount } = req.body;
  if (!walletAddress || !amount) return res.status(400).json({ error: "Falten dades" });

  try {
    // Obté decimals del contracte per convertir a uint256
    const decimals = await contract.decimals();
    const amountParsed = ethers.parseUnits(amount.toString(), decimals);

    // Transfer BIMCoins
    const tx = await contract.transfer(walletAddress, amountParsed);
    await tx.wait();
    res.json({ status: "ok", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(3030, () => {
  console.log("BIMCoin backend running on http://localhost:3030");
});
