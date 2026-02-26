# Epic 4: Banner & Modal UI

> Three banner templates (opt-in, opt-out, notice-only) and a shared preference modal. All text comes from locale files.

### Responsive requirement (applies to all stories in this epic)

Every banner and modal must be visually verified at mobile (375px), tablet (768px), and desktop (1280px) widths using the test skeleton site (Story 0.1) and Chrome MCP browser resize. Breakpoint details and pass criteria are defined in Story 0.3. Any story in this epic is not done until responsive verification passes.

---

## Story 4.1: Opt-In Banner (EU/UK Model)

**As a** visitor from an opt-in jurisdiction
**I want** a banner with clear Accept All, Reject All, and Manage Preferences options
**So that** I can make an informed, uncoerced choice about cookies

### Acceptance Criteria

- [ ] Banner is a bottom bar fixed to the viewport bottom (`position: fixed; bottom: 0`), taking up only as much vertical space as its content requires
- [ ] Contains: brief description of cookie usage, **"Accept All"** button, **"Reject All"** button, **"Manage Preferences"** link/button
- [ ] "Accept All" and "Reject All" have **equal visual weight** (same size, same styling prominence) — this is a legal requirement, not a design preference
- [ ] "Manage Preferences" opens the preference modal (Story 4.4)
- [ ] Clicking "Accept All" sets all categories to `granted`, writes consent cookie, sends consent record, fires Google Consent Mode update, activates blocked scripts, and dismisses the banner
- [ ] Clicking "Reject All" sets all non-required categories to `denied`, writes consent cookie, sends consent record, fires Google Consent Mode update, and dismisses the banner
- [ ] Banner blocks interaction with the page underneath (overlay/backdrop) — content is visible but not clickable
- [ ] All text comes from the active locale file
- [ ] Banner does not appear if valid consent already exists
- [ ] Tests: banner renders with correct buttons; Accept All grants all categories; Reject All denies all non-required categories; banner dismisses after action; banner does not render when valid consent exists

---

## Story 4.2: Opt-Out Banner (US Model)

**As a** visitor from the United States
**I want** a notice about data collection with a clear opt-out mechanism
**So that** I can exercise my right to opt out of the sale/sharing of my data

### Acceptance Criteria

- [ ] Banner is a bottom bar fixed to the viewport bottom, taking up only as much vertical space as its content requires
- [ ] Contains: brief notice about data collection, **"Do Not Sell or Share My Personal Information"** link (mandatory CCPA/CPRA language), **"OK" / "Got It"** dismissal button
- [ ] "Do Not Sell or Share" is the entry point to the opt-out preference modal (Story 4.5) — no separate "Manage Preferences" link (that's an EU concept)
- [ ] Clicking "OK" dismisses the banner (tracking continues — this is opt-out, not opt-in)
- [ ] If GPC was detected: banner shows **"Opt-Out Request Honored"** confirmation message instead of the standard opt-out prompt (California requirement since Jan 2026)
- [ ] The opt-out flow must require **the same number of steps or fewer** than opting in
- [ ] All text comes from the active locale file
- [ ] Tests: banner renders with correct elements; OK dismisses without changing consent; GPC-detected state shows confirmation message; "Do Not Sell" link opens modal

---

## Story 4.3: Notice-Only Banner (AU/CA Federal Model)

**As a** visitor from a notice-only jurisdiction
**I want** a simple notice that the site uses cookies
**So that** I'm informed about data collection practices

### Acceptance Criteria

- [ ] Banner is a bottom bar fixed to the viewport bottom, taking up only as much vertical space as its content requires
- [ ] Contains: brief notice about cookie usage, **"OK" / "Got It"** dismissal button, optional **"Learn More"** link
- [ ] Clicking "OK" dismisses the banner
- [ ] No script blocking — all scripts run normally
- [ ] All text comes from the active locale file
- [ ] Tests: banner renders with notice text and dismissal button; dismissal writes consent cookie (to prevent re-showing); no scripts are blocked

---

## Story 4.4: Preference Modal — Opt-In Variant

**As a** visitor in an opt-in jurisdiction
**I want** a detailed modal where I can toggle individual cookie categories
**So that** I have granular control over which types of cookies I consent to

### Acceptance Criteria

- [ ] Modal opens from "Manage Preferences" on the opt-in banner, or from the persistent preferences link (Story 4.6)
- [ ] Lists all cookie categories from config, each with:
  - Category name
  - Category description
  - Toggle switch (on/off)
- [ ] "Strictly Necessary" category is always on, toggle is disabled, with an explanation of why it cannot be turned off
- [ ] All non-required categories default to **off** (not pre-selected — legal requirement)
- [ ] Modal includes **"Accept All"**, **"Reject All"**, and **"Save Preferences"** buttons
- [ ] "Save Preferences" applies only the currently toggled categories
- [ ] On save: writes consent cookie, sends consent record, fires Google Consent Mode update, activates/blocks scripts per category, dismisses modal
- [ ] Modal is accessible: keyboard navigable, proper ARIA labels, focus trapping
- [ ] All text comes from the active locale file
- [ ] Tests: modal renders all categories from config; strictly necessary is non-toggleable; non-required categories default to off; Save Preferences applies only selected categories; Accept All toggles all on; Reject All toggles all off

---

## Story 4.5: Preference Modal — Opt-Out Variant

**As a** visitor in the United States
**I want** a detailed modal where I can opt out of data sale and sharing
**So that** I can exercise my privacy rights with full transparency

### Acceptance Criteria

- [ ] Modal opens from "Do Not Sell or Share" on the opt-out banner, or from the persistent preferences link
- [ ] Contains:
  - Explanation of what "sale" and "sharing" of personal information means
  - Toggle to opt out of sale/sharing of personal information
  - Toggle to opt out of targeted/cross-context behavioral advertising
  - List of categories of personal information collected (from config `optOut.dataCategories`)
  - List of categories of third parties data is shared with (from config `optOut.thirdPartyCategories`)
- [ ] On save: writes consent cookie, sends consent record, fires Google Consent Mode update with appropriate parameters, dismisses modal
- [ ] If GPC is active, toggles are pre-set to opted-out with a note explaining GPC
- [ ] All text comes from the active locale file
- [ ] Tests: modal renders opt-out controls; save applies opt-out state; GPC pre-sets toggles to opted out

---

## Story 4.6: Persistent Preferences Access

**As a** visitor who has already made a consent choice
**I want** a way to revisit and change my preferences at any time
**So that** I can withdraw or modify my consent as legally required

### Acceptance Criteria

- [ ] A persistent UI element is always visible after the banner is dismissed
- [ ] Configurable style: floating icon (small cookie/shield icon) or footer link
- [ ] Clicking it reopens the appropriate preference modal (opt-in variant or opt-out variant, based on consent model)
- [ ] The modal pre-populates with the user's current consent state
- [ ] Tests: element is visible after banner dismissal; clicking it opens the correct modal variant; modal reflects current consent state

---

## Story 4.7: Theming & Customization

**As a** site operator
**I want** the banner and modal to match my site's visual identity
**So that** the consent UI feels native, not like a third-party widget

### Acceptance Criteria

- [ ] Config `ui.theme` supports: `accentColor` (used for buttons and hyperlinks — the one brand color the operator picks), `backgroundColor`, `textColor`, `fontFamily`, `borderRadius`
- [ ] Theme values are applied via CSS custom properties (not inline styles)
- [ ] Default theme is neutral (works on light and dark backgrounds)
- [ ] Banner and modal use shadow DOM or scoped styles to avoid CSS conflicts with the host page
- [ ] Tests: custom theme values are applied; default theme renders without errors; styles do not leak to/from the host page
