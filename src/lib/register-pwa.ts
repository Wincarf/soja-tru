function isPreviewHost(hostname: string) {
  return hostname.startsWith("id-preview--") || hostname.startsWith("preview--") || hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com") || hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com") || hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev");
}

export async function registerPwa() {
  if (!("serviceWorker" in navigator)) return;
  const shouldRefuse = !import.meta.env.PROD || window.self !== window.top || isPreviewHost(location.hostname) || new URLSearchParams(location.search).get("sw") === "off";
  if (shouldRefuse) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter((item) => item.active?.scriptURL.endsWith("/sw.js")).map((item) => item.unregister()));
    return;
  }
  await navigator.serviceWorker.register("/sw.js");
}
