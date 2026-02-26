import { describe, it, expect } from "vitest";

describe("Client-side smoke test", () => {
  it("should have DOM available via happy-dom", () => {
    const div = document.createElement("div");
    div.textContent = "hello";
    document.body.appendChild(div);
    expect(document.body.textContent).toContain("hello");
  });
});
