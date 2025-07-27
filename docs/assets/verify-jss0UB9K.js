import"./modulepreload-polyfill-B5Qt9EMX.js";import{_ as B,s as w,h as y,g as T}from"./modals-BVcvpyqg.js";import{u as E}from"./bimcoin-DS6TUAdR.js";import{C as _,a as F}from"./blockchainConfig-nCfmhYd7.js";import"https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";let x=[];document.addEventListener("DOMContentLoaded",async()=>{E();const i=document.getElementById("contractAddr");i&&(i.textContent=_);const u=document.getElementById("connect");u&&(u.onclick=R)});async function R(){const i=document.getElementById("result"),u=document.getElementById("address"),o=document.getElementById("search");if(i.innerHTML="",u.innerHTML="",o.value="",o.classList.remove("visible"),!window.ethereum){i.innerHTML="<b class='alert'>Necessites MetaMask per fer servir aquesta funció.</b>";return}const{BrowserProvider:p,Contract:m}=await B(async()=>{const{BrowserProvider:n,Contract:s}=await import("./index-D7ruDgPv.js");return{BrowserProvider:n,Contract:s}},[]),e=new p(window.ethereum);await e.send("eth_requestAccounts",[]);const c=(await(await e.getSigner()).getAddress()).toLowerCase();u.innerHTML="<b>Adreça connectada:</b> "+c;const r=new m(_,F,e);let a;try{a=await e.getBlockNumber()}catch{i.innerHTML="<b class='alert'>No s'ha pogut obtenir el número de bloc. Xarxa correcta?</b>";return}try{x=(await r.queryFilter("ModelRegistered",0,a)).map(s=>({hash:s.args.hash,filename:s.args.filename,version:s.args.version,description:s.args.description,datetime:s.args.datetime,author:(s.args.author||"").toString(),blockNumber:s.blockNumber})),x.sort((s,l)=>l.blockNumber-s.blockNumber),o.classList.add("visible"),A(),o.oninput=A}catch(n){console.error(n),i.innerHTML="<b class='alert'>Error consultant els registres o massa dades a processar.<br>Revisa que estàs a la xarxa correcta i que el contracte sigui correcte.</b>"}}function A(){const i=document.getElementById("result"),o=(document.getElementById("search").value||"").toLowerCase().trim();let p=x;if(o&&(p=p.filter(e=>e.filename&&e.filename.toLowerCase().includes(o)||e.version&&e.version.toLowerCase().includes(o)||e.description&&e.description.toLowerCase().includes(o)||e.datetime&&String(e.datetime).toLowerCase().includes(o)||e.author&&String(e.author).toLowerCase().includes(o)||e.hash&&e.hash.toLowerCase().includes(o))),p=p.slice(0,10),p.length===0){i.innerHTML="<i>No hi ha registres coincidents.</i>";return}i.innerHTML="<h3>A continuació es mostren els 10 últims models IFC registrats a la BlockChain:</h3>",p.forEach((e,d)=>{let c=null,r=null,a=null;const n=e.description&&e.description.match(/CID:\s*([a-z0-9]+)/i);n&&(c=n[1]);const s=e.description&&e.description.match(/IMG:\s*([a-z0-9]+)/i);s&&(r=s[1]);const l=e.description&&e.description.match(/MB:\s*([\d.]+)/i);l&&(a=parseFloat(l[1]));let t="";a!==null&&!isNaN(a)&&(t=Math.ceil(a),t=Math.max(1,t),t=t*10),i.innerHTML+=`
  <div class="hash-item">
    <b>#${d+1} — ${e.filename}</b><br>
    <span class="hash">${e.hash}</span>
    <span>Versió: <b>${e.version}</b></span><br>
    <span>Descripció: ${(e.description||"-").replace(/CID:\s*[a-z0-9]+/i,"").replace(/IMG:\s*[a-z0-9]+/i,"").replace(/MB:\s*[\d.]+/i,"").replace(/\n+$/,"").trim()}</span><br>
    <span style="color:#777">Data: ${P(e.datetime)}</span><br>
    <span style="color:#aaa">Author: ${e.author}</span>
    ${r?`
      <div style="display: flex; align-items: flex-start; gap: 2em; margin-top: 1.2em;">
        <img src="https://gateway.lighthouse.storage/ipfs/${r}" 
          alt="Captura del model" 
          style="max-width: 180px; border-radius: 0.6em; box-shadow: 0 2px 8px #0002; max-height: 160px;">

        <div style="display: flex; flex-direction: column; gap: 1.1em;">
          <div style="display: flex; align-items: center; gap: 0.7em;">
            <button
              class="download-btn"
              data-cid="${c}"
              data-filename="${e.filename||"model"}.ifc"
              data-cost="${t}"
            >
              ⬇️ Descarregar IFC
            </button>
            ${t?`
              <span style="font-size:1.1em; color:#195186; background:#e7f6fa; border-radius:7px; padding:0.4em 0.8em; display:inline-block;">
                💰 ${t} BIMCoin
              </span>
            `:""}
          </div>
          <div>
            <button
              class="download-pdf-btn"
              data-index="${d}"
              style="margin-top:0.8em;"
            >
              📄 Descarregar PDF
            </button>
            <span style="margin-left:1em;color:#195186;">Sense cap cost</span>
          </div>
        </div>
      </div>
    `:""}
  </div>
`}),document.querySelectorAll(".download-btn").forEach(e=>{e.onclick=async function(){const d=e.getAttribute("data-cid"),c=e.getAttribute("data-filename")||"model.ifc",r=Number(e.getAttribute("data-cost"))||0;window.onbeforeunload=function(a){return a.preventDefault(),a.returnValue="La descàrrega està en procés. Si surts, pots perdre el fitxer pel qual ja has pagat!",a.returnValue};try{if(!r||isNaN(r)){await m(d,c,e);return}w("💰 Comprovant saldo de BIMCoin..."),await C(2e3);const{BrowserProvider:a,Contract:n,parseUnits:s,formatUnits:l}=await B(async()=>{const{BrowserProvider:v,Contract:k,parseUnits:N,formatUnits:S}=await import("./index-D7ruDgPv.js");return{BrowserProvider:v,Contract:k,parseUnits:N,formatUnits:S}},[]),t="0xE464B8A1FAaC982dEe365D9fB3aC1100737Ef4B5",L=["function transfer(address to, uint256 value) public returns (bool)","function decimals() public view returns (uint8)","function balanceOf(address) public view returns (uint256)"],M="0x03c89df2366f99C8e4E4C9010143d54064c0E893";w("🔌 Connectant a MetaMask..."),await C(2e3);const b=new a(window.ethereum);await b.send("eth_requestAccounts",[]);const f=await b.getSigner(),I=new n(t,L,f),g=await I.decimals(),h=s(r.toString(),g),$=await f.getAddress(),D=await I.balanceOf($);if(D<h){y(),B(()=>import("./modals-BVcvpyqg.js").then(v=>v.m),[]).then(v=>{v.showInsufficientBIMCoinModal(Number(l(D,g)),Number(l(h,g)))}),e.textContent="⬇️ Descarregar IFC",window.onbeforeunload=null;return}w("💸 Realitzant pagament amb BIMCoin..."),await C(2e3),await(await I.transfer(M,h)).wait(),E(),w("⬇️ Baixant fitxer IFC..."),await C(2e3),await m(d,c,e),E()}catch(a){y(),alert("❌ Error en el pagament o descàrrega: "+(a.message||a)),e.textContent="⬇️ Descarregar IFC"}finally{window.onbeforeunload=null,y()}}}),document.querySelectorAll(".download-pdf-btn").forEach(e=>{e.onclick=async function(){const d=parseInt(e.getAttribute("data-index"),10),r=(document.getElementById("search").value||"").toLowerCase().trim();let a=x;r&&(a=a.filter(t=>t.filename&&t.filename.toLowerCase().includes(r)||t.version&&t.version.toLowerCase().includes(r)||t.description&&t.description.toLowerCase().includes(r)||t.datetime&&String(t.datetime).toLowerCase().includes(r)||t.author&&String(t.author).toLowerCase().includes(r)||t.hash&&t.hash.toLowerCase().includes(r))),a=a.slice(0,10);const n=a[d];let s=null;const l=n.description&&n.description.match(/IMG:\s*([a-z0-9]+)/i);l&&(s=l[1]),n&&T({nom:n.filename||"-",hash:n.hash||"-",data:n.datetime||"-",descripcio:n.description||"-",imageCid:s})}});async function m(e,d,c){try{w("⬇️ Iniciant descàrrega IFC..."),await C(2e3);const r=await fetch(`https://gateway.lighthouse.storage/ipfs/${e}`);if(!r.ok)throw new Error("No s'ha pogut descarregar el fitxer");const a=r.headers.get("Content-Length");if(!r.body)throw new Error("La resposta no té body stream!");const n=a?parseInt(a,10):null,s=r.body.getReader();let l=0,t=[];c.textContent="Descarregant... 0%";let L=0;for(;;){const{done:I,value:g}=await s.read();if(I)break;if(t.push(g),l+=g.length,n){const h=Math.floor(l/n*100);c.textContent=`Descarregant... ${h}%`,(h-L>=10||h===100)&&(w(`⬇️ Baixant fitxer... ${h}%`),await C(2e3),L=h)}else c.textContent=`Descarregant... (${(l/1024/1024).toFixed(1)} MB)`}y();const M=new Blob(t),b=window.URL.createObjectURL(M),f=document.createElement("a");f.href=b,f.download=d,document.body.appendChild(f),f.click(),setTimeout(()=>{window.URL.revokeObjectURL(b),f.remove(),c.textContent="⬇️ Descarregar IFC"},1e3)}catch{y(),alert("Error descarregant el fitxer IFC!"),c.textContent="⬇️ Descarregar IFC"}}}function P(i){if(!i)return"";const[u,o]=i.split("T"),[p,m,e]=u.split("-"),d=o?o.slice(0,5):"";return`${e}/${m}/${p}${d?" ("+d+")":""}`}function C(i){return new Promise(u=>setTimeout(u,i))}
