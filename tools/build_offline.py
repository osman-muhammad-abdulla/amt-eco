# -*- coding: utf-8 -*-
"""دروستکردنی پاکێجی ناو ئەپ (app/data/packs) و لیستی وێنەکان (app/data/assets.json) بۆ کارکردنی بێ ئینتەرنێت.
بەکارهێنان (لە فۆڵدەری سەرەکی پرۆژەکەدا):  python tools/build_offline.py
پاشان ژمارەی C لە app/sw.js زیاد بکە."""
import json,glob,os,hashlib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP=os.path.join(ROOT,"app"); SRC=os.path.join(ROOT,"پاکێجی وانەکان")
os.makedirs(os.path.join(APP,"data","packs"),exist_ok=True)
files=[]; allh=hashlib.sha1()
for g in ["10","11","12"]:
    m={}
    for f in sorted(glob.glob(os.path.join(SRC,f"econ{g}-t*-*.json"))):   # فۆڵدەری «زیادە-بەندی٥» ناگرێتەوە
        k=os.path.basename(f)[:-5]; P=json.load(open(f,encoding="utf8"))
        if P.get("extra"): continue
        h=hashlib.sha1(json.dumps(P,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:8]
        P["v"]=f"{str(P.get('v',1)).split('-')[0]}-{h}"; m[k]=P
    s=json.dumps(m,ensure_ascii=False,separators=(",",":"))
    open(os.path.join(APP,"data","packs",f"econ{g}.json"),"w",encoding="utf8").write(s); allh.update(s.encode())
    files.append(f"econ{g}.json"); print("پۆلی",g,":",len(m),"پاکێج")
v=allh.hexdigest()[:10]
json.dump({"v":v,"files":files},open(os.path.join(APP,"data","packs","index.json"),"w"),separators=(",",":"))
imgs=[]
for root,_,fs in os.walk(os.path.join(APP,"img")):
    for f in fs: imgs.append(os.path.relpath(os.path.join(root,f),APP).replace("\\","/"))
json.dump({"images":sorted(imgs)},open(os.path.join(APP,"data","assets.json"),"w"),separators=(",",":"))
print("وەشانی پاکێج:",v,"· وێنە:",len(imgs),"· ئێستا ژمارەی C لە app/sw.js زیاد بکە")
