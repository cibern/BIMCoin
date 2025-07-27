import{Contract as c,formatUnits as d,BrowserProvider as u}from"https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";const l="0xE464B8A1FAaC982dEe365D9fB3aC1100737Ef4B5",p=[{inputs:[{internalType:"address",name:"account",type:"address"}],name:"balanceOf",outputs:[{internalType:"uint256",name:"",type:"uint256"}],stateMutability:"view",type:"function"},{inputs:[],name:"decimals",outputs:[{internalType:"uint8",name:"",type:"uint8"}],stateMutability:"view",type:"function"}];async function m(){if(!window.ethereum)return alert("❌ Necessites MetaMask!"),null;const e=new u(window.ethereum);return(await e.send("eth_accounts",[])).length||await e.send("eth_requestAccounts",[]),await e.getSigner()}async function w(){try{const e=await m();if(!e)return;const n=e.provider,a=await e.getAddress(),o=new c(l,p,n),[i,s]=await Promise.all([o.balanceOf(a),o.decimals()]),r=parseFloat(d(i.toString(),s)),t=document.getElementById("walletBalance");t&&(r<1e-5?(t.innerHTML=`
          <button id="buyBIMC" style="
            display:inline-flex;align-items:center;gap:0.7em;
            background:#124c8d;color:#fff;border:none;border-radius:7px;
            padding:0.7em 1.6em;font-size:1.08em;cursor:pointer;
            box-shadow:0 2px 10px #124c8d18;transition:background 0.15s;">
            <span>0 BIMC</span>
            <span style="font-weight:500;background:#fff;color:#124c8d;padding:0.1em 0.8em;border-radius:6px;font-size:0.98em;">Comprar BIMC</span>
          </button>
        `,document.getElementById("buyBIMC").onclick=()=>{showModal("Properament podràs comprar o sol·licitar BIMCoin directament aquí.")}):t.textContent=`${r.toFixed(0)} BIMC`)}catch(e){console.error("❌ Error mostrant BIMCoin:",e)}}export{w as u};
