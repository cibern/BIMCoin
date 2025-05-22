// bimcoin.js
import {
  BrowserProvider,
  Contract,
  formatUnits
} from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";

const BIMCOIN_ADDRESS = "0xE464B8A1FAaC982dEe365D9fB3aC1100737Ef4B5";
const BIMCOIN_ABI = [
  // Només funcions usades
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
];

export async function connectWallet() {
  if (!window.ethereum) {
    alert("❌ Necessites MetaMask!");
    return null;
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return signer;
}

export async function updateBIMCoinInfo() {
  try {
    const signer = await connectWallet();
    if (!signer) return;

    const provider = signer.provider;
    const userAddress = await signer.getAddress();
    const contract = new Contract(BIMCOIN_ADDRESS, BIMCOIN_ABI, provider);

    const [balanceRaw, decimals] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.decimals()
    ]);

    const balance = parseFloat(formatUnits(balanceRaw.toString(), decimals)).toFixed(2);
    const walletElem = document.getElementById("walletBalance");

    if (walletElem) walletElem.textContent = `${balance} BIM`;
  } catch (e) {
    console.error("❌ Error mostrant BIMCoin:", e);
  }
}
