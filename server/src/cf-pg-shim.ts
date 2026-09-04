try {
  Object.defineProperty(globalThis.navigator, 'userAgent', {
    get: () => 'Cloudflare-Workers',
    configurable: true
  });
} catch {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'Cloudflare-Workers' },
    configurable: true
  });
}
