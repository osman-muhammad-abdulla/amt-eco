# AMT Eco. — پێکهاتەی سیستەمەکە (بۆ Claude)

ئەپێکی یەک‌فایلییە (PWA) لەسەر بنەمای HSH. هیچ build ـێکی پێویست نییە.

## فایلەکان
| فایل | چییە |
|---|---|
| `app/index.html` | هەموو ئەپەکە (HTML + CSS + JS)، نزیکەی ٦٧٠KB |
| `app/data/plans.json` | پلانی وەزارەت بۆ پۆلی ١٠، ١١ و ١٢ (هەردوو وەرز). **پلانەکان تەنها لێرە دەگۆڕدرێن.** |
| `app/sw.js` | Service Worker. پاش هەر گۆڕانکارییەک ژمارەی `C` زیاد بکە (`amt-econ-v2` ← `v3`…) |
| `app/manifest.webmanifest`، `app/icons/`، `app/img/methods/` | PWA و وێنەی ١٦ میتۆدەکە |
| `server/Code.gs` | Google Apps Script بۆ هاوکاتکردن و پاکێج |
| `سەرچاوە/` | کتێب، پلانی PDF، لیستی ناو و `AMT-Eco-start.json`. **ناچێتە GitHub.** |

## داتا (ئۆبجێکتی `S`)
- لە وێبگەڕدا لە `localStorage` بە کلیلی `amteco:state:v1` هەڵدەگیرێت.
- `S.subjDefs = [{key:"econ",name:"ئابووری",ic:"💰"}]`
- `S.stages["10"|"11"|"12"]`:
  - `sections`، بۆ نموونە `["A","B","C"]`
  - `classes[بەش]`: لیستی قوتابییان `{id,name,level,attendance:{date:status},events:[]}`
  - `subj[بەش] = "econ"`
  - `sd.econ.lessons.t1|t2[n]`: وانەکان، `sd.econ.bank`: بانقی پرسیار، `sd.econ.book`
- `S.planEcoV`: وەشانی پلانی جێبەجێکراو. ئەگەر `v` لە plans.json زیاد بکەیت، پلانی نوێ دەچێتە ناو وانەکان. ئەو وانانەی مامۆستا دەستکاری کردوون (`userEdited`) دەست لێ نادرێن.
- بەشەکان: `A=أ`، `B=ب`، `C=ج`، `D=د`، `E=هـ`، `F=و`. لە پۆلی ١٢دا `G` = بەشی وێژەیی.

## پلانەکان (`data/plans.json`)
```
{"v":1,"econ":{"10":{"t1":{subject,grade,weeks,months,lessons,ch},"t2":{…}},"11":…,"12":…}}
lesson = {n, w:"J1", ch:4, t:"ناونیشان", p:[لاپەڕەی سەرەتا,کۆتا], m:["concept","open"], g:{method:"چۆنیەتی"}, tp:["بابەت"], hw:""}
```
- لاپەڕەکان ژمارەی **چاپکراوی** کتێبن. لاپەڕەی PDF = چاپکراو + `off`. `off` بۆ پۆلی ١٠ و ١١ = ١، بۆ پۆلی ١٢ = ٢. ئەمانە لە `SUBJECTS.econ.books` دان.
- هەفتەکان: `S1..S2, O1..O4, N1..N4, D1..D3` بۆ وەرزی یەکەم، و `J1..J4, F1..F4, M1..M3, A1..A3` بۆ وەرزی دووەم.

## فەنکشنە سەرەکییەکان (لە index.html بە grep بیاندۆزەوە)
- `loadPlans()`: پلانەکان دەهێنێت (`fetch data/plans.json`، و ئەگەر ئینتەرنێت نەبوو لە بیرگەوە).
- `PLANS[key]`: ئەم Proxyـیە پلانی پۆلی ئێستا دەداتەوە. `planOf(subj,stage,term)` بۆ پۆلێکی دیاریکراوە.
- `applyAllPlans()` و `applyPlanTo(T,P)`: پلان دەخەنە ناو وانەکان.
- `viewPlan()`، `printPlan()`، `printAnnualPlan()` و `printDailyPlans()`: بەشی «پلانی وەرز» و «پلان بۆ ئیدارە».
- `SUBJECTS`، `curBook()` و `BOOKINFO()`: کتێبی هەر پۆلێک.
- `METHODS`: ١٦ میتۆدی وەزارەت. خاسیەتی `hist` نموونەی جێبەجێکردنی میتۆدەکەیە لە ئابووریدا (ناوەکەی وەک خۆی ماوەتەوە).
- `syncNow`، `merge3` و `mergeArr`: هاوکاتکردن (بەشی ☁️). `pkSlideId` و `dedupeSlides`: ID ـی جێگیر بۆ سلاید.
- `loadDrivePacks()` و `applyDrivePacks()`: پاکێجی وانە لە Drive، بە ناوی `econ10-t2-05.json`.

## کارکردن بێ ئینتەرنێت (ئۆفلاین) — زیادکرا ٢١ی ١١ی ٢٠٢٦
- **پاکێجی وانەکان لە ناو ئەپەکەدان:** `app/data/packs/econ10.json`، `econ11.json` و `econ12.json` (هەر فایلێک `{ "econ12-t2-05": pack, … }`). `app/data/packs/index.json` = `{v, files}`.
  - `loadBundledPacks()` لە کاتی کردنەوەدا: ئەگەر `v` گۆڕابێت، پاکێجەکان دەخاتە `DPK.map` و `idbSet("drivePacks")`. پاشان `applyDrivePacks()` دەیانخاتە ناو وانەکان.
  - پاکێجی Drive (`DPK.idx[k].id`) لە پێشترە و پاکێجی ناو ئەپ نایگۆڕێت.
  - `P.v` = «ژمارە-hash»؛ کاتێک ناوەڕۆکی پاکێجێک بگۆڕێت، خۆکار دووبارە دەخرێتەوە ناو وانەکە.
  - دروستکردن: `python tools/build_offline.py` (لە فۆڵدەری «پاکێجی وانەکان» دەیانخوێنێتەوە؛ فۆڵدەری «زیادە-بەندی٥» ناگرێتەوە).
- **بیرگە:** `store.get/set` سەرەتا IndexedDB (`hm-fs`، کلیلی `ls:amteco:state:v1`)، ئەگەر نەبوو localStorage. هۆکار: داتای هەر سێ پۆل لەگەڵ پاکێجەکان نزیکەی ٤.٣ ملیۆن پیتە و لە localStorage جێی نابێتەوە. `navigator.storage.persist()` داوا دەکرێت.
  - گواستنەوەی داتا (`buildTransfer`/`importTransferHSH`) ئەمە دەزانێت: state لە `localStorage[KEY]`ـی فایلەکەدایە، و `ls:*` لە بەشی IndexedDB ناچێتە ناو فایل.
- **sw.js:** دوو cache:
  - `C` (ئەپ و پلان؛ یەکەم جار لە ئینتەرنێتەوە). پاش هەر گۆڕانکارییەک لە کۆددا ژمارەکەی زیاد بکە.
  - `amt-econ-assets` (وێنەکانی `app/data/assets.json`، فایلی پاکێجەکان، فۆنتی Vazirmatn/Amiri و کتێبخانەکانی CDN؛ یەکەم جار لە بیرگەوە). بە گۆڕینی `C` ناسڕێتەوە.
  - لە کاتی install، هەموو شتێک دادەگرێت (~١٦MB). یەکەم جار پێویستە ئینتەرنێت هەبێت.
- **بێ ئینتەرنێت کار ناکەن:** ڤیدیۆی یوتیوب، هاوکاتکردنی Drive، دروستکردنی پرسیار بە AI. ئەوانی تر هەموو کار دەکەن.
- `loadDrivePacks()` و `applyDrivePacks()`: پاکێجی وانە لە Drive، بە ناوی `econ10-t2-05.json`. ئەمانە هێشتا کار دەکەن، بەڵام پێویست نین.
