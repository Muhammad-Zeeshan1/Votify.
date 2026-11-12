# Votify Grand Operation — GitHub Pages Package

Poora PWA package: `index.html` + `manifest.webmanifest` + `sw.js` + saare icons/logos.
Ye ZIP direct GitHub Pages par live publish ke liye ready hai — file list exactly
repo-root layout ke hisaab se hai.

## Files

| File | Kya hai |
| --- | --- |
| `index.html` | Poora app (sab kuch inline — saare Settings Hub fixes included) |
| `manifest.webmanifest` | PWA manifest — install / add-to-homescreen |
| `sw.js` | Service worker — offline support + instant updates (HTML network-first) |
| `favicon.svg` | Vector favicon |
| `favicon-32.png` | Browser tab icon |
| `apple-touch-icon.png` | iOS homescreen icon (180px, opaque) |
| `icon-192.png` / `icon-512.png` | Android/PWA icons |
| `maskable-512.png` | Android adaptive (maskable) icon |
| `.nojekyll` | GitHub Pages Jekyll processing off |
| `LICENSE` | MIT license |
| `README.md` | Ye file |

## GitHub par live publish — 4 steps

1. GitHub.com par **New repository** banao.
2. ZIP ke andar ki **saari files** repo root par upload karo
   (**Add file ▸ Upload files** — drag & drop; ya `git add . && git commit -m "votify" && git push`).
3. Repo **Settings ▸ Pages** → Source: **Deploy from a branch** → Branch: **main**, Folder: **/(root)** → Save.
4. 1–2 minute me live: `https://APNA-USERNAME.github.io/REPO-KA-NAAM/`

## Settings Hub — ab poora workable (demo nahi)

Har control asli app behavior chalata hai, sirf dikhawa nahi:

- **Accent color / Rich background / UI scale / Text size / Compact / Sharp / Reduce motion / Disable glow** — live CSS, poora app turant badalta hai
- **Sidebar & Nav** — animated sidebar, keep-open, width, floating bar — sab live
- **Sounds** — mute live + persist; **Reset notification badge** — top bar ka badge TURANT chhup jata hai (pehle sirf storage key likhta tha)
- **World Chatter** — bubble color AB DONO chat systems me lagta hai aur **reload ke baad bhi yaad rehta hai** (payload ka boot-time wipe patch kar diya gaya hai); bubble shape file chat me live patch hota hai
- **Privacy & Data** — Export/Clear/Signout asli kaam; Session aur Storage rows ab real data dikhati hain (pehle hamesha "checking…" atka rehta tha)
- **Performance** — Starfield/Nebula off ab waqai animation loop rok deta hai (battery bachti hai), sirf chhupana nahi

## Update deploy karne par

- HTML **network-first** hai — naya deploy har device par turant dikhega.
- Sirf icons/manifest badle to `sw.js` me `CACHE_VERSION` badhao (`votify-v1.1.1`, `votify-v1.1.2` …).
- Purana version dikhe to hard refresh: Ctrl+Shift+R.

## Notes

- App single-file hai — koi build step nahi; GitHub Pages par seedha chalta hai.
- QR/zip/scan jaise features CDN (jsdelivr) se aate hain; sw.js offline ke liye cache karta hai.
- Login/data device-local (localStorage) hai.
