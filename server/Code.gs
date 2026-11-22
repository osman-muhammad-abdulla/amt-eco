/****************************************************************
 *  AMT — هاوکاتکردنی لاپتۆپ و مۆبایل (Google Apps Script)
 *  هەر مامۆستایەک کۆپییەکی جیای ئەم سکریپتە لەسەر هەژماری Googleـی خۆی دادەنێت.
 *
 *  تەنها ئەم دوو دێڕە بگۆڕە:
 *   SECRET       = وشەی نهێنی (لانیکەم ١٢ پیت/ژمارەی ئینگلیزی، بێ بۆشایی)
 *   PACKS_FOLDER = IDـی فۆڵدەری «پاکێجی وانەکان» لە Drive (لە لینکی فۆڵدەرەکە وەریبگرە)
 ****************************************************************/
const SECRET = "CHANGE-ME-amt-2027";
const PACKS_FOLDER = "PUT-FOLDER-ID-HERE";

/* ---- لێرە بەدواوە هیچ مەگۆڕە ---- */
const FOLDER_NAME = "AMT-sync";

function doGet(e)  { return run_((e && e.parameter) || {}); }
function doPost(e) { let p = {}; try { p = JSON.parse(e.postData.contents); } catch (x) {} return run_(p); }
function out_(o)   { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function run_(p) {
  if (!p || p.key !== SECRET || SECRET === "CHANGE-ME-amt-2027") return out_({ ok:false, err:"key" });
  try {
    switch (p.op) {
      case "ping": return out_({ ok:true, t:Date.now() });
      case "poll": return out_({ ok:true, vers:vers_(), live:liveGet_() });
      case "get":  { const V = vers_(); return out_({ ok:true, data:(p.names || []).map(n => ({ name:n, ver:V[n] || 0, data:read_(n) })) }); }
      case "put": {
        const lock = LockService.getScriptLock(); lock.waitLock(25000);
        try {
          const V = vers_();
          const res = (p.items || []).map(it => {
            const cur = V[it.name] || 0;
            if (cur !== (it.base || 0)) return { name:it.name, conflict:true, ver:cur, data:read_(it.name) };
            write_(it.name, it.data); V[it.name] = cur + 1; return { name:it.name, ver:cur + 1 };
          });
          saveVers_(V);
          return out_({ ok:true, res:res });
        } finally { lock.releaseLock(); }
      }
      case "live": {
        const lock = LockService.getScriptLock(); lock.waitLock(10000);
        try {
          const cur = liveGet_(); Object.assign(cur, p.live || {}); cur.t = Date.now();
          CacheService.getScriptCache().put("live", JSON.stringify(cur), 21600);
          return out_({ ok:true, live:cur });
        } finally { lock.releaseLock(); }
      }
      case "packs": {   /* لیستی پاکێجەکان: هەر بابەتێک، بۆ نموونە econ10-t2-05.json */
        const out = [];
        const walk = f => { const it = f.getFiles();
          while (it.hasNext()) { const x = it.next(), n = x.getName();
            if (/^[a-z]+\d+-t[12]-\d+\.json$/.test(n)) out.push({ name:n, id:x.getId(), mod:x.getLastUpdated().getTime(), size:x.getSize() }); }
          const sub = f.getFolders(); while (sub.hasNext()) { const s = sub.next(); if (!/^(old|کۆن)/i.test(s.getName())) walk(s); } };
        walk(DriveApp.getFolderById(PACKS_FOLDER));
        return out_({ ok:true, packs:out });
      }
      case "pack":
        return out_({ ok:true, data:(p.ids || []).map(id => { try { return { id:id, data:DriveApp.getFileById(id).getBlob().getDataAsString("UTF-8") }; } catch (e) { return { id:id, data:null }; } }) });
    }
    return out_({ ok:false, err:"op" });
  } catch (err) { return out_({ ok:false, err:String(err) }); }
}

/* ---- وەشانەکان (ScriptProperties + Cache) ---- */
function vers_() {
  const c = CacheService.getScriptCache().get("vers"); if (c) return JSON.parse(c);
  const v = JSON.parse(PropertiesService.getScriptProperties().getProperty("vers") || "{}");
  CacheService.getScriptCache().put("vers", JSON.stringify(v), 21600); return v;
}
function saveVers_(v) { const s = JSON.stringify(v); PropertiesService.getScriptProperties().setProperty("vers", s); CacheService.getScriptCache().put("vers", s, 21600); }
function liveGet_() { const c = CacheService.getScriptCache().get("live"); return c ? JSON.parse(c) : {}; }

/* ---- هەر پارچەیەک (chunk) فایلێکی JSONـە لە فۆڵدەری AMT-sync ---- */
function folder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("folderId");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  const f = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
  props.setProperty("folderId", f.getId()); return f;
}
function fileOf_(name) {
  const props = PropertiesService.getScriptProperties(); const key = "f:" + name;
  const id = props.getProperty(key);
  if (id) { try { const f = DriveApp.getFileById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  const it = folder_().getFilesByName(name + ".json");
  if (it.hasNext()) { const f = it.next(); props.setProperty(key, f.getId()); return f; }
  return null;
}
function read_(name) { const f = fileOf_(name); return f ? f.getBlob().getDataAsString("UTF-8") : null; }
function write_(name, data) {
  const f = fileOf_(name);
  if (f) { f.setContent(data); return; }
  const nf = folder_().createFile(name + ".json", data, "application/json");
  PropertiesService.getScriptProperties().setProperty("f:" + name, nf.getId());
}

/* یەکەم جار لە ناو Apps Script ئەمە Run بکە بۆ وەرگرتنی ڕێگەپێدان */
function setup() { folder_(); DriveApp.getFolderById(PACKS_FOLDER).getName(); Logger.log("✓ ئامادەیە: " + folder_().getUrl()); }
