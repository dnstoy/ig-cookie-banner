import { describe, it, expect, beforeEach } from "vitest";
import {
  activateScripts,
  activateCategory,
} from "../../src/client/script-blocking.js";

describe("Script blocking engine", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  });

  function addBlockedScript(category: string, content: string): void {
    const script = document.createElement("script");
    script.type = "text/plain";
    script.setAttribute("data-consent-category", category);
    script.textContent = content;
    document.body.appendChild(script);
  }

  it("should not execute blocked scripts by default", () => {
    addBlockedScript("analytics", 'window.__testAnalytics = true;');
    // Script with type="text/plain" is not executed
    const scripts = document.querySelectorAll('script[type="text/plain"]');
    expect(scripts).toHaveLength(1);
  });

  it("should activate scripts for granted categories in opt-in mode", () => {
    addBlockedScript("analytics", "// analytics code");
    addBlockedScript("marketing", "// marketing code");

    activateScripts(
      { analytics: "granted", marketing: "denied" },
      "opt-in",
    );

    // Analytics script should be activated (type changed to text/javascript)
    const activeScripts = document.querySelectorAll(
      'script[type="text/javascript"]',
    );
    expect(activeScripts).toHaveLength(1);
    expect(activeScripts[0].getAttribute("data-consent-category")).toBe(
      "analytics",
    );

    // Marketing script should still be blocked
    const blockedScripts = document.querySelectorAll(
      'script[type="text/plain"]',
    );
    expect(blockedScripts).toHaveLength(1);
  });

  it("should activate all scripts for notice-only model", () => {
    addBlockedScript("analytics", "// analytics");
    addBlockedScript("marketing", "// marketing");

    activateScripts(
      { analytics: "denied", marketing: "denied" },
      "notice-only",
    );

    // All scripts should be activated regardless of consent state
    const blockedScripts = document.querySelectorAll(
      'script[type="text/plain"]',
    );
    expect(blockedScripts).toHaveLength(0);

    const activeScripts = document.querySelectorAll(
      'script[type="text/javascript"]',
    );
    expect(activeScripts).toHaveLength(2);
  });

  it("should activate all scripts for opt-out model", () => {
    addBlockedScript("analytics", "// analytics");
    addBlockedScript("marketing", "// marketing");

    activateScripts(
      { analytics: "granted", marketing: "granted" },
      "opt-out",
    );

    const blockedScripts = document.querySelectorAll(
      'script[type="text/plain"]',
    );
    expect(blockedScripts).toHaveLength(0);
  });

  it("should not affect scripts without data-consent-category", () => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.textContent = "// regular script";
    document.body.appendChild(script);

    activateScripts({ analytics: "granted" }, "opt-in");

    // Regular script should be untouched
    const scripts = document.querySelectorAll('script[type="text/javascript"]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].hasAttribute("data-consent-category")).toBe(false);
  });

  it("should preserve script attributes when activating", () => {
    const script = document.createElement("script");
    script.type = "text/plain";
    script.setAttribute("data-consent-category", "analytics");
    script.setAttribute("data-custom", "value");
    script.id = "my-analytics";
    script.textContent = "// code";
    document.body.appendChild(script);

    activateScripts({ analytics: "granted" }, "opt-in");

    const activated = document.getElementById("my-analytics");
    expect(activated).not.toBeNull();
    expect(activated!.getAttribute("type")).toBe("text/javascript");
    expect(activated!.getAttribute("data-custom")).toBe("value");
    expect(activated!.getAttribute("data-consent-category")).toBe("analytics");
  });

  describe("activateCategory", () => {
    it("should activate scripts for a specific category", () => {
      addBlockedScript("analytics", "// analytics");
      addBlockedScript("marketing", "// marketing");

      activateCategory("analytics");

      const active = document.querySelectorAll(
        'script[type="text/javascript"]',
      );
      expect(active).toHaveLength(1);
      expect(active[0].getAttribute("data-consent-category")).toBe("analytics");

      // Marketing should still be blocked
      const blocked = document.querySelectorAll('script[type="text/plain"]');
      expect(blocked).toHaveLength(1);
    });

    it("should handle case where no scripts match the category", () => {
      addBlockedScript("analytics", "// analytics");

      // Should not throw
      activateCategory("nonexistent");

      // Analytics should still be blocked
      const blocked = document.querySelectorAll('script[type="text/plain"]');
      expect(blocked).toHaveLength(1);
    });
  });
});
