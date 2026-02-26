import type { ThemeConfig } from "../../types/index.js";

export function getCssVariables(theme: ThemeConfig): string {
  return `
    --ig-accent: ${theme.accentColor};
    --ig-bg: ${theme.backgroundColor};
    --ig-text: ${theme.textColor};
    --ig-font: ${theme.fontFamily};
    --ig-radius: ${theme.borderRadius};
  `;
}

export const bannerStyles = `
  :host {
    all: initial;
    font-family: var(--ig-font);
    color: var(--ig-text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .ig-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 99998;
  }

  /* ── Banner ── */

  .ig-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--ig-bg);
    border-top: 1px solid #d4d4d4;
    z-index: 99999;
    padding: 10px 16px;
    font-family: var(--ig-font);
    color: var(--ig-text);
  }

  .ig-banner-inner {
    max-width: 960px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  @media (min-width: 768px) {
    .ig-banner {
      padding: 10px 24px;
    }

    .ig-banner-inner {
      flex-direction: row;
      align-items: center;
      gap: 20px;
    }

    .ig-banner-text {
      flex: 1;
    }
  }

  .ig-banner-desc {
    font-size: 13px;
    line-height: 1.45;
    color: var(--ig-text);
    opacity: 0.8;
  }

  .ig-banner-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  @media (min-width: 768px) {
    .ig-banner-actions {
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }
  }

  /* ── Buttons ── */

  .ig-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 18px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    font-family: var(--ig-font);
    cursor: pointer;
    border: none;
    min-height: 36px;
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.15s, opacity 0.15s;
    letter-spacing: 0.01em;
  }

  .ig-btn:hover {
    opacity: 0.85;
  }

  .ig-btn:focus-visible {
    outline: 2px solid var(--ig-accent);
    outline-offset: 2px;
  }

  .ig-btn-primary {
    background: var(--ig-accent);
    color: #fff;
  }

  .ig-btn-secondary {
    background: transparent;
    color: var(--ig-text);
    border: 1px solid rgba(0, 0, 0, 0.2);
  }

  .ig-btn-secondary:hover {
    border-color: rgba(0, 0, 0, 0.35);
  }

  .ig-btn-ghost {
    background: none;
    border: none;
    color: var(--ig-accent);
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: var(--ig-font);
    min-height: 36px;
    text-decoration: none;
  }

  .ig-btn-ghost:hover {
    text-decoration: underline;
  }

  .ig-gpc-notice {
    font-size: 13px;
    color: var(--ig-text);
    opacity: 0.7;
    line-height: 1.45;
  }

  /* ── Modal ── */

  .ig-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .ig-modal {
    background: var(--ig-bg);
    border-radius: 4px;
    max-width: 520px;
    width: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .ig-modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .ig-modal-title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }


  .ig-modal-body {
    padding: 4px 20px 8px;
    overflow-y: auto;
    flex: 1;
  }

  .ig-modal-footer {
    padding: 12px 20px 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ig-modal-footer-buttons {
    display: flex;
    gap: 8px;
  }

  .ig-modal-footer-buttons .ig-btn {
    flex: 1;
  }

  .ig-modal-footer-meta {
    text-align: center;
    font-size: 12px;
    padding-top: 2px;
  }

  .ig-modal-footer-meta a {
    color: var(--ig-text);
    opacity: 0.5;
    text-decoration: none;
  }

  .ig-modal-footer-meta a:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  /* ── Category list ── */

  .ig-category {
    padding: 14px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .ig-category:last-child {
    border-bottom: none;
  }

  .ig-category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .ig-category-name {
    font-size: 13px;
    font-weight: 600;
  }

  .ig-category-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 500;
    color: var(--ig-text);
    opacity: 0.45;
    margin-left: 6px;
    letter-spacing: 0.02em;
  }

  .ig-category-desc {
    font-size: 12px;
    color: var(--ig-text);
    opacity: 0.55;
    margin-top: 3px;
    line-height: 1.45;
    padding-right: 50px;
  }

  /* ── Toggle switch ── */

  .ig-toggle {
    position: relative;
    width: 38px;
    height: 22px;
    flex-shrink: 0;
  }

  .ig-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }

  .ig-toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: #d1d5db;
    border-radius: 11px;
    transition: background 0.2s;
  }

  .ig-toggle-slider::after {
    content: "";
    position: absolute;
    width: 18px;
    height: 18px;
    left: 2px;
    bottom: 2px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .ig-toggle input:checked + .ig-toggle-slider {
    background: var(--ig-accent);
  }

  .ig-toggle input:checked + .ig-toggle-slider::after {
    transform: translateX(16px);
  }

  .ig-toggle input:disabled + .ig-toggle-slider {
    opacity: 0.6;
    cursor: default;
  }

  .ig-toggle input:focus-visible + .ig-toggle-slider {
    outline: 2px solid var(--ig-accent);
    outline-offset: 2px;
  }

  /* ── Opt-out specific ── */

  .ig-optout-section {
    margin: 14px 0 0;
  }

  .ig-optout-section h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.5;
    margin-bottom: 6px;
  }

  .ig-optout-list {
    list-style: none;
    padding: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--ig-text);
    opacity: 0.7;
  }

  .ig-optout-list li::before {
    content: "\\2022";
    margin-right: 8px;
    opacity: 0.4;
  }

  /* ── Persistent access ── */

  .ig-persistent {
    position: fixed;
    bottom: 16px;
    left: 16px;
    z-index: 99997;
  }

  .ig-persistent-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--ig-accent);
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .ig-persistent-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .ig-persistent-btn:focus-visible {
    outline: 2px solid var(--ig-accent);
    outline-offset: 2px;
  }

  .ig-persistent-btn svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
