/**
 * GET /api/availability
 *
 * Fetches Chalianna's published iCloud calendar (an .ics feed) and returns
 * the dates she is unavailable for the next ~90 days.
 *
 * Required Azure config setting:
 *   ICLOUD_CALENDAR_URL  — the public webcal:// or https:// .ics URL
 *
 * Response shape:
 *   {
 *     "busyDates": ["2026-05-12", "2026-05-15"],
 *     "busySlots": {
 *       "2026-05-12": [{ "start": "14:00", "end": "17:00" }],
 *       "2026-05-15": [{ "start": "10:00", "end": "13:00" }]
 *     },
 *     "fetchedAt": "2026-05-05T18:43:00.000Z"
 *   }
 */

const ical = require('node-ical');

// In-memory cache (per-instance) — Azure Functions reuses warm instances.
let cache = { data: null, ts: 0 };
const CACHE_MS = 10 * 60 * 1000; // 10 minutes

const HORIZON_DAYS = 90;

const json = (status, body) => ({
  status,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  },
  body: JSON.stringify(body),
});

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Walks every event between `from` and `to`, expanding RRULE recurrences.
 * Returns an array of { start: Date, end: Date } in local server time.
 */
function expandEvents(parsed, from, to) {
  const out = [];

  for (const key of Object.keys(parsed)) {
    const ev = parsed[key];
    if (!ev || ev.type !== 'VEVENT') continue;
    if (!ev.start) continue;

    // Single (non-recurring) event
    if (!ev.rrule) {
      const start = new Date(ev.start);
      const end = new Date(ev.end || ev.start);
      if (end >= from && start <= to) out.push({ start, end });
      continue;
    }

    // Recurring event — expand within the window
    let occurrences = [];
    try {
      occurrences = ev.rrule.between(from, to, true);
    } catch (_) {
      continue;
    }

    const durationMs = ev.end ? new Date(ev.end) - new Date(ev.start) : 60 * 60 * 1000;
    const exdates = ev.exdate || {};

    for (const occ of occurrences) {
      const occKey = ymd(occ);
      if (exdates[occKey]) continue;
      const start = new Date(occ);
      const end = new Date(occ.getTime() + durationMs);
      out.push({ start, end });
    }
  }

  return out;
}

/**
 * Builds the busyDates / busySlots structure from a list of events.
 */
function buildAvailability(events) {
  const busySlots = {};
  const allDayDates = new Set();

  for (const ev of events) {
    const startDay = ymd(ev.start);
    const endDay = ymd(ev.end);
    const isAllDay = ev.start.getHours() === 0 && ev.start.getMinutes() === 0 &&
                     (ev.end - ev.start) % (24 * 60 * 60 * 1000) === 0;

    if (isAllDay) {
      // Span every day from start to end (exclusive of end if multi-day all-day)
      let cursor = new Date(ev.start);
      const stop = new Date(ev.end);
      while (cursor < stop) {
        allDayDates.add(ymd(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      continue;
    }

    if (startDay !== endDay) {
      // Cross-midnight booking — block both days as busy slots
      if (!busySlots[startDay]) busySlots[startDay] = [];
      busySlots[startDay].push({ start: hm(ev.start), end: '23:59' });
      if (!busySlots[endDay]) busySlots[endDay] = [];
      busySlots[endDay].push({ start: '00:00', end: hm(ev.end) });
    } else {
      if (!busySlots[startDay]) busySlots[startDay] = [];
      busySlots[startDay].push({ start: hm(ev.start), end: hm(ev.end) });
    }
  }

  // A day is fully blocked if it's an all-day event, or has 4+ hours booked overall
  // (heuristic — adjust as needed). For now: any all-day event blocks the day.
  const busyDates = new Set([...allDayDates]);

  return {
    busyDates: [...busyDates].sort(),
    busySlots,
  };
}

module.exports = async function (context, req) {
  const url = process.env.ICLOUD_CALENDAR_URL;

  if (!url) {
    context.log.error('ICLOUD_CALENDAR_URL not configured');
    return json(503, {
      error: 'Calendar not configured yet.',
      busyDates: [],
      busySlots: {},
    });
  }

  // Cache hit
  if (cache.data && Date.now() - cache.ts < CACHE_MS) {
    return json(200, cache.data);
  }

  // webcal:// → https://
  const fetchUrl = url.replace(/^webcal:\/\//i, 'https://');

  try {
    const parsed = await ical.async.fromURL(fetchUrl);

    const now = new Date();
    const horizon = new Date(now.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000);
    const events = expandEvents(parsed, now, horizon);
    const { busyDates, busySlots } = buildAvailability(events);

    const payload = {
      busyDates,
      busySlots,
      fetchedAt: new Date().toISOString(),
    };

    cache = { data: payload, ts: Date.now() };
    return json(200, payload);
  } catch (err) {
    context.log.error('Failed to fetch/parse calendar:', err.message);
    // Don't 500 — return empty availability so the form still works
    return json(200, {
      busyDates: [],
      busySlots: {},
      fetchedAt: new Date().toISOString(),
      warning: 'Could not load calendar — defaulting to fully available.',
    });
  }
};
