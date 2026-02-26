# Epic 7: Responsive Layout Fixes

> Fixes for banner and modal layout issues discovered during cross-viewport testing (320px–1440px).

---

## Story 7.1: Opt-In Banner Stacked Buttons Consume Too Much Vertical Space

**As a** mobile visitor in the EU
**I want** the cookie banner to take up minimal screen space
**So that** I can still see the page content while making my choice

### Problem

Below the 768px breakpoint the banner switches to a stacked layout where "Accept all", "Reject all", and "Manage preferences" each render as full-width block buttons. Combined with the description text wrapping at narrow widths, the banner consumes 40–70% of the viewport height depending on the screen size. At 320×568 (iPhone SE) the banner covers nearly 70% of the viewport.

### Acceptance Criteria

- [ ] Below 768px, "Accept all" and "Reject all" render side by side in a single row (not stacked full-width)
- [ ] "Manage preferences" renders as a centered text link below the button row, not as a third full-width button
- [ ] The banner never exceeds 40% of viewport height at any supported width (320px–767px)
- [ ] Visual verification at 320×568, 375×812, 430×932

---

## Story 7.2: Modal Footer Buttons Overflow on Narrow Viewports

**As a** mobile visitor
**I want** the modal action buttons to be fully visible and tappable
**So that** I can save my preferences without guessing what a clipped button says

### Problem

The opt-in modal footer places three buttons ("Reject all", "Accept all", "Save my choices") in a single `flex` row. At viewports narrower than ~400px the "Save my choices" button text is clipped by the viewport edge. At 320px only "Save m" is visible. The `white-space: nowrap` on `.ig-btn` prevents wrapping, and the three `flex: 1` buttons don't have enough room.

### Acceptance Criteria

- [ ] Below a small-screen breakpoint (~480px), the modal footer buttons stack: "Save my choices" on its own row (primary, full-width), "Accept all" and "Reject all" side by side below it
- [ ] No button text is truncated or clipped at any viewport width down to 320px
- [ ] Visual verification at 320×568, 375×812

---

## Story 7.3: Banner Visible Behind Modal Backdrop

**As a** visitor opening the preferences modal
**I want** the modal to fully cover the banner
**So that** the UI looks polished and I'm not confused by duplicate buttons

### Problem

When the modal opens, the underlying banner is not hidden. Its buttons bleed through below the modal footer, especially on mobile where the modal fills most of the viewport. The "Reject all" and "Manage preferences" buttons from the banner are visible underneath the modal backdrop at viewports from 320px to 600px.

### Acceptance Criteria

- [ ] Opening the modal hides the banner (set `display: none` or remove from DOM)
- [ ] Closing the modal without saving restores the banner
- [ ] Dismissing via Save/Accept/Reject still dismisses both modal and banner
- [ ] No banner elements are visible when the modal is open at any viewport size

---

## Story 7.4: Modal Truncated on Short Viewports (Low Heights)

**As a** visitor on a landscape tablet or low-height browser window
**I want** the modal content to be scrollable so I can see all categories
**So that** I can review every cookie category before making a choice

### Problem

At viewport heights around 468px–636px (e.g., 800×600, 1024×768), the modal's `max-height: 85vh` leaves very little room for the scrollable body after the header (~52px) and footer (~100px) consume their space. At 800×600, only 2–3 of 4 categories are visible and the user may not realize the body scrolls. The "Functional" category is often hidden entirely.

### Acceptance Criteria

- [ ] The modal body shows a visible scroll indicator (fade gradient or scrollbar) when content overflows
- [ ] On short viewports (`max-height < 500px`), reduce modal padding and use a more compact layout
- [ ] At minimum, the first category and part of the second category are always visible to signal scrollability
- [ ] Visual verification at 800×600, 1024×768

---

## Story 7.5: Banner Takes Excessive Space at 800×600 (Just Over Breakpoint)

**As a** visitor on a small laptop or landscape tablet
**I want** the banner to be compact even when using horizontal layout
**So that** I can still see the page content

### Problem

At 800×600, the banner is just above the 768px breakpoint so it uses the horizontal (row) layout. But the text column wraps heavily and the three buttons (Accept all, Reject all, Manage preferences) are cramped. The banner takes about 40% of the 468px viewport height. The horizontal layout at this width is arguably worse than the mobile stacked layout would be.

### Acceptance Criteria

- [ ] Consider raising the breakpoint to ~860px or adding an intermediate breakpoint where buttons wrap onto a second line
- [ ] Alternatively, at 768px–860px the banner text is truncated with a "..." and a "More" link, or the description font size is reduced
- [ ] The banner should not exceed 30% of viewport height at any width above the breakpoint
- [ ] Visual verification at 800×600, 860×600
