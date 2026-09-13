# Votify — Installable PWA Files

App ko "Install to Home Screen" capable banane ke liye ye files modify ki gayi hain.

## 📁 Files (sab same folder me hone chahiye)

| File | Kaam |
|------|------|
| `votify.html` | Main app (modified — install button + SW registration add kiya) |
| `manifest.json` | PWA config — app name, icons, theme, display mode |
| `service-worker.js` | Offline support + installability ( REQUIRED for PWA install ) |
| `icon-192.png` | App icon (192×192, maskable — Android home screen) |
| `icon-512.png` | App icon (512×512, maskable — Play Store / splash) |
| `apple-touch-icon.png` | iOS home screen icon (180×180) |
| `favicon-32.png` | Browser tab icon (32×32) |

## 🚀 Kaise Deploy Karein (Important!)

PWA install **sirf HTTPS pe** kaam karta hai. Local pe test karna ho ya deploy karna ho:

### Option A — Netlify Drop (Sabse aasan)
1. https://app.netlify.com/drop kholo
2. Saari files (votify.html, manifest.json, service-worker.js, icons) ek folder me rakho
3. Us folder ko drag-and-drop karo
4. 30 second me live HTTPS URL mil jayega → install button kaam karega

### Option B — GitHub Pages
1. Ek naya GitHub repo banao
2. Saari files upload karo (commit + push)
3. Settings → Pages → "Deploy from branch" → main
4. 1-2 min me `https://username.github.io/repo-name/votify.html` pe live

### Option C — Local test (limited)
```bash
cd /home/z/my-project/download
python3 -m http.server 8080
```
Phir Chrome me `http://localhost:8080/votify.html` kholo.
Note: `localhost` pe PWA install kaam karta hai, par `127.0.0.1` ya file:// pe nahi.

## 📱 Kaise Install Hoga (User ke side se)

### Android (Chrome / Edge / Brave)
1. App khulta hi ek banner aayega: **"Install Votify App"** + Install button
2. User "Install" click karega → Android install dialog khulega
3. "Install" confirm karein → app icon home screen par aa jayega
4. App standalone mode me khulega (no browser URL bar)

### iPhone / iPad (Safari)
iOS `beforeinstallprompt` support nahi karta, is liye automatically ek
**3-step instructions modal** khulta hai:
1. Share button (⬆️) par tap karo
2. "Add to Home Screen" select karo
3. "Add" par tap karo → icon home screen par aa jayega

### Desktop (Chrome / Edge)
Browser ke right side address bar me ek install icon (⊕) dikhega,
us par click karein → "Install".

## 🛠️ App ke andar se Install trigger karna

Agar aap profile/settings page me ek "Install App" button add karna chahein,
bas ye code kisi bhi button ke `onclick` me likhein:

```js
// Manual install trigger
if (window.VotifyPWA) window.VotifyPWA.install();
```

Ya check karne ke liye ke app pehle se installed hai ya nahi:
```js
if (window.VotifyPWA && window.VotifyPWA.isInstalled()) {
  // already running as installed app
}
```

## ✨ Features Added

- ✅ **Auto-install banner** (Android/Chrome pe) — user ne dismiss kiya to dobara nahi aayega
- ✅ **iOS instructions modal** — iPhone users ke liye step-by-step guide (ek baar dikhta hai)
- ✅ **Service Worker** — app offline bhi chalega (after first visit)
- ✅ **App icons** — Votify "V" monogram with purple gradient
- ✅ **Maskable icons** — Android adaptive icon support
- ✅ **App shortcuts** — long-press app icon → Home / Create / Chat quick actions
- ✅ **Standalone display** — installed app me browser URL bar nahi dikhega
- ✅ **Theme color** — status bar matches app's dark theme
