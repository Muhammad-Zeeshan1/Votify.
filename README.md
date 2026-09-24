# ⚡ VOTIFY GOLDEN — Opinion Arena

**Votify Golden** is the golden edition of your Votify app — now with
**Golden Rooms**: Pakistani-style live chat rooms with owners, moderators,
whispers, radio, voice notes and 1:1 voice/video calls.

## What is inside this package
| File | What it is |
|------|------------|
| `index.html` | The **complete app in one single file** (all CSS + JS inline) |
| `manifest.json` | PWA manifest (name, icons, standalone mode) |
| `service-worker.js` | Offline support + installability |
| `icon-192.png` / `icon-512.png` | App icons (golden) |
| `maskable-512.png` | Android adaptive icon |
| `apple-touch-icon.png` | iPhone home screen icon |
| `favicon-32.png` | Browser tab icon |

> Everything the app needs is inside `index.html` — the other files make it a
> proper installable PWA.

## 🚀 How to put it live on GitHub (free)
1. Create a repository on GitHub (any name, e.g. `votify-golden`)
2. Upload **all files from this folder** to the repository
   (GitHub web: *Add file → Upload files* — drag & drop everything)
3. Go to **Settings → Pages**
4. Under *Source* choose **Deploy from a branch**, branch **main**, folder **/(root)**
5. Click **Save** — after ~1 minute your app is live at:
   `https://YOUR-USERNAME.github.io/votify-golden/`

## 🚀 Other hosts (also free)
- **Netlify Drop**: open app.netlify.com/drop and drag the folder in
- **Vercel**: import the repository → deploy (no build settings needed)
- **Firebase Hosting**: `firebase init hosting` → public folder → `firebase deploy`
- Any simple static host: upload the files as-is

## ✨ Golden Rooms — feature map
- **Your own room**: Home → Golden Rooms → *Create Your Own Room* — you are the 👑 owner
- **PC full screen**: the room chat opens FULL SCREEN on desktop — no floating window, nothing behind it
- **Welcome messages**: a genuine join posts "➕ Name joined the room 🎉 · Welcome Name! ✨" — re-joining within 10 minutes posts NOTHING (no join spam)
- **Owner: Clear Room Chat** 🧹 — one tap deletes every message for ALL members (⋮ menu or Members panel)
- **Owner: ANY custom rank** 🏅 — tap a member → *Custom Rank* → type any title (Sardar, Host, Co-Owner...) — shows next to their name for everyone
- **Owner: Anti-spam flood control** 🛡 — set "N msgs in N min → mute N min" and "N joins in N min → mute N min" in Room Settings; muted users SEE THE REASON on their screen
- **Owner tools**: Kick / Mute (5–60 min picker) / Ban (with reason) / Make Head 🛡 / Make Mod @ / Make VIP ✨ — every confirm box has a **Back button**
- **Ban & unban**: banned members see a banned screen and can send an **unban request** — the owner approves it in the Members panel
- **24/7 auto-moderation**: links are blocked (warning → auto-ban), bad language is blocked (warning → mute → ban)
- **Whisper 🔒**: private 1-to-1 messages — tap a member → Whisper
- **Voice & video calls 📞🎥**: tap a member → Voice/Video Call (WebRTC)
- **Voice notes 🎤**: tap the mic, speak, tap again to send (max 25s)
- **PERSONAL Radio 📻**: 7 categories — **URDU SONGS (16 Pakistani FM channels)** · Pakistan News & Talk · Pop & Hits · Chill & Lofi · Romantic · Quran & Naat (own category, never mixed with songs) · More Vibes = **60+ VERIFIED WORKING channels**
  - **LIVE SIGNAL dot** — every channel is probed FROM YOUR DEVICE: green SIGNAL / red NO SIGNAL
  - **No top bar** — radio lives in the header icon + ⋮ menu ("Radio Sound: ON/OFF")
  - **Only you hear your radio** — nothing is broadcast
- **No blinking** — smart append-only rendering: new messages just appear, the rooms page never flickers
- **No red unread bars** — removed on request; home shows the **REAL online count** (presence-based, live)
- **World Chatter: Clear my screen** 🧹 — eraser button in the chat dock wipes chat ONLY on your own device
- **Mehfil Night 🎶 + Shayari mode 📝**: owner starts the mehfil, everyone posts shayari in golden style
- **City rooms**: Karachi · Lahore · Islamabad · Peshawar · Overseas · World Wide Mehfil
- **Room XP & ranks**: chatting earns room XP (+2 per message, +5 daily bonus) → Newbie · Chatter · Star · **VIP (300 XP)** · Hero · Legend · Royal
- **Max members**: owner sets 2–500 at creation and can change it in the panel — the room refuses joins when full
- **Invite links**: Room menu → *Copy Invite Link* — the link opens **directly into that room chat**
- **Personal wallpaper**: Room menu → *Room Wallpaper* — 8 presets or upload your own image (only you see it)
- **Text styles**: *bold* · _italic_ · colored text chips (blue/red/green/golden) + emoji picker
- **Urdu / Roman Urdu / English**: full support — Urdu script messages render RTL automatically

## Notes
- Login: Firebase config is already embedded — users see your existing data
- Everything real-time: open two devices to see live chat, members and messages
- To re-brand the room list, open Admin Panel → settings (app name, chat name)
