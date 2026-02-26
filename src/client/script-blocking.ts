import type { ConsentModel, ConsentState } from "../types/index.js";

/**
 * Activates scripts for granted categories.
 * Scripts tagged with type="text/plain" and data-consent-category are blocked by the browser.
 * This function re-inserts them as type="text/javascript" to trigger execution.
 */
export function activateScripts(
  state: ConsentState,
  consentModel: ConsentModel,
): void {
  if (typeof document === "undefined") return;

  // For notice-only and opt-out, activate all tagged scripts immediately
  const activateAll =
    consentModel === "notice-only" || consentModel === "opt-out";

  const scripts = document.querySelectorAll(
    'script[type="text/plain"][data-consent-category]',
  );

  scripts.forEach((script) => {
    const category = script.getAttribute("data-consent-category");
    if (!category) return;

    if (activateAll || state[category] === "granted") {
      activateScript(script as HTMLScriptElement);
    }
  });
}

/**
 * Activates scripts for a specific category.
 * Called when consent is granted for a category after initial load.
 */
export function activateCategory(categoryId: string): void {
  if (typeof document === "undefined") return;

  const scripts = document.querySelectorAll(
    `script[type="text/plain"][data-consent-category="${categoryId}"]`,
  );

  scripts.forEach((script) => {
    activateScript(script as HTMLScriptElement);
  });
}

function activateScript(original: HTMLScriptElement): void {
  const replacement = document.createElement("script");
  replacement.type = "text/javascript";

  // Copy attributes
  for (const attr of Array.from(original.attributes)) {
    if (attr.name === "type") continue;
    replacement.setAttribute(attr.name, attr.value);
  }

  // Copy inline content
  if (original.textContent) {
    replacement.textContent = original.textContent;
  }

  // Replace in DOM to trigger execution
  original.parentNode?.replaceChild(replacement, original);
}
