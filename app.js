// ✅ لا Service Worker (حتى لا يصير كاش ويخرب عليك التحديث)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(()=>{});
}

const $ = (id)=>document.getElementById(id);
const money = (n)=>Number(n||0).toLocaleString("en-US");
const nowStr = (ts)=> new Date(ts||Date.now()).toLocaleString("ar-IQ");
const escapeHtml = (s)=> String(s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const unitName = (u)=>({pcs:"قطعة",m:"متر",roll:"رول",kg:"كغم"})[u]||"وحدة";

// ===== PIN =====
const PIN_KEY = "almadar_pin_v1";
const SESSION_KEY = "almadar_unlocked_v1";
const UNLOCK_UNTIL_KEY = "almadar_unlocked_until_v1";

// ✅ نخزن sku مؤقتاً حتى بعد إدخال PIN نعرض الخيارات الثلاث
const PENDING_SKU_KEY = "almadar_pending_sku";

function getPin(){ return localStorage.getItem(PIN_KEY) || ""; }
function setPin(pin){ localStorage.setItem(PIN_KEY, pin); }
function isUnlocked(){
  if(sessionStorage.getItem(SESSION_KEY)==="1") return true;
  const until = Number(localStorage.getItem(UNLOCK_UNTIL_KEY)||"0");
  return Date.now() < until;
}
function setUnlockedForHours(hours){
  localStorage.setItem(UNLOCK_UNTIL_KEY, String(Date.now()+hours*3600*1000));
  sessionStorage.setItem(SESSION_KEY,"1");
}
function lockNow(){
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(UNLOCK_UNTIL_KEY);
}

/* =========================================================
   ✅ Public Landing (يعرض اسم المادة + سعر البيع + التكلفة إذا موجودة على نفس الجهاز)
   ========================================================= */
async function showPublicLanding(){
  const phones1 = "07838444634";
  const phones2 = "07771149446";
  const address = "النجف الاشرف - خان المخضر - شارع مدرسة فلسطين";

  // احصل SKU من الرابط إن وجد
  let sku = "";
  try{
    const u = new URL(location.href);
    sku = (u.searchParams.get("sku") || "").trim().toUpperCase();
  }catch(e){}

  // حاول جلب بيانات المادة من قاعدة البيانات (إذا كانت على نفس الجهاز)
  let p = null;
  if(sku){
    try{ p = await getProductBySKU(sku); }catch(e){}
  }

  const infoHtml = p ? `
    <div style="margin-top:12px;border:1px solid #e5e7eb;border-radius:14px;padding:12px;background:#fff;">
      <div style="font-size:15px;font-weight:900;color:#111827;margin-bottom:8px;">
        ${escapeHtml(p.name || "—")}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;">
        <span style="border:1px solid #e5e7eb;border-radius:999px;padding:6px 10px;font-size:12px;color:#374151;">
          الباركود: <b>${escapeHtml(p.sku || sku)}</b>
        </span>
        <span style="border:1px solid #e5e7eb;border-radius:999px;padding:6px 10px;font-size:12px;color:#374151;">
          سعر البيع: <b>${money(p.price || 0)}</b>
        </span>
        <span style="border:1px solid #e5e7eb;border-radius:999px;padding:6px 10px;font-size:12px;color:#374151;">
          التكلفة: <b>${money(p.cost || 0)}</b>
        </span>
      </div>
    </div>
  ` : (sku ? `
    <div style="margin-top:12px;border:1px solid #e5e7eb;border-radius:14px;padding:12px;background:#fff;">
      <div style="font-size:13px;color:#b91c1c;">
        لم يتم العثور على المادة ضمن مخزون هذا الجهاز.
      </div>
      <div style="font-size:12px;color:#6b7280;margin-top:6px;">
        الباركود: <b>${escapeHtml(sku)}</b>
      </div>
    </div>
  ` : "");

  document.body.innerHTML = `
    <div style="font-family:Arial,Tahoma;background:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:22px;">
      <div style="max-width:560px;width:100%;border:1px solid #e5e7eb;border-radius:18px;padding:20px;box-shadow:0 8px 30px rgba(0,0,0,.06);">
        
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
          <div style="text-align:right;">
            <div style="font-size:26px;font-weight:800;color:#111827;">مركز المدار</div>
            <div style="margin-top:6px;font-size:13px;line-height:1.8;color:#374151;">
              هذا QR/باركود داخلي خاص بإدارة المخزون والمبيعات لدى <b>مركز المدار</b>.
            </div>
          </div>
          <div style="min-width:42px;height:42px;border-radius:14px;background:#fff7ed;border:1px solid #fde68a;display:flex;align-items:center;justify-content:center;font-size:20px;">🟨</div>
        </div>

        ${infoHtml}

        <div style="margin-top:14px;border-top:1px dashed #e5e7eb;padding-top:14px;">
          <div style="display:grid;grid-template-columns:1fr;gap:10px;">
            <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;background:#ffffff;">
              <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">أرقام الهاتف</div>
              <div style="font-size:16px;font-weight:700;color:#111827;direction:ltr;text-align:right;">${phones1}</div>
              <div style="font-size:16px;font-weight:700;color:#111827;direction:ltr;text-align:right;margin-top:2px;">${phones2}</div>
            </div>
            <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;background:#ffffff;">
              <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">العنوان</div>
              <div style="font-size:14px;font-weight:700;color:#111827;line-height:1.9;">${address}</div>
            </div>
          </div>

          <div style="margin-top:12px;font-size:12px;color:#6b7280;line-height:1.8;">
            إذا كنت صاحب الجهاز وتريد الدخول للنظام، افتح البرنامج وأدخل PIN.
          </div>
        </div>

        <div style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button id="pubClose"
            style="padding:10px 16px;border:1px solid #d1d5db;border-radius:12px;background:#fff;cursor:pointer;font-weight:700;">
            إغلاق
          </button>
        </div>

      </div>
    </div>
  `;

  document.getElementById("pubClose").onclick = ()=> history.back();
}

/* =========================================================
   PIN Gate
   ========================================================= */
function showPinGate(appHTML){
  const saved = getPin();
  document.body.innerHTML = `
    <div style="font-family:Arial,Tahoma;background:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="max-width:520px;width:100%;border:1px solid #e5e7eb;border-radius:16px;padding:18px;box-shadow:0 8px 30px rgba(0,0,0,.06);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:18px;font-weight:800;">مركز المدار</div>
          <div style="font-size:12px;color:#666;">PIN</div>
        </div>

        <div style="margin-top:10px;color:#444;font-size:13px;line-height:1.8;">
          أدخل رمز الحماية لفتح البرنامج.
        </div>

        <div style="margin-top:14px;">
          <input id="pinInput" inputmode="numeric" maxlength="8" placeholder="ادخل PIN"
            style="width:100%;padding:12px;border:1px solid #e5e7eb;border-radius:12px;font-size:16px;outline:none;">
          <div id="pinMsg" style="margin-top:8px;font-size:12px;color:#b91c1c;min-height:16px;"></div>
        </div>

        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
          <button id="pinOpen" style="flex:1;padding:10px 14px;border:1px solid #d97706;border-radius:12px;background:#f59e0b;cursor:pointer;font-weight:800;">فتح</button>
          <button id="pinClose" style="padding:10px 14px;border:1px solid #d1d5db;border-radius:12px;background:#fff;cursor:pointer;">إغلاق</button>
        </div>

        ${ saved ? "" : `
          <div style="margin-top:12px;border-top:1px dashed #e5e7eb;padding-top:12px;">
            <div style="font-size:12px;color:#666;">أول مرة؟ ضع PIN جديد:</div>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <input id="newPin" inputmode="numeric" maxlength="8" placeholder="PIN جديد"
                style="flex:1;padding:10px;border:1px solid #e5e7eb;border-radius:12px;">
              <button id="saveNewPin" style="padding:10px 14px;border:1px solid #d1d5db;border-radius:12px;background:#fff;cursor:pointer;">حفظ</button>
            </div>
            <div style="margin-top:8px;font-size:11px;color:#666;">(PIN يُحفظ على جهازك فقط)</div>
          </div>
        `}
      </div>
    </div>
  `;
  const msg = (t)=> (document.getElementById("pinMsg").textContent = t);

  // ✅ لأن showPublicLanding صار async
  document.getElementById("pinClose").onclick = async ()=> { await showPublicLanding(); };

  document.getElementById("pinOpen").onclick = ()=>{
    const p = (document.getElementById("pinInput").value||"").trim();
    const savedPin = getPin();
    if(!savedPin){ msg("لم يتم تعيين PIN بعد. ضع PIN جديد ثم احفظ."); return; }
    if(p !== savedPin){ msg("PIN غير صحيح."); return; }
    setUnlockedForHours(8);
    document.body.innerHTML = appHTML;
    location.reload();
  };

  const saveBtn = document.getElementById("saveNewPin");
  if(saveBtn){
    saveBtn.onclick = ()=>{
      const p = (document.getElementById("newPin").value||"").trim();
      if(p.length < 4){ msg("PIN يجب 4 أرقام أو أكثر."); return; }
      if(!/^\d+$/.test(p)){ msg("PIN أرقام فقط."); return; }
      setPin(p);
      msg("تم حفظ PIN ✅ الآن اكتب PIN بالأعلى ثم فتح.");
    };
  }
}

/* =========================================================
   Gate by SKU (مهم: async لأن showPublicLanding async)
   ========================================================= */
(async function gateAtStart(){
  const appHTML = document.body.innerHTML;
  let skuParam = "";
  try{
    const u = new URL(location.href);
    skuParam = (u.searchParams.get("sku")||"").trim();
  }catch(e){}

  if(skuParam){
    // ✅ خزّن sku مؤقتاً حتى لو طلب PIN
    sessionStorage.setItem(PENDING_SKU_KEY, skuParam.toUpperCase());

    // إذا فتح من QR
    if(!getPin()){
      // بدون PIN: اعتبره زبون -> صفحة عامة (مع معلومات المادة على نفس الجهاز)
      document.body.innerHTML = "";
      await showPublicLanding();
      return;
    }
    if(!isUnlocked()){
      document.body.innerHTML = "";
      showPinGate(appHTML);
      return;
    }
  } else {
    // فتح طبيعي: إذا PIN موجود ومقفول -> اطلب PIN
    if(getPin() && !isUnlocked()){
      document.body.innerHTML = "";
      showPinGate(appHTML);
      return;
    }
  }
})();

// ===== App state =====
let editingProduct = null;
let cart = [];
let labelSelected = new Map();

// ===== Tabs =====
function showTab(name){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===name));
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("show"));
  const el = $("tab-"+name);
  if(el) el.classList.add("show");
}
document.querySelectorAll(".tab").forEach(btn=> btn.addEventListener("click", ()=>showTab(btn.dataset.tab)));

// ===== Parse QR link to SKU =====
function parseBarcodeToSKU(text){
  const raw = String(text||"").trim();
  if(!raw) return null;
  try{
    const u = new URL(raw);
    const sku = u.searchParams.get("sku");
    if(sku) return String(sku).trim().toUpperCase();
  }catch(e){}
  return raw.toUpperCase();
}

// ===== Inventory =====
async function refreshInventory(){
  const q = $("invSearch").value || "";
  const list = await listProducts(q);
  const box = $("invList");
  box.innerHTML = "";
  list.forEach(p=>{
    const low = Number(p.qty||0) <= Number(p.minQty||0);
    const el = document.createElement("div");
    el.className="item";
    el.innerHTML = `
      <div class="meta">
        <b>${escapeHtml(p.name||"")}</b>
        <div class="badge">${escapeHtml(p.sku||"—")} • ${unitName(p.unit)} • تكلفة:${money(p.cost)} • بيع:${money(p.price)} • متوفر:${money(p.qty||0)}</div>
      </div>
      <div class="row" style="gap:6px">
        <span class="badge ${low?"low":"ok"}">${low?"قريب نفاد":"متوفر"}</span>
        <button class="btn ghost">فتح</button>
      </div>
    `;
    el.querySelector("button").onclick = ()=> openProductModal(p);
    box.appendChild(el);
  });
}
$("invSearch").addEventListener("input", refreshInventory);

// ===== Moves =====
async function refreshMoves(){
  const moves = await listMoves(40);
  const box = $("movesList");
  box.innerHTML = "";
  moves.forEach(m=>{
    const el = document.createElement("div");
    el.className="item";
    el.innerHTML = `
      <div class="meta">
        <b>${escapeHtml(m.type||"MOVE")}</b>
        <div class="badge">${escapeHtml(nowStr(m.ts))}${m.sku?(" • "+escapeHtml(m.sku)):""}</div>
      </div>
      <div class="badge">${escapeHtml(m.note||"")}${m.qty?(" • كمية:"+money(m.qty)):""}</div>
    `;
    box.appendChild(el);
  });
}

// ===== Product modal =====
const pm = $("productModal");
$("pmClose").onclick = ()=> pm.close();

function openProductModal(p=null){
  editingProduct = p ? {...p} : {name:"",cat:"CEL",spec:"",unit:"pcs",cost:0,price:0,qty:0,minQty:0,sku:""};
  $("pmTitle").textContent = p ? "تعديل مادة" : "إضافة مادة";
  $("pName").value = editingProduct.name||"";
  $("pCat").value  = editingProduct.cat||"CEL";
  $("pSpec").value = editingProduct.spec||"";
  $("pUnit").value = editingProduct.unit||"pcs";
  $("pCost").value = editingProduct.cost||0;
  $("pPrice").value= editingProduct.price||0;
  $("pQty").value  = editingProduct.qty||0;
  $("pMin").value  = editingProduct.minQty||0;
  $("pSku").textContent = editingProduct.sku||"—";
  $("deleteProduct").style.display = p ? "inline-block" : "none";
  pm.showModal();
}

$("btnAddProduct").onclick = ()=> openProductModal(null);
$("btnNewProduct2").onclick = ()=> openProductModal(null);

$("genSku").onclick = async ()=>{
  const sku = await generateSKU($("pCat").value, $("pSpec").value||"GEN");
  $("pSku").textContent = sku;
};

$("saveProduct").onclick = async ()=>{
  const sku = $("pSku").textContent.trim().toUpperCase();
  if(!sku || sku==="—"){ alert("اضغط توليد باركود أولاً"); return; }

  const p = editingProduct || {};
  p.name = $("pName").value.trim();
  p.cat  = $("pCat").value;
  p.spec = $("pSpec").value.trim();
  p.unit = $("pUnit").value;
  p.cost = Number($("pCost").value||0);
  p.price= Number($("pPrice").value||0);
  p.qty  = Number($("pQty").value||0);
  p.minQty = Number($("pMin").value||0);
  p.sku = sku;

  if(!p.name){ alert("اكتب اسم المادة"); return; }

  const exists = await getProductBySKU(p.sku);
  if(exists && (!p.id || exists.id !== p.id)){
    alert("هذا الباركود مستخدم لمادة أخرى");
    return;
  }

  await saveProduct(p);
  await addMove({type:"PRODUCT_SAVE", sku:p.sku, note:`حفظ: ${p.name}`});
  await internalSnapshot("product_save");
  pm.close();
  await refreshAll();
};

$("deleteProduct").onclick = async ()=>{
  if(!editingProduct?.id) return;
  if(!confirm("حذف المادة؟")) return;
  await deleteProductById(editingProduct.id);
  await addMove({type:"PRODUCT_DELETE", sku:editingProduct.sku, note:`حذف: ${editingProduct.name}`});
  await internalSnapshot("product_delete");
  pm.close();
  await refreshAll();
};

// ===== Labels =====
async function refreshLabelPick(){
  const q = $("labelSearch").value || "";
  const list = await listProducts(q);
  const box = $("labelPickList");
  box.innerHTML = "";
  list.slice(0,80).forEach(p=>{
    const checked = labelSelected.has(p.sku);
    const el = document.createElement("div");
    el.className="item";
    el.innerHTML = `
      <div class="meta">
        <b>${escapeHtml(p.name||"")}</b>
        <div class="badge">${escapeHtml(p.sku)}</div>
      </div>
      <div class="row" style="gap:6px">
        <span class="badge">${checked?"مُحدد":"غير محدد"}</span>
        <button class="btn ghost">${checked?"إزالة":"إضافة"}</button>
      </div>
    `;
    el.querySelector("button").onclick = ()=>{
      if(labelSelected.has(p.sku)) labelSelected.delete(p.sku);
      else labelSelected.set(p.sku, p);
      refreshLabelPick();
    };
    box.appendChild(el);
  });
}
$("labelSearch").addEventListener("input", refreshLabelPick);

$("printSheet").onclick = ()=>{
  const items = [...labelSelected.values()];
  if(!items.length){ alert("اختر منتجات أولاً"); return; }

  const sizeCm = Number($("qrSizeCm").value||1.5);
  const copies = Math.max(1, Number($("copiesEach").value || 10));
  const cmToPx = (cm)=> Math.round(cm * 37.7952755906);
  const qrPx = cmToPx(sizeCm);
  const cellPx = qrPx + 14;
  const base = location.origin + location.pathname;

  let blocks = "";
  for(const p of items){
    for(let i=0;i<copies;i++){
      const deep = base + "?sku=" + encodeURIComponent(p.sku);
      const qrUrl =
        "https://api.qrserver.com/v1/create-qr-code/?size=" +
        qrPx + "x" + qrPx +
        "&ecc=M&data=" + encodeURIComponent(deep);
      blocks += '<div class="cell"><img src="' + qrUrl + '" alt="QR"></div>';
    }
  }

  const html =
    '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>ملصقات QR</title>' +
    '<style>@page{size:A4;margin:8mm;}body{font-family:Arial;margin:0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(' +
      cellPx + 'px,1fr));gap:6px}.cell{width:' + cellPx + 'px;border:1px dashed #ccc;padding:6px;text-align:center}img{width:' +
      qrPx + 'px;height:' + qrPx + 'px;image-rendering:pixelated}</style>' +
    '</head><body><div class="grid">' + blocks + '</div>' +
    '<script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script>' +
    '</body></html>';

  const w = window.open("", "_blank");
  w.document.open(); w.document.write(html); w.document.close();
};

// ===== Cart =====
function renderCart(){
  const box = $("cartList");
  box.innerHTML = "";

  if(!cart.length){
    box.innerHTML = `<div class="item"><div class="meta"><b>السلة فارغة</b><div class="badge">أضف مواد من البحث بالأعلى</div></div></div>`;
    return;
  }

  cart.forEach((it, idx)=>{
    const el = document.createElement("div");
    el.className="item";
    el.innerHTML = `
      <div class="meta" style="min-width:55%">
        <b>${escapeHtml(it.name)}</b>
        <div class="badge">سعر: ${money(it.price)} • مجموع: ${money(it.price*it.qty)}</div>
      </div>
      <div class="row" style="gap:8px;justify-content:flex-end;">
        <button class="btn ghost" data-a="m" style="min-width:44px;">−</button>
        <span class="badge" style="min-width:90px;text-align:center;">الكمية: <b>${money(it.qty)}</b></span>
        <button class="btn ghost" data-a="p" style="min-width:44px;">+</button>
        <button class="btn danger" data-a="d">حذف</button>
      </div>
    `;

    el.querySelectorAll("button").forEach(b=>{
      b.onclick=()=>{
        const a=b.dataset.a;
        if(a==="p") it.qty++;
        if(a==="m") it.qty=Math.max(1, it.qty-1);
        if(a==="d") cart.splice(idx,1);
        renderCart(); calcTotals();
      };
    });
    box.appendChild(el);
  });
}

function calcTotals(){
  const discount = Number($("discount").value||0);
  let total=0, profit=0;
  cart.forEach(it=>{
    total += it.price*it.qty;
    profit += (it.price-it.cost)*it.qty;
  });
  total = Math.max(0, total-discount);
  $("total").textContent = money(total);
  $("profit").textContent= money(profit);
}
$("discount").addEventListener("input", calcTotals);

async function addProductToCartBySKU(sku, qty=1){
  const p = await getProductBySKU(sku);
  if(!p){ alert("باركود غير موجود"); return; }
  const ex = cart.find(x=>x.sku===p.sku);
  if(ex) ex.qty += qty;
  else cart.push({sku:p.sku, name:p.name, price:Number(p.price||0), cost:Number(p.cost||0), qty});
  renderCart(); calcTotals();
}

// ===== Sale suggestions =====
let suggestTimer = null;

async function refreshSaleSuggest(){
  const q = $("saleQuery").value.trim();
  const box = $("saleSuggest");
  box.innerHTML = "";
  if(!q) return;

  const skuTry = parseBarcodeToSKU(q);
  const pTry = await getProductBySKU(skuTry);
  if(pTry){
    const el = document.createElement("div");
    el.className="item";
    el.innerHTML = `
      <div class="meta">
        <b>${escapeHtml(pTry.name)}</b>
        <div class="badge">باركود: ${escapeHtml(pTry.sku)} • بيع:${money(pTry.price)} • متوفر:${money(pTry.qty||0)}</div>
      </div>
      <button class="btn">إضافة</button>
    `;
    el.querySelector("button").onclick = async ()=>{
      await addProductToCartBySKU(pTry.sku, 1);
      $("saleQuery").value=""; box.innerHTML="";
    };
    box.appendChild(el);
    return;
  }

  const list = await listProducts(q);
  list.slice(0,8).forEach(p=>{
    const el = document.createElement("div");
    el.className="item";
    el.innerHTML = `
      <div class="meta">
        <b>${escapeHtml(p.name)}</b>
        <div class="badge">${escapeHtml(p.sku)} • بيع:${money(p.price)} • متوفر:${money(p.qty||0)}</div>
      </div>
      <button class="btn">إضافة</button>
    `;
    el.querySelector("button").onclick = async ()=>{
      await addProductToCartBySKU(p.sku, 1);
      $("saleQuery").value=""; box.innerHTML="";
    };
    box.appendChild(el);
  });
}
$("saleQuery").addEventListener("input", ()=>{
  clearTimeout(suggestTimer);
  suggestTimer = setTimeout(refreshSaleSuggest, 120);
});

$("saleAddBtn").onclick = async ()=>{
  const q = $("saleQuery").value.trim();
  if(!q) return;
  const sku = parseBarcodeToSKU(q);
  const p = await getProductBySKU(sku);
  if(p){
    await addProductToCartBySKU(p.sku, 1);
    $("saleQuery").value=""; $("saleSuggest").innerHTML="";
    return;
  }
  const list = await listProducts(q);
  if(list.length){
    await addProductToCartBySKU(list[0].sku, 1);
    $("saleQuery").value=""; $("saleSuggest").innerHTML="";
  } else alert("لم يتم العثور على مادة");
};

$("clearCart").onclick = ()=>{
  if(!cart.length) return;
  if(!confirm("تفريغ السلة؟")) return;
  cart=[]; renderCart(); calcTotals();
};

// ===== Deep link action + qty =====
const actionModal = $("actionModal");
$("actionClose").onclick = ()=> actionModal.close();
const qtyModal = $("qtyModal");
$("qtyClose").onclick = ()=> qtyModal.close();

let deepSkuPending=null, qtyAction="sale", pendingProduct=null;

async function openActionPickerForSKU(sku){
  const p = await getProductBySKU(sku);
  if(!p){ alert("باركود غير موجود: "+sku); return; }
  deepSkuPending = p.sku;
  $("actionName").textContent = p.name || "—";
  $("actionSku").textContent  = p.sku  || "—";

  // ✅ أضف الكمية الحالية داخل نفس الصندوق
const box = document.getElementById("actionSku")?.closest(".card");
if (box && !document.getElementById("actionQtyLine")) {
  const d = document.createElement("div");
  d.id = "actionQtyLine";
  d.className = "badge";
  d.style.marginTop = "8px";
  d.innerHTML = `الكمية الحالية: <b>${money(p.qty ?? 0)}</b> ${escapeHtml(unitName(p.unit))}`;
  box.appendChild(d);
} else if (document.getElementById("actionQtyLine")) {
  document.getElementById("actionQtyLine").innerHTML =
    `الكمية الحالية: <b>${money(p.qty ?? 0)}</b> ${escapeHtml(unitName(p.unit))}`;
}
  
  actionModal.showModal();
}

async function openQtyForSKU(sku, action){
  qtyAction = action;
  const p = await getProductBySKU(sku);
  if(!p){ alert("باركود غير موجود"); return; }
  pendingProduct = p;
  $("qtyName").textContent = p.name||"—";
  $("qtySku").textContent = p.sku||"—";
  $("qtyCurrent").textContent = (p.qty ?? 0);
  $("qtyInput").value = "1";
  $("qtyHint").textContent =
    qtyAction==="sale" ? "سيتم إضافة الكمية إلى السلة (بيع)." :
    qtyAction==="in" ? "سيتم زيادة المخزون بهذه الكمية." :
    "سيتم إنقاص المخزون بهذه الكمية.";
  qtyModal.showModal();
}

$("actionSale").onclick = async ()=>{ actionModal.close(); await openQtyForSKU(deepSkuPending,"sale"); };
$("actionIn").onclick   = async ()=>{ actionModal.close(); await openQtyForSKU(deepSkuPending,"in"); };
$("actionOut").onclick  = async ()=>{ actionModal.close(); await openQtyForSKU(deepSkuPending,"out"); };

$("qtyConfirm").onclick = async ()=>{
  if(!pendingProduct) return;
  const qty = Number($("qtyInput").value||0);
  if(!Number.isFinite(qty) || qty<=0){ alert("أدخل كمية صحيحة"); return; }
  const p = await getProductBySKU(pendingProduct.sku);
  if(!p){ alert("المنتج لم يعد موجوداً"); return; }

  if(qtyAction==="sale"){
    await addProductToCartBySKU(p.sku, qty);
    qtyModal.close();
    showTab("sales");
    return;
  }
  if(qtyAction==="in"){
    p.qty = Number(p.qty||0) + qty;
    await saveProduct(p);
    await addMove({type:"STOCK_IN", sku:p.sku, qty, note:`إدخال: ${p.name}`});
    await internalSnapshot("stock_in");
    qtyModal.close();
    await refreshAll();
    alert("تم إدخال المخزون ✅");
    return;
  }
  if(qtyAction==="out"){
    if(Number(p.qty||0) < qty){ alert(`الكمية غير كافية\nالمتوفر: ${p.qty}`); return; }
    p.qty = Number(p.qty||0) - qty;
    await saveProduct(p);
    await addMove({type:"STOCK_OUT", sku:p.sku, qty, note:`صرف/نقص: ${p.name}`});
    await internalSnapshot("stock_out");
    qtyModal.close();
    await refreshAll();
    alert("تم الصرف ✅");
    return;
  }
};

// ===== Invoice =====
function renderInvoiceHTML_A4({ invoiceNo, customer, residence, ts, items, discount, payTypeLabel, note }) {
  const centerName = "مركز المدار";
  const phones = "07838444634  -  07771149446";
  const address = "النجف الاشرف - خان المخضر - شارع مدرسة فلسطين";

  let subtotal = 0;
  (items||[]).forEach(it => subtotal += (it.price * it.qty));
  const grand = Math.max(0, subtotal - (discount || 0));
  const dateStr = nowStr(ts);

  let rows = "";
  (items||[]).forEach((it, i) => {
    const lineTotal = it.price * it.qty;
    rows += `
      <tr>
        <td class="c">${i + 1}</td>
        <td class="name">${escapeHtml(it.name)}</td>
        <td class="c">${money(it.qty)}</td>
        <td class="c">${money(it.price)}</td>
        <td class="c">${money(lineTotal)}</td>
      </tr>
    `;
  });

  return `
  <div class="inv">
    <style>
      @page { size: A4; margin: 12mm; }
      body { margin:0; background:#fff; color:#111; }
      .inv { font-family: Arial, Tahoma; font-size: 12pt; line-height: 1.5; }
      .top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 10mm; }
      .brand { text-align:left; direction:ltr; font-weight:700; font-size: 16pt; }
      .meta { text-align:right; }
      .meta .row { margin: 3mm 0; font-size: 12pt; }
      .meta b { font-weight:700; }
      .small { font-size: 11pt; color:#333; }

      table { width:100%; border-collapse:collapse; margin-top: 6mm; font-size: 11pt; }
      th, td { border: 1px solid #222; padding: 6px; vertical-align: top; }
      th { background: #f3f4f6; font-weight:700; text-align:center; }
      td.c { text-align:center; white-space:nowrap; }
      td.name { text-align:right; }

      .totals { margin-top: 6mm; display:flex; justify-content:flex-end; }
      .totals table { width: 75mm; font-size: 11pt; }
      .totals td { padding: 6px; }
      .totals .lbl { text-align:right; }
      .totals .val { text-align:center; white-space:nowrap; }

      .note { margin-top: 5mm; font-size: 11pt; text-align:right; }
      .footer { position: fixed; bottom: 10mm; left: 12mm; right: 12mm; text-align:center; font-size: 10.5pt; }
      .footer .addr { margin-top: 2mm; }

      @media print { .no-print { display:none !important; } }
    </style>

    <div style="padding:12mm;">
      <div class="top">
        <div class="brand">${centerName}</div>
        <div class="meta">
          <div class="row">رقم الفاتورة: <b>${invoiceNo || "—"}</b></div>
          <div class="row">اسم الزبون: <b>${escapeHtml(customer || "—")}</b></div>
          <div class="row">محل السكن: <b>${escapeHtml(residence || "—")}</b></div>
          <div class="row">التاريخ: <b>${escapeHtml(dateStr)}</b></div>
          <div class="row small">طريقة الدفع: <b>${escapeHtml(payTypeLabel || "—")}</b></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:10mm">#</th>
            <th>المادة</th>
            <th style="width:18mm">الكمية</th>
            <th style="width:24mm">السعر</th>
            <th style="width:28mm">المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td class="c" colspan="5">لا توجد مواد</td></tr>`}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr><td class="lbl">الإجمالي</td><td class="val">${money(subtotal)}</td></tr>
          <tr><td class="lbl">الخصم</td><td class="val">${money(discount || 0)}</td></tr>
          <tr><td class="lbl"><b>الصافي</b></td><td class="val"><b>${money(grand)}</b></td></tr>
        </table>
      </div>

      ${note ? `<div class="note">ملاحظة: <b>${escapeHtml(note)}</b></div>` : ""}

      <div class="footer">
        <div>${phones}</div>
        <div class="addr">${address}</div>
      </div>

      <div class="no-print" style="margin-top:10mm; text-align:center;">
        <button id="btnPrintNow" style="padding:10px 14px;border:1px solid #ccc;border-radius:10px;background:#fff;cursor:pointer;">طباعة</button>
        <button id="btnSharePdf" style="padding:10px 14px;border:1px solid #ccc;border-radius:10px;background:#fff;cursor:pointer;margin-inline-start:8px;">مشاركة PDF</button>
        <button id="btnBackNow" style="padding:10px 14px;border:1px solid #ccc;border-radius:10px;background:#fff;cursor:pointer;margin-inline-start:8px;">رجوع</button>
        <div style="margin-top:6px;font-size:11px;color:#444;">
          في iPhone: من شاشة الطباعة اختر Share / Save to Files لحفظ PDF.
        </div>
      </div>
    </div>
  </div>
  `;
}

function showInvoiceScreen(sale){
  const appHTML = document.body.innerHTML;
  const html = renderInvoiceHTML_A4(sale);
  document.body.innerHTML = html;
  document.getElementById("btnPrintNow").onclick = ()=> window.print();
  document.getElementById("btnSharePdf").onclick = ()=> window.print();
  document.getElementById("btnBackNow").onclick = ()=>{ document.body.innerHTML = appHTML; location.reload(); };
}

// ===== Checkout =====
$("checkout").onclick = async ()=>{
  if(!cart.length){ alert("السلة فارغة"); return; }

  for(const it of cart){
    const p = await getProductBySKU(it.sku);
    if(!p){ alert("مادة غير موجودة"); return; }
    if(Number(p.qty||0) < it.qty){
      alert(`الكمية غير كافية لـ ${p.name}\nالمتوفر: ${p.qty}`);
      return;
    }
  }

  const discount = Number($("discount").value||0);
  const payType  = $("payType").value;
  const payTypeLabel = (payType==="cash"?"نقدي":payType==="credit"?"أجل":"تحويل");
  const customer = ($("customerName").value || "").trim();
  const residence = ($("customerResidence").value || "").trim();
  const note = ($("invoiceNote").value || "").trim();
  const ts = Date.now();
  const invoiceNo = await nextInvoiceNo();

  for(const it of cart){
    const p = await getProductBySKU(it.sku);
    p.qty = Number(p.qty||0) - it.qty;
    await saveProduct(p);
    await addMove({type:"SALE_OUT", sku:it.sku, qty:it.qty, note:`بيع: ${it.name}`});
  }

  const sale = {
    invoiceNo, ts, customer, residence,
    payTypeLabel, discount, note,
    items: cart.map(x=>({ sku:x.sku, name:x.name, price:x.price, cost:x.cost, qty:x.qty }))
  };

  await addSale(sale);
  await addMove({type:"SALE_DONE", note:`إتمام بيع (فاتورة ${invoiceNo})`});
  await internalSnapshot("sale_done");

  cart=[]; renderCart();
  $("discount").value="0"; $("invoiceNote").value=""; $("saleQuery").value="";
  calcTotals(); await refreshAll();
  showInvoiceScreen(sale);
};

// ===== Invoices tab =====
async function refreshInvoices(){
  const box = $("invoiceList");
  const q = ($("invBillSearch").value||"").trim().toLowerCase();
  const sales = await listSales(100);
  box.innerHTML = "";
  sales.filter(s=>{
    const inv = String(s.invoiceNo||"").toLowerCase();
    const name = String(s.customer||"").toLowerCase();
    return !q || inv.includes(q) || name.includes(q);
  }).forEach(sale=>{
    const el = document.createElement("div");
    el.className="item";
    el.innerHTML = `
      <div class="meta">
        <b>فاتورة رقم: ${sale.invoiceNo||"—"}</b>
        <div class="badge">${escapeHtml(nowStr(sale.ts))} • ${escapeHtml(sale.customer||"—")}</div>
      </div>
      <button class="btn">طباعة</button>
    `;
    el.querySelector("button").onclick = ()=> showInvoiceScreen(sale);
    box.appendChild(el);
  });
}
$("invBillSearch").addEventListener("input", refreshInvoices);

// ===== Backup / Restore =====
$("btnExport").onclick = ()=> downloadBackupFile();
$("restoreFile").addEventListener("change", async (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  try{
    const data = JSON.parse(await file.text());
    if(!confirm("سيتم استبدال البيانات الحالية بالكامل. متابعة؟")) return;
    await restoreFromData(data);
    await refreshAll();
    alert("تم الاسترجاع ✅");
  }catch(err){
    alert("فشل الاسترجاع: " + (err?.message || "خطأ"));
  }finally{ e.target.value=""; }
});

// ===== Settings =====
async function loadSettings(){
  $("keepBackups").value = await getSetting("keepBackups",200);
  $("autoSnapshot").value= await getSetting("autoSnapshot","on");
  refreshPinState();
}
$("saveSettings").onclick = async ()=>{
  await setSetting("keepBackups", Math.max(10, Number($("keepBackups").value||200)));
  await setSetting("autoSnapshot", $("autoSnapshot").value);
  await internalSnapshot("settings_save");
  alert("تم الحفظ ✅");
};
$("seedDemo").onclick = async ()=>{
  const demo = [
    {name:"molicell li-ion 18650 2600mAh",cat:"CEL",spec:"MOL18650",unit:"pcs",cost:2500,price:3500,qty:100,minQty:20},
    {name:"Lead Acid Battery 12V 16Ah",cat:"LAB",spec:"12-16",unit:"pcs",cost:20000,price:28000,qty:5,minQty:1}
  ];
  for(const d of demo){
    const sku = await generateSKU(d.cat, d.spec);
    await saveProduct({...d, sku});
    await addMove({type:"SEED", sku, note:`إضافة: ${d.name}`});
  }
  await internalSnapshot("seed_demo");
  await refreshAll();
  alert("تمت إضافة بيانات تجريبية ✅");
};

// PIN settings UI
function refreshPinState(){
  const has = !!getPin();
  const open = isUnlocked();
  $("pinState").textContent = "الحالة: " + (has ? (open ? "مفعل (مفتوح)" : "مفعل (مقفول)") : "غير مفعل");
}
$("btnSavePin").onclick = ()=>{
  const p1 = ($("pinNew1").value||"").trim();
  const p2 = ($("pinNew2").value||"").trim();
  if(p1.length < 4){ alert("PIN لازم 4 أرقام أو أكثر"); return; }
  if(!/^\d+$/.test(p1)){ alert("PIN أرقام فقط."); return; }
  if(p1 !== p2){ alert("PIN غير متطابق"); return; }
  setPin(p1);
  alert("تم حفظ PIN ✅");
  refreshPinState();
};
$("btnLockNow").onclick = ()=>{
  lockNow();
  alert("تم القفل ✅");
  refreshPinState();
};

// ===== Init =====
async function refreshAll(){
  await loadSettings();
  await refreshInventory();
  await refreshMoves();
  await refreshLabelPick();
  await refreshInvoices();
  renderCart(); calcTotals();
}

window.addEventListener("load", async ()=>{
  await refreshAll();

  // ✅ فتح نافذة الخيارات الثلاث عند وجود SKU (حتى بعد PIN)
  try{
    const u = new URL(location.href);
    const urlSku = (u.searchParams.get("sku")||"").trim().toUpperCase();
    const pendingSku = (sessionStorage.getItem(PENDING_SKU_KEY)||"").trim().toUpperCase();
    const sku = urlSku || pendingSku;

    if(sku){
      if(urlSku){
        u.searchParams.delete("sku");
        history.replaceState({}, "", u.toString());
      }
      sessionStorage.removeItem(PENDING_SKU_KEY);

      setTimeout(()=> openActionPickerForSKU(sku), 250);
    }
  }catch(e){}
});
