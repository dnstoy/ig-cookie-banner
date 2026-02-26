import type {
  BannerConfig,
  BootstrapPayload,
  ConsentModel,
  ConsentState,
  GpcState,
} from "../../types/index.js";
import type { LocaleStrings } from "../../config/locale.js";
import type { ConsentManager } from "../consent-manager.js";
import { getCssVariables, bannerStyles } from "./styles.js";

// Cookie icon based on Lucide (ISC license) — irregular bite edge
const ICON_COOKIE = `<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10c0-1.2-.3-2.3-.7-3.3-.6.2-1.1.3-1.8.3-1.2 0-2.2-.5-2.9-1.2l.4-.8c-.8-.5-1.3-1.2-1.5-2.1l-.8.2C14 4 13.1 3.1 12.7 2.1 12.5 2 12.2 2 12 2z"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg>`;

export class BannerUI {
  private readonly host: HTMLElement;
  private readonly shadow: ShadowRoot;
  private readonly manager: ConsentManager;
  private readonly config: BannerConfig;
  private readonly locale: LocaleStrings;
  private readonly consentModel: ConsentModel;
  private readonly gpcState: GpcState;
  private bannerEl: HTMLElement | null = null;
  private modalEl: HTMLElement | null = null;
  private overlayEl: HTMLElement | null = null;
  private persistentEl: HTMLElement | null = null;

  constructor(
    manager: ConsentManager,
    bootstrap: BootstrapPayload,
    locale: LocaleStrings,
  ) {
    this.manager = manager;
    this.config = bootstrap.config;
    this.locale = locale;
    this.consentModel = bootstrap.consentModel;
    this.gpcState = bootstrap.gpcState;

    this.host = document.createElement("ig-consent-banner");
    this.shadow = this.host.attachShadow({ mode: "open" });

    // Inject styles
    const style = document.createElement("style");
    style.textContent = bannerStyles;
    this.shadow.appendChild(style);

    // Apply theme via CSS variables
    this.host.style.cssText = getCssVariables(this.config.ui.theme);

    document.body.appendChild(this.host);
  }

  show(): void {
    if (this.consentModel === "opt-in") {
      this.renderOptInBanner();
    } else if (this.consentModel === "opt-out") {
      this.renderOptOutBanner();
    } else {
      this.renderNoticeOnlyBanner();
    }
  }

  dismiss(): void {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
    if (this.bannerEl) {
      this.bannerEl.remove();
      this.bannerEl = null;
    }
    this.showPersistentAccess();
  }

  showPersistentAccess(): void {
    if (this.persistentEl) return;

    this.persistentEl = document.createElement("div");
    this.persistentEl.className = "ig-persistent";

    const btn = document.createElement("button");
    btn.className = "ig-persistent-btn";
    btn.setAttribute("aria-label", this.locale.common.cookiePreferences);
    btn.innerHTML = ICON_COOKIE;
    btn.addEventListener("click", () => {
      this.openModal();
    });

    this.persistentEl.appendChild(btn);
    this.shadow.appendChild(this.persistentEl);
  }

  openModal(): void {
    this.hideBanner();
    if (this.consentModel === "opt-out") {
      this.renderOptOutModal();
    } else {
      this.renderOptInModal();
    }
  }

  private hideBanner(): void {
    if (this.bannerEl) this.bannerEl.classList.add("ig-banner-hidden");
    if (this.overlayEl) this.overlayEl.classList.add("ig-banner-hidden");
  }

  private showBanner(): void {
    if (this.bannerEl) this.bannerEl.classList.remove("ig-banner-hidden");
    if (this.overlayEl) this.overlayEl.classList.remove("ig-banner-hidden");
  }

  private renderOptInBanner(): void {
    const strings = this.locale.banner.optIn;

    this.overlayEl = document.createElement("div");
    this.overlayEl.className = "ig-overlay";
    this.overlayEl.setAttribute("aria-hidden", "true");
    this.shadow.appendChild(this.overlayEl);

    this.bannerEl = document.createElement("div");
    this.bannerEl.className = "ig-banner";
    this.bannerEl.setAttribute("role", "dialog");
    this.bannerEl.setAttribute("aria-label", strings.description);

    this.bannerEl.innerHTML = `
      <div class="ig-banner-inner">
        <div class="ig-banner-text">
          <div class="ig-banner-desc">${esc(strings.description)}</div>
        </div>
        <div class="ig-banner-actions">
          <button class="ig-btn ig-btn-primary" data-action="accept-all">${esc(strings.acceptAll)}</button>
          <button class="ig-btn ig-btn-secondary" data-action="reject-all">${esc(strings.rejectAll)}</button>
          <button class="ig-btn ig-btn-ghost" data-action="manage">${esc(strings.managePreferences)}</button>
        </div>
      </div>
    `;

    this.bannerEl
      .querySelector('[data-action="accept-all"]')!
      .addEventListener("click", () => this.acceptAll());
    this.bannerEl
      .querySelector('[data-action="reject-all"]')!
      .addEventListener("click", () => this.rejectAll());
    this.bannerEl
      .querySelector('[data-action="manage"]')!
      .addEventListener("click", () => this.openModal());

    this.shadow.appendChild(this.bannerEl);
  }

  private renderOptOutBanner(): void {
    const strings = this.locale.banner.optOut;

    this.bannerEl = document.createElement("div");
    this.bannerEl.className = "ig-banner";
    this.bannerEl.setAttribute("role", "dialog");
    this.bannerEl.setAttribute("aria-label", strings.description);

    if (this.gpcState === "detected") {
      this.bannerEl.innerHTML = `
        <div class="ig-banner-inner">
          <div class="ig-banner-text">
            <div class="ig-gpc-notice">${esc(strings.gpcHonored)}</div>
          </div>
          <div class="ig-banner-actions">
            <button class="ig-btn ig-btn-primary" data-action="ok">${esc(strings.ok)}</button>
          </div>
        </div>
      `;
    } else {
      this.bannerEl.innerHTML = `
        <div class="ig-banner-inner">
          <div class="ig-banner-text">
            <div class="ig-banner-desc">${esc(strings.description)}</div>
          </div>
          <div class="ig-banner-actions">
            <button class="ig-btn ig-btn-ghost" data-action="do-not-sell">${esc(strings.doNotSell)}</button>
            <button class="ig-btn ig-btn-primary" data-action="ok">${esc(strings.ok)}</button>
          </div>
        </div>
      `;

      this.bannerEl
        .querySelector('[data-action="do-not-sell"]')!
        .addEventListener("click", () => this.openModal());
    }

    this.bannerEl
      .querySelector('[data-action="ok"]')!
      .addEventListener("click", () => {
        this.acceptAll();
      });

    this.shadow.appendChild(this.bannerEl);
  }

  private renderNoticeOnlyBanner(): void {
    const strings = this.locale.banner.noticeOnly;

    this.bannerEl = document.createElement("div");
    this.bannerEl.className = "ig-banner";
    this.bannerEl.setAttribute("role", "dialog");
    this.bannerEl.setAttribute("aria-label", strings.description);

    this.bannerEl.innerHTML = `
      <div class="ig-banner-inner">
        <div class="ig-banner-text">
          <div class="ig-banner-desc">${esc(strings.description)}</div>
        </div>
        <div class="ig-banner-actions">
          <button class="ig-btn ig-btn-primary" data-action="ok">${esc(strings.ok)}</button>
          <a href="${esc(this.config.organization.privacyPolicyUrl)}" target="_blank" rel="noopener" class="ig-btn ig-btn-ghost">${esc(strings.learnMore)}</a>
        </div>
      </div>
    `;

    this.bannerEl
      .querySelector('[data-action="ok"]')!
      .addEventListener("click", () => {
        this.acceptAll();
      });

    this.shadow.appendChild(this.bannerEl);
  }

  private renderOptInModal(): void {
    this.closeModal();
    const strings = this.locale.modal.optIn;
    const state = this.manager.getState();

    const modalBackdrop = document.createElement("div");
    modalBackdrop.className = "ig-modal-backdrop";
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) this.closeModal();
    });

    const categoriesHtml = this.config.categories
      .map((cat) => {
        const catStrings = this.locale.categories[cat.id];
        const name = catStrings?.name ?? cat.id;
        const desc = catStrings?.description ?? "";
        const checked = state[cat.id] === "granted" ? "checked" : "";
        const disabled = cat.required ? "disabled" : "";
        const badge = cat.required
          ? `<span class="ig-category-badge">${esc(this.locale.common.alwaysOn)}</span>`
          : "";

        return `
          <div class="ig-category">
            <div class="ig-category-header">
              <div>
                <span class="ig-category-name">${esc(name)}</span>${badge}
              </div>
              <label class="ig-toggle">
                <input type="checkbox" data-category="${esc(cat.id)}" ${checked} ${disabled}>
                <span class="ig-toggle-slider"></span>
              </label>
            </div>
            <div class="ig-category-desc">${esc(desc)}</div>
          </div>
        `;
      })
      .join("");

    modalBackdrop.innerHTML = `
      <div class="ig-modal" role="dialog" aria-label="${esc(strings.title)}">
        <div class="ig-modal-header">
          <div class="ig-modal-title">${esc(strings.title)}</div>
        </div>
        <div class="ig-modal-body">
          ${categoriesHtml}
        </div>
        <div class="ig-modal-footer">
          <div class="ig-modal-footer-buttons">
            <button class="ig-btn ig-btn-secondary" data-action="reject-all">${esc(strings.rejectAll)}</button>
            <button class="ig-btn ig-btn-secondary" data-action="accept-all">${esc(strings.acceptAll)}</button>
            <button class="ig-btn ig-btn-primary" data-action="save">${esc(strings.savePreferences)}</button>
          </div>
          <div class="ig-modal-footer-meta">
            <a href="${esc(this.config.organization.privacyPolicyUrl)}" target="_blank" rel="noopener">${esc(this.locale.common.privacyPolicy)}</a>
          </div>
        </div>
      </div>
    `;

    modalBackdrop
      .querySelector('[data-action="accept-all"]')!
      .addEventListener("click", () => this.acceptAll());
    modalBackdrop
      .querySelector('[data-action="reject-all"]')!
      .addEventListener("click", () => this.rejectAll());
    modalBackdrop
      .querySelector('[data-action="save"]')!
      .addEventListener("click", () => {
        const newState: ConsentState = {};
        modalBackdrop
          .querySelectorAll<HTMLInputElement>("input[data-category]")
          .forEach((input) => {
            const catId = input.getAttribute("data-category")!;
            newState[catId] = input.checked ? "granted" : "denied";
          });
        this.manager.updateConsent(newState);
        this.closeModal();
        this.dismiss();
      });

    this.modalEl = modalBackdrop;
    this.shadow.appendChild(modalBackdrop);
    this.attachEscHandler();

    // Focus the first toggle for keyboard accessibility
    const firstToggle = modalBackdrop.querySelector<HTMLElement>(
      ".ig-toggle input",
    );
    if (firstToggle) firstToggle.focus();
  }

  private renderOptOutModal(): void {
    this.closeModal();
    const strings = this.locale.modal.optOut;
    const isGpc = this.gpcState === "detected";

    const dataCategories = this.config.optOut?.dataCategories ?? [];
    const thirdParties = this.config.optOut?.thirdPartyCategories ?? [];

    const dataCategoriesHtml = dataCategories.length
      ? `
        <div class="ig-optout-section">
          <h3>${esc(strings.dataCollectedTitle)}</h3>
          <ul class="ig-optout-list">${dataCategories.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
        </div>`
      : "";

    const thirdPartiesHtml = thirdParties.length
      ? `
        <div class="ig-optout-section">
          <h3>${esc(strings.thirdPartiesTitle)}</h3>
          <ul class="ig-optout-list">${thirdParties.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
        </div>`
      : "";

    const gpcNote = isGpc
      ? `<div class="ig-gpc-notice" style="margin-bottom: 12px">${esc(strings.gpcNote)}</div>`
      : "";

    const modalBackdrop = document.createElement("div");
    modalBackdrop.className = "ig-modal-backdrop";
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) this.closeModal();
    });

    modalBackdrop.innerHTML = `
      <div class="ig-modal" role="dialog" aria-label="${esc(strings.title)}">
        <div class="ig-modal-header">
          <div class="ig-modal-title">${esc(strings.title)}</div>
        </div>
        <div class="ig-modal-body">
          <p style="margin-bottom: 14px; font-size: 13px; line-height: 1.45; opacity: 0.7">${esc(strings.saleDescription)}</p>
          ${gpcNote}
          <div class="ig-category">
            <div class="ig-category-header">
              <div class="ig-category-name">${esc(strings.saleToggle)}</div>
              <label class="ig-toggle">
                <input type="checkbox" data-optout="sale" ${isGpc ? "checked disabled" : ""}>
                <span class="ig-toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="ig-category">
            <div class="ig-category-header">
              <div class="ig-category-name">${esc(strings.advertisingToggle)}</div>
              <label class="ig-toggle">
                <input type="checkbox" data-optout="advertising" ${isGpc ? "checked disabled" : ""}>
                <span class="ig-toggle-slider"></span>
              </label>
            </div>
          </div>
          ${dataCategoriesHtml}
          ${thirdPartiesHtml}
        </div>
        <div class="ig-modal-footer">
          <div class="ig-modal-footer-buttons">
            <button class="ig-btn ig-btn-primary" data-action="save">${esc(strings.save)}</button>
          </div>
          <div class="ig-modal-footer-meta">
            <a href="${esc(this.config.organization.privacyPolicyUrl)}" target="_blank" rel="noopener">${esc(this.locale.common.privacyPolicy)}</a>
          </div>
        </div>
      </div>
    `;

    modalBackdrop
      .querySelector('[data-action="save"]')!
      .addEventListener("click", () => {
        const saleChecked = modalBackdrop.querySelector<HTMLInputElement>(
          '[data-optout="sale"]',
        )?.checked;
        const adChecked = modalBackdrop.querySelector<HTMLInputElement>(
          '[data-optout="advertising"]',
        )?.checked;

        if (saleChecked || adChecked) {
          // User opted out
          this.manager.withdrawConsent();
        } else {
          // User chose not to opt out
          this.acceptAll();
        }
        this.closeModal();
        this.dismiss();
      });

    this.modalEl = modalBackdrop;
    this.shadow.appendChild(modalBackdrop);
    this.attachEscHandler();
  }

  private escHandler: ((e: KeyboardEvent) => void) | null = null;

  private closeModal(): void {
    const hadModal = !!this.modalEl;
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
    }
    if (this.escHandler) {
      document.removeEventListener("keydown", this.escHandler);
      this.escHandler = null;
    }
    if (hadModal) this.showBanner();
  }

  private attachEscHandler(): void {
    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") this.closeModal();
    };
    document.addEventListener("keydown", this.escHandler);
  }

  private acceptAll(): void {
    const state: ConsentState = {};
    for (const cat of this.config.categories) {
      state[cat.id] = "granted";
    }
    this.manager.updateConsent(state);
    this.dismiss();
  }

  private rejectAll(): void {
    this.manager.withdrawConsent();
    this.closeModal();
    this.dismiss();
  }
}

function esc(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
