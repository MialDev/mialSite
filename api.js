/**
 * Global API Utility
 * Ensures consistent API paths and prevents double prefixes.
 */

const API_BASE = "/portal-api";

/**
 * Constructs a normalized API URL.
 * Usage: fetch(apiUrl('/auth/login')) -> fetch('/portal-api/auth/login')
 * 
 * Logic:
 * 1. Normalize slashes.
 * 2. Strip API_BASE if present at start.
 * 3. Prepend API_BASE.
 * 
 * @param {string} path - The endpoint path (e.g., '/auth/login', 'me')
 * @returns {string} - The full API URL
 */
function apiUrl(path) {
    if (!path) return API_BASE;

    // 1. Normalize to ensure string and leading slash
    let p = String(path).trim();
    if (!p.startsWith('/')) {
        p = '/' + p;
    }

    // 2. Strip existing API_BASE prefix if present (to avoid double prefixing)
    // We check for "/portal-api" at the start
    if (p.startsWith(API_BASE)) {
        p = p.substring(API_BASE.length);
        // ensure remaining starts with / if not empty
        if (p && !p.startsWith('/')) p = '/' + p;
    }

    // 3. Construct Final URL
    // If p became empty or just slash, handle gracefully, though usually expect subpath
    if (p === '/' || p === '') return API_BASE;

    // Ensure final p starts with / for clean concatenation logic, though we stripped it above?
    // Actually if we stripped /portal-api, we might have /me or me.
    // Let's ensure slash.
    if (!p.startsWith('/')) p = '/' + p;

    return API_BASE + p;
}

// Expose globally
window.apiUrl = apiUrl;
window.API_BASE = API_BASE;
