import { updateBIMCoinInfo } from './bimcoin.js';

// L'adreça del contracte de registre de models
const contractAddress = "0x03c89df2366f99C8e4E4C9010143d54064c0E893";
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
  }
];

let lastEvents = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Mostra saldo BIMCoin
  updateBIMCoinInfo();

  
});

