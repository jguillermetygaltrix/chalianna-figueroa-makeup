# Chalianna Figueroa — Makeup Artist Website

A fully responsive, mobile-friendly website built with HTML, CSS, and vanilla JavaScript. No build step or dependencies — just open `index.html` in a browser.

## File Structure

```
.
├── BRIEF.md       # Full website brief & content guide
├── index.html     # Page markup
├── styles.css     # All styling (palette, layout, animations, responsive)
├── script.js      # Nav, reveals, portfolio filters, forms
└── README.md      # This file
```

## Customizing With Real Content

### 1. Replace the portrait (About section)
Open `styles.css` and find `.about__image-placeholder`. Replace its `background` rule with:

```css
.about__image-placeholder {
  background: url('your-portrait.jpg') center/cover no-repeat;
}
```

Then in `index.html`, remove the `<span>` and `<small>` text inside `.about__image-placeholder`.

### 2. Replace portfolio images
Each tile uses `.portfolio__img--1` through `--8`. In `styles.css`, swap the gradient for a real image:

```css
.portfolio__img--1 { background: url('looks/bridal-01.jpg') center/cover no-repeat; }
```

Remove the `<span class="portfolio__placeholder">` text from each `<figure>` in `index.html`.

### 3. Replace Instagram tiles
Same approach — `.instagram__tile--1` through `--6` in `styles.css`.

### 4. Update contact information
In `index.html`, find the **Contact** section and update:
- Email — `hello@chaliannamua.com`
- Phone — `+1 (555) 123-4567`
- Instagram handle — `@chaliannamua`

Also update the same in the footer and the floating chat link.

### 5. Update prices & service descriptions
Each `<article class="service-card">` in `index.html` has a price (`.service-card__price`) and description — edit directly.

### 6. Hook up the forms
The booking and contact forms currently show a success message client-side only. To send real submissions, point them at:
- A service like Formspree, Getform, or Netlify Forms (just set the `action` attribute)
- Or your own backend endpoint

Example:
```html
<form id="bookingForm" action="https://formspree.io/f/YOUR_ID" method="POST">
```

## Color Palette

| Variable | Hex |
|---|---|
| `--bg` (warm white) | `#FAF7F2` |
| `--blush` | `#F3DCD2` |
| `--champagne` | `#E8D5B7` |
| `--beige` | `#D9C5A8` |
| `--mocha` (text) | `#3B2C26` |
| `--gold` (accent) | `#C9A36A` |

All defined as CSS variables at the top of `styles.css` — change once, applies everywhere.

## Browser Support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Uses `aspect-ratio`, `IntersectionObserver`, and `backdrop-filter` — graceful fallbacks included.

## Performance Notes

- Fonts loaded with `preconnect` + `display=swap`
- All animations respect `prefers-reduced-motion`
- No external JS libraries — single ~5KB script
