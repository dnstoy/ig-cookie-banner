/**
 * Phase 1 skeleton HTML. In Phase 2, this will be replaced by
 * the actual origin response processed via HTMLRewriter.
 */
export const skeletonHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cookie Banner Test Site</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; padding: 2rem; max-width: 800px; margin: 0 auto; }
    h1 { margin-bottom: 1rem; }
    p { margin-bottom: 1rem; }
    .section { border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .section h2 { margin-bottom: 0.5rem; font-size: 1.2rem; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e0e0e0; font-size: 0.9rem; color: #666; }
    footer a { color: #0066cc; }
    #dev-overlay { position: fixed; top: 0; left: 0; right: 0; background: #1a1a1a; color: #00ff88; font-family: monospace; font-size: 12px; padding: 4px 12px; z-index: 99999; text-align: center; }
  </style>
  <!-- gtag stub -->
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      var args = Array.prototype.slice.call(arguments);
      window.dataLayer.push(arguments);
      console.log('[gtag]', args.join(', '));
    }
  </script>
</head>
<body>
  <h1>Cookie Banner Test Site</h1>

  <div class="section">
    <h2>Content Section 1</h2>
    <p>This is placeholder content to verify the banner overlay behavior. When the cookie banner is displayed, this content should be visible but not clickable.</p>
  </div>

  <div class="section">
    <h2>Content Section 2</h2>
    <p>More placeholder content. Try scrolling while the banner is displayed. The banner should remain fixed to the bottom of the viewport.</p>
  </div>

  <div class="section">
    <h2>Content Section 3</h2>
    <p>Additional content to ensure the page has enough height for scroll testing.</p>
  </div>

  <!-- Consent-gated scripts -->
  <script type="text/plain" data-consent-category="analytics">
    console.log('[SCRIPT ACTIVATED] Analytics script running');
  </script>
  <script type="text/plain" data-consent-category="marketing">
    console.log('[SCRIPT ACTIVATED] Marketing script running');
  </script>
  <script type="text/plain" data-consent-category="functional">
    console.log('[SCRIPT ACTIVATED] Functional script running');
  </script>

  <footer>
    <a href="#" id="manage-preferences">Manage cookie preferences</a> |
    <a href="https://example.com/privacy">Privacy policy</a>
  </footer>
</body>
</html>`;
