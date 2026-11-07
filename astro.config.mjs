import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://v2macapp.github.io',
  // GitHub Pages sets no headers, so the CSP is a <meta> that Astro fills with the hashes of our
  // inline scripts and styles. connect-src: the NoLeaker page's own leak test.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self' https://ipinfo.io https://ipwho.is https://one.one.one.one",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ],
      // style="" attributes in the markup; <style> elements are still hash-checked.
      styleDirective: {
        resources: [{ resource: "'self'", kind: 'element' }, { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
    },
  },
});
