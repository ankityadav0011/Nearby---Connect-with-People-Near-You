# Nearby: swipe, match and chat with people around you

React (Vite) frontend + Express API + MongoDB + Socket.IO.

## What's included
- Sign up / log in with **Google** or **email + password** (phone number optional, 18+ date-of-birth check)
- Profile asks **gender** and **who you want to meet**; the swipe deck only shows people who match both ways
- Profile with **one main photo**, bio, location (only approximate km distance is ever shown to others)
- **Swipe cards** (drag, ✓ / ✕ buttons, or arrow keys) with distance and age filters
- **Match** when two people like each other, then **real-time chat** with typing indicator
- **Block, report, unmatch** and **delete my account**
- **Live "N online" counter** in the top bar (testing version: shows the real number always)
- **"Buy me a coffee"** button that opens a UPI QR code
- `plan` field on users, ready for a future paid subscription

## 1. Run it on your computer
Requirements: Node.js 18+ and a free MongoDB Atlas cluster (atlas.mongodb.com).

```bash
npm run install:all          # installs root, server and client packages

cp server/.env.example server/.env     # then fill it in (see below)
cp client/.env.example client/.env

npm run dev                  # API on :4000, website on http://localhost:5173
```

**server/.env**
- `MONGODB_URI`: Atlas > Connect > Drivers. Also add your IP under Network Access.
- `JWT_SECRET`: any long random string.
- `GOOGLE_CLIENT_ID`: see "Google login" below.

**client/.env**
- `VITE_GOOGLE_CLIENT_ID`: same Google client ID (leave empty to hide the Google button).
- `VITE_UPI_ID` and `VITE_UPI_NAME`: your UPI ID and name; the coffee QR is generated from them. Or set `VITE_QR_IMAGE` to your own QR image placed in `client/public`.

Geolocation only works on `localhost` or HTTPS. To test swiping you need at least 2 accounts, each with a photo and location (use two browsers or one normal and one private window).

## Google login
1. console.cloud.google.com > APIs & Services > OAuth consent screen (needs a Privacy Policy URL before going public).
2. Credentials > Create credentials > OAuth client ID > **Web application**.
3. Authorized JavaScript origins: `http://localhost:5173` and, later, your live website URL.
4. Copy the client ID into both `.env` files.

## 2. Deploy on Render
**API** (New > Web Service): root directory `server`, build `npm install`, start `npm start`.
Env vars: `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `CLIENT_URL` (your website URL, no trailing slash).

**Website** (New > Static Site): root directory `client`, build `npm install && npm run build`, publish directory `dist`.
Env vars: `VITE_API_URL` (your API URL), `VITE_GOOGLE_CLIENT_ID`, `VITE_UPI_ID`, `VITE_UPI_NAME`.
Add a rewrite rule: source `/*`, destination `/index.html`, action Rewrite (needed for page refreshes on /matches etc.).

In Atlas > Network Access allow Render to connect (0.0.0.0/0 is the simplest; use a strong DB password).

## Before real users arrive
- **Photos**: they're saved to `server/uploads`, which Render wipes on every deploy. Switch to Cloudinary or S3 (or add a Render persistent disk) before launch. Only `routes/users.js` upload code needs to change; store the full image URL in `profilePhotoUrl`.
- **Legal**: add Privacy Policy and Terms pages (Google login and ads need them), and a contact for complaints. India's DPDP Act applies to the data you collect.
- **Ads**: read Google Ads policies for dating / personal-connection ads in your country first.
- **Moderation**: reports are saved in the `reports` collection but there's no admin page yet.
- **Use a paid plan** on Render (free services sleep) and MongoDB Atlas (free tier is small).

## Not built yet (good next steps)
Email verification, password reset, phone OTP, selfie verification, photo moderation, admin dashboard, push/email notifications, undo swipe, match expiry, premium plan and payments, unique-user online counter (currently counts open tabs; use Redis if you run several API instances).

## Folder map
```
server/src  index.js  socket.js  utils.js  models/  routes/  middleware/
client/src  App.jsx  api.js  auth.jsx  socket.js  pages/  components/  styles.css
```
