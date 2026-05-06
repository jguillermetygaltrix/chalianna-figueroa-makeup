# Calendar Sync Setup

How to connect Chalianna's iPhone calendar to the website so booked days automatically show as unavailable.

## Overview

```
iPhone Calendar  →  iCloud (public link)  →  Azure Function  →  Website
```

She adds appointments to a calendar called "Bookings" on her iPhone.
The website reads that calendar every 10 minutes and disables those days in the date picker.

---

## Part 1 — Chalianna's iPhone (one-time setup, ~5 min)

### Step 1: Create a dedicated "Bookings" calendar
1. Open the **Calendar** app on iPhone
2. Tap **Calendars** at the bottom
3. Tap **Add Calendar** → **Add Calendar**
4. Name it: **Bookings**
5. Pick a color (pink would be on-brand)
6. Tap **Done**

> Why a separate calendar? So personal events stay private. Only "Bookings" gets published.

### Step 2: Publish the Bookings calendar
1. Still in **Calendar** app → tap **Calendars** at the bottom
2. Tap the **ⓘ** (info) button next to **Bookings**
3. Toggle **Public Calendar** to **ON**
4. Tap **Share Link...** → **Copy Link**

She now has a URL like:
```
webcal://p36-caldav.icloud.com/published/2/MTU2OTk2OTU2MTE1Njk5NhsXXxXXxXX...
```

### Step 3: Send the link to whoever is configuring Azure
Just paste it in a text/email — it's safe to share (no one can write to the calendar, only read).

---

## Part 2 — Azure (one-time, ~2 min)

### Add the calendar URL as an environment variable

1. Go to the **Azure Portal** → open the **chalianna-figueroa** Static Web App
2. Left sidebar → **Environment variables** (or **Configuration** on older UI)
3. Click **+ Add**
4. **Name:** `ICLOUD_CALENDAR_URL`
5. **Value:** the full URL she copied (paste it as-is, even if it starts with `webcal://` — the function converts it)
6. Click **OK** → **Save**

The function will pick it up on the next request (no redeploy needed).

---

## Part 3 — Adding bookings going forward

When a client books a slot:
1. Chalianna adds the appointment to the **Bookings** calendar on her iPhone
2. Within ~10 minutes (cache window), that day shows as **booked** on the website
3. Clients trying to book that day see it greyed out with a strikethrough

For partial-day blocks (e.g. "booked 2pm–5pm"), the website will disable conflicting time slots when someone picks that date.

For all-day blocks (e.g. travel, vacation), set the appointment as an **all-day event** — the entire day will be greyed out.

---

## Troubleshooting

**"All days show as available even though I have bookings"**
- Wait 10 min (the cache refreshes every 10 minutes)
- Confirm the env var is named exactly `ICLOUD_CALENDAR_URL`
- Confirm the Public Calendar toggle is still ON in iPhone Calendar settings
- Check logs: Azure portal → Static Web App → **Functions** → `availability` → Logs

**"My personal events are showing as booked"**
- The published URL is for *all* events on the Bookings calendar. Make sure you're only adding client appointments to that specific calendar (not the default one). Tap the calendar name when creating an event to choose.

**"I want to update the URL"**
- Just edit the `ICLOUD_CALENDAR_URL` env var in Azure. The cache will refresh on the next call.

---

## Privacy notes

- The published calendar URL is **read-only** — no one with the link can add or change events.
- Anyone with the URL can see the events on that calendar. Don't publish your personal calendar — only the "Bookings" one.
- Event titles and notes are visible to anyone who fetches the URL. To be safe, name appointments generically ("Booked" or "Client appt") rather than including names.

The Azure Function never exposes the URL or the raw calendar — it only returns busy date strings.
