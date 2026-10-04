# Project rules
- Keep browser-only field capabilities in client-safe modules and dynamically import ONNX Runtime, because TanStack Start renders routes on the server.
- Register the generated app service worker only through the guarded wrapper, because previews and development must never retain stale caches.
- Keep field records and uncertain photos in IndexedDB, because this MVP is local-first and has no cloud sync.
