# Innehållshantering (/admin)

This folder wires up [Decap CMS](https://decapcms.org/) (formerly Netlify CMS) as a
friendly `/admin` page for editing news, gallery photos, and events without
touching code. Everything it does is commit a change to this same GitHub repo
— GitHub Pages then rebuilds automatically, same as any other push.

## What's already done

- `admin/index.html` — loads the Decap CMS app.
- `admin/config.yml` — defines three collections (Nyheter, Galleri, Evenemang),
  each mapped to a JSON file under `content/` (`content/news.json`,
  `content/gallery.json`, `content/events.json`). The site's `main.js` fetches
  those same files to render the pages — editing here *is* editing the live
  content.

## What you still need to do (one-time setup)

Decap's GitHub backend needs to authenticate whoever logs into `/admin`. Since
this site is on GitHub Pages (not Netlify), that requires two things:

### 1. Register a GitHub OAuth App

In your GitHub account: **Settings → Developer settings → OAuth Apps → New OAuth App**.

- **Homepage URL**: `https://bluee124.github.io/Debre-Hail/`
- **Authorization callback URL**: depends on the proxy you deploy in step 2 —
  it'll be something like `https://<your-proxy-domain>/callback`.

This gives you a **Client ID** and **Client Secret** — keep the secret private,
it goes into the proxy's environment variables, never into this repo.

### 2. Deploy a small OAuth proxy

GitHub's OAuth flow needs a server-side step (exchanging a code for a token
using the client secret), which a static site can't do on its own. This is a
tiny, free, one-time deploy — not a service you maintain day-to-day. Search for
a current, actively-maintained **"Decap CMS GitHub OAuth proxy"** implementation
you can deploy to a free tier (a Cloudflare Worker or a Vercel/Netlify Function
are the common choices) — there are several open-source ones; pick one with
recent commits/activity since this is a fast-moving space. Deploying it
typically means: fork/clone it, set `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET`
(from step 1) as environment variables, deploy, and note the resulting URL.

### 3. Point config.yml at your proxy

In `admin/config.yml`, replace:

```yaml
base_url: https://REPLACE_WITH_YOUR_OAUTH_PROXY_URL
```

with the URL from step 2, commit, and push.

### 4. Grant repo access

Whoever should be able to log into `/admin` needs **write access to this GitHub
repo** (Settings → Collaborators) — Decap's GitHub backend uses your existing
GitHub permissions, there's no separate password to manage.

## Using it day-to-day

Once set up, go to `https://bluee124.github.io/Debre-Hail/admin/`, log in with
GitHub, and:

- **Nyheter**: add/edit articles (Swedish + Amharic fields side by side).
- **Galleri**: drag and drop a photo directly into the "Bild" field — Decap
  uploads it into `images/gallery/` and the entry points at it automatically.
  Leave "Bild" empty and fill in "Emoji"/"Färgstil" instead to keep one of the
  current placeholder tiles as-is.
- **Evenemang**: add an event with a date — it will appear both in the
  Gudstjänster calendar and in the events list (see the main plan for how
  that sync works).

Every save here is a real commit to the `main` branch, so it goes live the same
way any other change to this repo does.
