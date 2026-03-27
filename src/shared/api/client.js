const BASE_URL = "http://localhost:5000/api";

/**
 * Centralized API request helper
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers = { ...options.headers };
    
    // Automatically set Content-Type unless we're sending FormData
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        
        // Handle specific status codes if needed
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
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
