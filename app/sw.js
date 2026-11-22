/* AMT service worker — کارکردن بێ ئینتەرنێت بۆ هەر سێ پۆل.
   CORE: ئەپ و پلان (هەمیشە یەکەم جار لە ئینتەرنێتەوە، ئەگەر نەبوو لە بیرگەوە).
   ASSETS: وێنەکان، پاکێجی وانەکان، فۆنت و کتێبخانەکان (یەکەم جار لە بیرگەوە) — بە گۆڕینی ژمارەی C نەسڕێنەوە.
   پاش هەر گۆڕانکارییەک لە کۆددا ژمارەی C زیاد بکە. */
const C="amt-econ-v5";
const A="amt-econ-assets";
const CORE=["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./data/plans.json","./data/packs/index.json","./data/assets.json"];
const CDN=["https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Vazirmatn:wght@400;500;600;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js",
  "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js",
  "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"];
const CDN_HOSTS=["fonts.googleapis.com","fonts.gstatic.com","cdn.jsdelivr.net","cdnjs.cloudflare.com"];
async function fill(){
  const c=await caches.open(C);
  await Promise.all(CORE.map(u=>fetch(u,{cache:"reload"}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})));
  const a=await caches.open(A);
  const have=async u=>!!(await a.match(u));
  const put=async(u,opt)=>{ if(await have(u)) return; try{ const r=await fetch(u,opt); if(r.ok||r.type==="opaque") await a.put(u,r); }catch(e){} };
  try{ const ix=await (await c.match("./data/packs/index.json")).json();
    for(const f of ix.files||[]){ await put("./data/packs/"+f+"?v="+encodeURIComponent(ix.v)); } }catch(e){}
  try{ const L=(await (await c.match("./data/assets.json")).json()).images||[];
    for(let i=0;i<L.length;i+=6) await Promise.all(L.slice(i,i+6).map(u=>put("./"+u))); }catch(e){}
  for(const u of CDN) await put(u,{mode:u.includes("fonts.googleapis")?"cors":"no-cors"});
  try{ const css=await (await a.match(CDN[0])).clone().text(); const fonts=[...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m=>m[1]);
    for(const u of fonts) await put(u,{mode:"cors"}); }catch(e){}
}
self.addEventListener("install",e=>{ e.waitUntil(fill()); self.skipWaiting(); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k!==A).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("message",e=>{ if(e.data==="fill") e.waitUntil(fill()); });
function netFirst(r){
  return fetch(r).then(res=>{ if(res.ok){ const cp=res.clone(); caches.open(C).then(c=>c.put(r,cp)); } return res; })
    .catch(()=>caches.match(r,{ignoreSearch:/plans\.json|index\.json|assets\.json/.test(r.url)}).then(m=>m||(r.mode==="navigate"?caches.match("./index.html"):Response.error())));
}
function cacheFirst(r,cleanPath){
  return caches.open(A).then(a=>a.match(r).then(m=>m||fetch(r).then(res=>{ if(res.ok||res.type==="opaque"){ const cp=res.clone();
      if(cleanPath) a.keys().then(ks=>ks.forEach(k=>{ const u=new URL(k.url); if(u.pathname===cleanPath&&k.url!==r.url) a.delete(k); }));
      a.put(r,cp); } return res; })));
}
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET") return;
  const u=new URL(r.url);
  if(u.origin!==location.origin){ if(CDN_HOSTS.includes(u.hostname)) e.respondWith(cacheFirst(r)); return; }
  if(/\.pdf$/i.test(u.pathname)) return;
  if(/\/img\//.test(u.pathname)) return e.respondWith(cacheFirst(r));
  if(/\/data\/packs\/econ\d+\.json$/.test(u.pathname)) return e.respondWith(cacheFirst(r,u.pathname));
  e.respondWith(netFirst(r));
});
