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

    const timeoutMs = options.timeout ?? 15000;
    let signal = options.signal;
    let timeoutId = null;

    if (!signal) {
        if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
            signal = AbortSignal.timeout(timeoutMs);
        } else {
            const controller = new AbortController();
            signal = controller.signal;
            timeoutId = setTimeout(() => controller.abort(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
        }
    }

    const config = {
        credentials: "include", // Required to send HttpOnly cookies
        ...options,
        headers,
        signal,
    };

    try {
        const response = await fetch(url, config);
        
        // Handle specific status codes if needed
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errMsg = errorData.message || (typeof errorData.error === 'string' ? errorData.error : null) || `API error: ${response.status} ${response.statusText}`;
            throw new Error(errMsg);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            console.error(`🔌 API Request Timed Out [${url}] after ${timeoutMs}ms`);
            throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s. Please check your connection or refresh.`);
        }
        console.error(`🔌 API Request Failed [${url}]:`, error.message);
        throw error;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}


export const api = {
    get: (endpoint, options) => apiRequest(endpoint, { ...options, method: "GET" }),
    post: (endpoint, body, options) => apiRequest(endpoint, {
        ...options,
        method: "POST",
        body: (typeof FormData !== "undefined" && body instanceof FormData) ? body : JSON.stringify(body)
    }),
    postForm: (endpoint, formData, options) => apiRequest(endpoint, { ...options, method: "POST", body: formData }),
    patch: (endpoint, body, options) => apiRequest(endpoint, {
        ...options,
        method: "PATCH",
        body: (typeof FormData !== "undefined" && body instanceof FormData) ? body : JSON.stringify(body)
    }),
    put: (endpoint, body, options) => apiRequest(endpoint, {
        ...options,
        method: "PUT",
        body: (typeof FormData !== "undefined" && body instanceof FormData) ? body : JSON.stringify(body)
    }),
    delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: "DELETE" }),
    getBlob: async (url, options = {}) => {
        const config = {
            method: "GET",
            ...options,
        };
        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
            }
            return await response.blob();
        } catch (error) {
            console.error(`🔌 API getBlob Failed [${url}]:`, error.message);
            throw error;
        }
    },
};
