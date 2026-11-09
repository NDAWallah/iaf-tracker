# IAF Tracker — work report (9 Nov 2026)

Repo: https://github.com/NDAWallah/iaf-tracker · Base commit: `ee73cd3` · New version: **5.2**

## सारांश (छोटा)

तीनों बताई गई समस्याएँ असली थीं और तीनों ठीक कर दी गई हैं: Rename करने पर Progress सुरक्षित रहती है,
PDF अब JSON Backup में आती हैं और Restore पर वापस आ जाती हैं, और Tests को Done मार्क किया जा सकता है।
पुराना डेटा वैसा ही चलेगा — कोई Feature हटाया नहीं गया। **GitHub पर मेरे पास लिखने की अनुमति नहीं है**
(App read-only है), इसलिए Code आपको Patch और पूरी फाइल के रूप में दिया गया है।

---

## 1. Bugs जो मिले (verify किए गए)

| # | Bug | कहाँ | असर |
|---|-----|------|-----|
| 1 | Rename करने पर Progress/Tests/PDF keys migrate नहीं होतीं | `renameExam()`, `renameSubject()` | Rename के बाद सारी Progress गायब दिखती थी (डेटा localStorage में था, बस orphan हो जाता था) |
| 2 | JSON Backup में PDFs शामिल नहीं | `exportData()` | Restore करने पर PDFs कभी वापस नहीं आतीं; दूसरे फोन पर सब खो जाती हैं |
| 3 | Test Complete करने का कोई तरीका नहीं | Test Library | `done` field मौजूद था पर UI में कभी इस्तेमाल नहीं हुआ |
| 4 | "Refresh app" असल में refresh नहीं करता | `forceUpdate()` | सिर्फ `location.reload()` — cache/Service Worker साफ नहीं होता, पुराना version ही खुलता रहता है |
| 5 | `renderStats()` DOM से value वापस पढ़ता है | `renderStats()` | काम करता है पर नाज़ुक; अब सीधे गिनती होती है |
| 6 | `sw.js` में बेकार Gemini bypass | `sw.js` | Dead code, हटा दिया |
| 7 | Pages का "Page build failed" | Pages settings | Site plain HTML है, फिर भी हर push पर Jekyll build चलता है और fail होता है |

`addNewChapter()` वाली पुरानी समस्या verify की — `const r = name.trim();` मौजूद है, वह ठीक है।

## 2. क्या Fix किया

**Rename safe (Bug 1).** चार नए helpers जोड़े: `migrateExamRename()`, `migrateSubjectRename()`,
`migrateStoreKeys()`, `migratePDFNames()`. दोनों rename functions के अंदर चलते हैं और progress keys,
`tests`/`materials` keys, और IndexedDB में रखी PDFs का `exam`/`subject` — सब नए नाम पर ले जाते हैं।
दूसरे exams को छुआ नहीं जाता।

**PDF backup/restore (Bug 2).** `exportData()` अब `pdfs` array भी लिखता है
(`name, exam, subject, addedAt, type, data` — base64). 25 MB से बड़ा backup बनाने से पहले पूछता है।
`importData()` PDFs को IndexedDB में वापस डालता है, duplicate (same name+exam+subject+time) छोड़ देता है,
और "कितनी आईं / कितनी पहले से थीं / कितनी fail" बताता है। एक PDF पढ़ने में दिक्कत आए तो बाकी backup खराब नहीं होता।

**Test completion (Bug 3).** हर test row में **Mark done / ✓ Done** बटन, ऊपर `done/total` counter,
और पूरे test पर line-through. Delete पहले जैसा ही है।

**बाकी (Bugs 4–7).** `forceUpdate()` अब caches delete करता है और Service Worker unregister करके reload करता है।
`renderStats()` सीधे गिनता है। `sw.js` से dead bypass हटाया। `.nojekyll` जोड़ा ताकि Pages Jekyll build skip करे।
`APP_VERSION` = `5.2`.

## 3. जो नया जोड़ा गया

- Test done/undone toggle + counter.
- Backup में PDFs, restore पर duplicate-safe recovery।
- Rename पर पूरा key migration (progress + tests + materials + PDFs)।
- Backup file में PDF count दिखता है ("Last backup: … · 3 PDF")।

## 4. जाँच के नतीजे (झूठ नहीं — जो चलाया वही लिखा)

- **Syntax:** `node --check` — inline script और `sw.js`, दोनों clean.
- **Runtime (jsdom harness): 19/19 checks pass** —
  rename subject (progress + tests बचे, पुरानी keys हटीं, दूसरा exam अछूता),
  rename exam (हर subject की progress बची), test toggle on/off, counter render,
  backup में appData + PDF, base64 payload byte-for-byte सही,
  restore पर PDF IndexedDB में वापस, bytes सही, exam/subject सही,
  और पुराने format का backup (बिना `pdfs`) भी पहले जैसा restore हुआ।
- **जो नहीं टेस्ट हो सका:** असली browser rendering, iPhone/Android install, और true offline —
  sandbox में browser नहीं है। Merge के बाद फोन पर एक बार ज़रूर देख लें।

## 5. Data safety

- localStorage का format नहीं बदला, `sanitizeData()` वैसा ही है — पुराना डेटा जैसा है वैसा खुलेगा।
- कोई feature हटाया नहीं गया, कोई repo delete/rename/reset नहीं हुआ।
- PWA की caching strategy (network-first HTML, cache-first assets) वैसी ही है।

## 6. कौन सी फाइलें बदलीं

| File | बदलाव |
|------|-------|
| `index.html` | +233 / −14 — migration helpers, PDF backup/restore, test toggle, forceUpdate, renderStats, version 5.2 |
| `sw.js` | −1 — dead Gemini bypass |
| `.nojekyll` | नई खाली फाइल — Pages का Jekyll build बंद करने के लिए |

## 7. GitHub पर लिखने की अनुमति नहीं

`git push` और GitHub API दोनों **403 / "Resource not accessible by integration"** दे रहे हैं —
App को इस repo पर सिर्फ read access है। इसलिए commit बना दिया गया है पर push नहीं हो सका।
आपके पास दो रास्ते हैं:

**आसान — सीधे फाइल बदलें**
1. `index.html` (updated) और `sw.js` (updated) डाउनलोड करके repo में replace करें।
2. Repo root में `.nojekyll` नाम की खाली फाइल बनाएँ।
3. Commit + push.

**या — patch लगाएँ**
```bash
git clone https://github.com/NDAWallah/iaf-tracker.git
cd iaf-tracker
git apply iaf-tracker-fix.patch
touch .nojekyll
git add -A && git commit -m "Fix rename data loss, PDF backup, test completion"
git push
```
