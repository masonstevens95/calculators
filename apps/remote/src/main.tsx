// MF 2.0 async boundary: defer the mount through a dynamic import so the
// federation runtime can finish initializing shared chunks (react,
// react-dom, react/jsx-runtime, react-dom/client) before any consumer code
// touches them. Without this split you get React error #130 — synchronous
// imports resolve to `undefined` while loadShare wrappers are still pending.
//
// See: https://module-federation.io/guide/basic/runtime.html#dynamic-remote
void import('./bootstrap');
