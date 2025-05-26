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
  // AFEGEIX AIXÒ:
  const provider = new BrowserProvider(window.ethereum);

  const accounts = await provider.send("eth_accounts", []);
if (!accounts.length) {
  await provider.send("eth_requestAccounts", []);
}
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

    const balance = parseFloat(formatUnits(balanceRaw.toString(), decimals));
    const walletElem = document.getElementById("walletBalance");

    if (walletElem) {
      if (balance < 0.00001) {
        // Panell-botó estilitzat amb saldo i acció de compra
        walletElem.innerHTML = `
          <button id="buyBIMC" style="
            display:inline-flex;align-items:center;gap:0.7em;
            background:#124c8d;color:#fff;border:none;border-radius:7px;
            padding:0.7em 1.6em;font-size:1.08em;cursor:pointer;
            box-shadow:0 2px 10px #124c8d18;transition:background 0.15s;">
            <span>0 BIMC</span>
            <span style="font-weight:500;background:#fff;color:#124c8d;padding:0.1em 0.8em;border-radius:6px;font-size:0.98em;">Comprar BIMC</span>
          </button>
        `;
        document.getElementById("buyBIMC").onclick = () => {
          showModal("Properament podràs comprar o sol·licitar BIMCoin directament aquí.");
          // O obre un faucet o formulari, segons la teva lògica
        };
      } else {
        walletElem.textContent = `${balance.toFixed(0)} BIMC`;
      }
    }
  } catch (e) {
    console.error("❌ Error mostrant BIMCoin:", e);
  }
}
