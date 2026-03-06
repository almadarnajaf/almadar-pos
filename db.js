const DB_NAME = "almadar_db";
const DB_VER  = 2;

function openDB(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;

      const ensureStore = (name, opts, indexes=[])=>{
        if(!db.objectStoreNames.contains(name)){
          const s = db.createObjectStore(name, opts);
          indexes.forEach(ix => s.createIndex(ix.name, ix.keyPath, ix.options||{}));
        }
      };

      ensureStore("products",{keyPath:"id",autoIncrement:true},[
        {name:"sku", keyPath:"sku", options:{unique:true}},
        {name:"name", keyPath:"name", options:{unique:false}}
      ]);
      ensureStore("moves",{keyPath:"id",autoIncrement:true},[
        {name:"ts", keyPath:"ts", options:{unique:false}}
      ]);
      ensureStore("sales",{keyPath:"id",autoIncrement:true},[
        {name:"ts", keyPath:"ts", options:{unique:false}}
      ]);
      ensureStore("settings",{keyPath:"key"});
      ensureStore("backups",{keyPath:"id",autoIncrement:true},[
        {name:"ts", keyPath:"ts", options:{unique:false}}
      ]);
      ensureStore("counters",{keyPath:"key"});
    };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror   = ()=>reject(req.error);
  });
}

async function tx(storeNames, mode, fn){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const t = db.transaction(storeNames, mode);
    const st = {};
    storeNames.forEach(n => st[n] = t.objectStore(n));
    fn(st, t);
    t.oncomplete = ()=>resolve(true);
    t.onerror = ()=>reject(t.error);
  });
}

async function getSetting(key, fallback){
  const db = await openDB();
  return new Promise((resolve)=>{
    const t = db.transaction(["settings"],"readonly");
    const r = t.objectStore("settings").get(key);
    r.onsuccess = ()=> resolve(r.result ? r.result.value : fallback);
    r.onerror = ()=> resolve(fallback);
  });
}
async function setSetting(key, value){
  return tx(["settings"],"readwrite",(st)=> st.settings.put({key,value}));
}

async function getCounter(key){
  const db = await openDB();
  return new Promise((resolve)=>{
    const t = db.transaction(["counters"],"readonly");
    const r = t.objectStore("counters").get(key);
    r.onsuccess = ()=> resolve(r.result ? r.result.value : 0);
    r.onerror = ()=> resolve(0);
  });
}
async function setCounter(key, value){
  return tx(["counters"],"readwrite",(st)=> st.counters.put({key,value}));
}
function pad3(n){ return String(n).padStart(3,"0"); }

async function generateSKU(cat, spec){
  cat  = (cat||"OTH").trim().toUpperCase();
  spec = (spec||"GEN").trim().toUpperCase().replace(/\s+/g,"");
  const key = `SKU:${cat}:${spec}`;
  let n = await getCounter(key);
  n += 1;
  await setCounter(key, n);
  return `${cat}-${spec}-${pad3(n)}`;
}

async function listProducts(query=""){
  const db = await openDB();
  query = (query||"").trim().toLowerCase();
  return new Promise((resolve)=>{
    const t = db.transaction(["products"],"readonly");
    const s = t.objectStore("products");
    const out = [];
    s.openCursor().onsuccess = (e)=>{
      const c = e.target.result;
      if(!c){ out.sort((a,b)=>(a.name||"").localeCompare(b.name||"")); resolve(out); return; }
      const v = c.value;
      const hit = !query || (v.name||"").toLowerCase().includes(query) || (v.sku||"").toLowerCase().includes(query);
      if(hit) out.push(v);
      c.continue();
    };
  });
}

async function getProductBySKU(sku){
  sku = (sku||"").trim().toUpperCase();
  const db = await openDB();
  return new Promise((resolve)=>{
    const t = db.transaction(["products"],"readonly");
    const idx = t.objectStore("products").index("sku");
    const r = idx.get(sku);
    r.onsuccess = ()=> resolve(r.result || null);
    r.onerror = ()=> resolve(null);
  });
}

async function saveProduct(p){
  await tx(["products"],"readwrite",(st)=> st.products.put(p));
}
async function deleteProductById(id){
  await tx(["products"],"readwrite",(st)=> st.products.delete(id));
}

async function addMove(move){
  move.ts = Date.now();
  await tx(["moves"],"readwrite",(st)=> st.moves.add(move));
}
async function listMoves(limit=40){
  const db = await openDB();
  return new Promise((resolve)=>{
    const t = db.transaction(["moves"],"readonly");
    const idx = t.objectStore("moves").index("ts");
    const out = [];
    idx.openCursor(null,"prev").onsuccess = (e)=>{
      const c = e.target.result;
      if(!c || out.length>=limit){ resolve(out); return; }
      out.push(c.value);
      c.continue();
    };
  });
}

async function addSale(sale){
  sale.ts = sale.ts || Date.now();
  await tx(["sales"],"readwrite",(st)=> st.sales.add(sale));
}
async function listSales(limit=80){
  const db = await openDB();
  return new Promise((resolve)=>{
    const t = db.transaction(["sales"],"readonly");
    const idx = t.objectStore("sales").index("ts");
    const out = [];
    idx.openCursor(null,"prev").onsuccess = (e)=>{
      const c = e.target.result;
      if(!c || out.length>=limit){ resolve(out); return; }
      out.push(c.value);
      c.continue();
    };
  });
}

async function nextInvoiceNo(){
  const key = "INVOICE_NO";
  let n = await getCounter(key);
  n += 1;
  await setCounter(key, n);
  return n;
}

async function exportAllData(){
  const db = await openDB();
  const readStore = (name)=> new Promise((resolve)=>{
    const t = db.transaction([name],"readonly");
    const s = t.objectStore(name);
    const arr = [];
    s.openCursor().onsuccess = (e)=>{
      const c = e.target.result;
      if(!c){ resolve(arr); return; }
      arr.push(c.value);
      c.continue();
    };
  });
  return {
    meta:{app:"almadar",ver:2,ts:Date.now()},
    products: await readStore("products"),
    moves:    await readStore("moves"),
    sales:    await readStore("sales"),
    settings: await readStore("settings"),
    counters: await readStore("counters"),
  };
}

async function downloadBackupFile(){
  const data = await exportAllData();
  const blob = new Blob([JSON.stringify(data)], {type:"application/json"});
  const a = document.createElement("a");
  const dt = new Date();
  const name =
    `almadar_backup_${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`+
    `_${String(dt.getHours()).padStart(2,"0")}-${String(dt.getMinutes()).padStart(2,"0")}.json`;
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function restoreFromData(data){
  if(!data?.meta || data.meta.app !== "almadar") throw new Error("ملف غير صالح");
  const db = await openDB();
  const stores = ["products","moves","sales","settings","counters"];

  await new Promise((resolve,reject)=>{
    const t = db.transaction(stores,"readwrite");
    stores.forEach(n=>t.objectStore(n).clear());
    t.oncomplete=()=>resolve(true);
    t.onerror=()=>reject(t.error);
  });

  await tx(stores,"readwrite",(st)=>{
    (data.products||[]).forEach(x=>st.products.put(x));
    (data.moves||[]).forEach(x=>st.moves.put(x));
    (data.sales||[]).forEach(x=>st.sales.put(x));
    (data.settings||[]).forEach(x=>st.settings.put(x));
    (data.counters||[]).forEach(x=>st.counters.put(x));
  });
}

async function internalSnapshot(reason="auto"){
  const auto = await getSetting("autoSnapshot","on");
  if(auto !== "on") return;

  const keep = Number(await getSetting("keepBackups",200)) || 200;
  const payload = await exportAllData();

  await tx(["backups"],"readwrite",(st)=> st.backups.add({ts:Date.now(),reason,payload}));

  const db = await openDB();
  const ids = await new Promise((resolve)=>{
    const t = db.transaction(["backups"],"readonly");
    const idx = t.objectStore("backups").index("ts");
    const out = [];
    idx.openCursor().onsuccess = (e)=>{
      const c = e.target.result;
      if(!c){ resolve(out); return; }
      out.push({id:c.value.id, ts:c.value.ts});
      c.continue();
    };
  });

  if(ids.length > keep){
    ids.sort((a,b)=>a.ts-b.ts);
    const del = ids.slice(0, ids.length-keep);
    await tx(["backups"],"readwrite",(st)=> del.forEach(x=>st.backups.delete(x.id)));
  }
}