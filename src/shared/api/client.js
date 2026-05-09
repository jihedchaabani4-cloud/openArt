const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**ffff
 * Centralized API request helper
 */
export async function apiRequest(endpoint, options = {}) {
    if (!BASE_URL) {
        console.warn("API URL is not defined. Request aborted.");
        return Promise.reject(new Error("API URL is not defined"));
    }

    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers = { ...options.headers };
    
    // Automatically set Content-Type unless we're sending FormData
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    const config = {
        credentials: "include", // Required to send HttpOnly cookies
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        
        // Handle specific status codes if needed
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || `API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`🔌 API Request Failed [${url}]:`, error.message);
        throw error;
    }
}

export const api = {
    get: (endpoint, options) => apiRequest(endpoint, { ...options, method: "GET" }),
    post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
    postForm: (endpoint, formData, options) => apiRequest(endpoint, { ...options, method: "POST", body: formData }),
    patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
    delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: "DELETE" }),
};
