# Epic 8: Banner Copy & Layout Polish

> Fine-tune banner description text, button layout, and copy length for a tighter, more polished banner across all viewports and languages.

---

## Story 8.1: Reduce Banner Description Font Size on Desktop

**As a** desktop visitor
**I want** the cookie banner description text to be visually understated
**So that** the banner feels lightweight and doesn't dominate the page

### Problem

The `.ig-banner-desc` font size is 13px at all viewport widths. On desktop (≥860px) the description sits alongside the action buttons in a horizontal row and feels oversized relative to the compact button sizing and overall banner density. On mobile the 13px reads fine because it fills the full width.

### Acceptance Criteria

- [x] On desktop (≥860px), `.ig-banner-desc` renders at 12px
- [x] On mobile (<860px), `.ig-banner-desc` stays at 13px (unchanged)
- [x] The change applies to all banner variants (opt-in, opt-out, notice-only)
- [ ] Visual verification at 1440×900 and 1024×768

---

## Story 8.2: Shorten EU Opt-In Banner Description Copy

**As a** visitor in the EU
**I want** a concise cookie banner message
**So that** I can quickly understand what's being asked and take action

### Problem

The current opt-in banner description reads:

> We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. By clicking "Accept all", you agree to this as outlined in our Cookie Policy. You can manage your preferences at any time.

The final sentence ("You can manage your preferences at any time.") is redundant — the "Manage preferences" link is right there in the banner. Removing it shortens the text and reduces banner height, especially on mobile where text wrapping is most impactful.

### Acceptance Criteria

- [x] English `banner.optIn.description` drops the final sentence
- [x] All 6 translation files (fr, de, es, it, nl, pt) are updated with the equivalent shortened text
- [ ] Locale conformance tests still pass (all keys present, no empty values)
- [ ] Visual verification that the shorter text looks balanced at 375×812 and 1440×900

---

## Story 8.3: Banner Button Layout on Narrow Viewports

**As a** mobile visitor
**I want** the banner buttons to be easy to tap and visually balanced
**So that** I can quickly make my consent choice

### Problem

Below the 860px breakpoint, the banner buttons need a consistent, polished layout:

- **Opt-in**: Accept all / Reject all should sit side-by-side, each taking 50% of the available width (equal-width via `flex: 1 1 0`). "Manage preferences" link goes centered below.
- **Opt-out**: "Got it" should be full-width (100%). "Do Not Sell or Share My Personal Information" link goes below.
- **Notice-only**: "Got it" should be full-width (100%). "Learn more" link goes below.
- Ghost links (blue text links) must always render **below** all buttons — never above them.
- Ghost links must be allowed to wrap (`white-space: normal`) to prevent overflow on narrow viewports (the "Do Not Sell" text is 48 chars).
- Button horizontal padding should be reduced from 18px to 14px below 860px so that the longest translations (NL: "Alles accepteren" / "Alles weigeren") fit side-by-side at 320px.

### Acceptance Criteria

- [x] Opt-in: Accept/Reject buttons each 50% width, side-by-side, below 860px
- [x] Opt-out: "Got it" button full-width, "Do Not Sell" link below it
- [x] Notice-only: "Got it" button full-width, "Learn more" link below it
- [x] Ghost links always render below all buttons
- [x] Ghost links wrap text instead of overflowing viewport
- [x] Button padding reduced to 14px on mobile so NL/DE fit at 320px
- [ ] No button text overflow or clipping at 320px in any of the 7 languages
- [ ] Above 860px, layout is unchanged (horizontal row)
- [ ] Visual verification at 320×568, 375×812, 800×600 with EN, DE, and NL

---

## Story 8.4: Align Button Gap with Banner Edge Padding on Mobile

**As a** mobile visitor
**I want** the spacing between the two buttons to look visually equal to the space between the buttons and the viewport edge
**So that** the banner feels balanced and polished

### Problem

On narrow viewports (<860px), the banner has `padding: 10px 16px` (16px side padding) but the gap between the two side-by-side buttons is only 6px. The result is the buttons appear crammed together compared to their distance from the edges, creating a visually unbalanced layout.

### Acceptance Criteria

- [x] Button gap increased to 12px on mobile to visually align with the 16px side padding
- [ ] Dutch "Alles accepteren" / "Alles weigeren" still fits side-by-side at 320px
- [ ] Visual verification at 320×568, 375×812 with EN and NL
- [ ] Desktop (≥860px) gap unchanged at 8px
