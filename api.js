/**
 * Global API Utility
 * Ensures consistent API paths and prevents double prefixes.
 */

const API_BASE = "/portal-api";

/**
 * Constructs a normalized API URL.
 * Usage: fetch(apiUrl('/auth/login')) -> fetch('/portal-api/auth/login')
 * 
 * @param {string} path - The endpoint path (e.g., '/auth/login')
 * @returns {string} - The full API URL
 */
function apiUrl(path) {
    if (!path) return API_BASE;

    // Normalize path to ensure it starts with /
    let safePath = path;
    if (!safePath.startsWith('/')) {
        safePath = '/' + safePath;
    }

    // Check if path already starts with API_BASE to avoid double prefix
    // We treat "/portal-api" and "/portal-api/" as existing prefix
    if (safePath.startsWith(API_BASE)) {
        return safePath;
    }

    return API_BASE + safePath;
}

// Expose globally
window.apiUrl = apiUrl;
window.API_BASE = API_BASE;
