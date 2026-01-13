/**
 * Global API Utility
 * Ensures consistent API paths and prevents double prefixes.
 */

const isApp = window.location.protocol === 'file:' || window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost';
const API_HOST = isApp ? "https://mial.be" : "";
const API_BASE = API_HOST + "/portal-api";
window.API_HOST = API_HOST;

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

/**
 * Standard Logout
 * Calls the API to clear cookies, then redirects to login.
 */
async function doLogout() {
    try {
        await fetch(apiUrl('/auth/logout'), {
            method: 'POST',
            credentials: 'include'
        });
    } catch (e) {
        console.warn('Logout fetch error', e);
    } finally {
        window.location.href = '/Connexion.html';
    }
}
window.doLogout = doLogout;
