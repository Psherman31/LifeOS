# Getting LifeOS running — step by step

This guide assumes no technical background. Follow it top to bottom; it takes
about 20 minutes. At the end, LifeOS will be running at your own private web
address, and you'll add it to your iPhone home screen like an app.

You need two accounts, both created below:

1. **Anthropic** — provides the AI (Claude). Pay-as-you-go; expect roughly
   $5–15/month for daily personal use.
2. **Railway** — the computer in the cloud that runs your app, about $5/month.

Everything you put into LifeOS is stored in **your** Railway database, locked
behind a passcode only you know. Anthropic processes what you send (to parse
captures and hold conversations) but doesn't train on API data.

---

## Part 1 — Get your Anthropic API key

1. Go to **console.anthropic.com** and sign up (this is separate from a
   claude.ai account, even if you have one).
2. In the left sidebar, open **Billing** and add a payment method. Add a small
   amount of credit (e.g. $10) or set up auto-reload.
3. In the left sidebar, open **API Keys** → **Create Key**. Name it `lifeos`.
4. Copy the key (it starts with `sk-ant-`) somewhere safe — you'll paste it in
   Part 2. It is shown only once.

## Part 2 — Deploy on Railway

1. Go to **railway.com** and sign up **using your GitHub account** (click
   "Login with GitHub"). This lets Railway see your LifeOS code.
2. Click **New Project** → **Deploy from GitHub repo** → choose
   **Psherman31/LifeOS**. If Railway asks to "Configure GitHub App", allow it
   access to the LifeOS repository.
3. Railway creates a "service" and starts building. While it builds, click on
   the service, then open the **Variables** tab and add these four variables
   (click **New Variable** for each):

   | Name | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | the `sk-ant-...` key from Part 1 |
   | `LIFEOS_PASSCODE` | a passcode you'll type to open the app — pick something only you know |
   | `DATABASE_URL` | `file:/data/lifeos.db` (exactly as written) |
   | `LIFEOS_TIMEZONE` | `America/New_York` (or your timezone) |

4. **Attach storage** (so your data survives restarts): right-click the
   service (or use the service's ⋮ menu) → **Attach Volume**. Set the
   **mount path** to `/data`. This is important — without it, your data would
   be wiped on every update.
5. **Set the start command**: open the service's **Settings** tab, find
   **Deploy → Custom Start Command**, and set it to:

   ```
   npm run railway:start
   ```

6. **Get your web address**: in **Settings → Networking**, click
   **Generate Domain**. You'll get an address like
   `lifeos-production-xxxx.up.railway.app`.
7. If the service isn't already redeploying, click **Deploy** (or
   **Redeploy**). Wait for the build to finish (a few minutes).

## Part 3 — Put it on your phone

1. Open your new address in **Safari** on your iPhone.
2. Enter your passcode.
3. Tap the **Share** button → **Add to Home Screen** → name it **LifeOS**.

It now opens full-screen like a native app. The keyboard's microphone button
gives you voice capture for free.

## Part 4 — First five minutes

1. On the Today screen, dump whatever's on your mind into the capture box —
   several things at once is fine. The system sorts it.
2. Tap **Morning review**. Glance at your calendar when it asks, look at the
   prepared notes, pick your must-dos and extras, and commit the day.
3. Before bed, tap **End-of-day review** and answer honestly. That's the
   whole ritual.

---

## When things go wrong

- **"Couldn't reach the AI"** — your Anthropic credit may have run out. Check
  Billing at console.anthropic.com.
- **App won't load at all** — open the Railway dashboard and look at the
  service's **Deployments** tab; a red deployment means something failed.
  Click it to see logs, and share them with Claude to diagnose.
- **Forgot your passcode** — change the `LIFEOS_PASSCODE` variable in Railway
  and redeploy. Your data is untouched.
- **Updating the app** — any change pushed to the GitHub repository's main
  branch redeploys automatically. Ask Claude to make changes; when they're
  merged, your app updates itself.
