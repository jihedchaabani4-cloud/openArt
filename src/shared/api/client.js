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
            const err = new Error(errMsg);
            err.status = response.status;
            if (errorData.errorCode ?? errorData.code) {
                err.errorCode = errorData.errorCode ?? errorData.code;
            }
            throw err;
        }

        if (response.status === 204 || response.status === 205) {
            return null;
        }

        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();
        if (!text) return null;
        if (contentType.includes("application/json")) {
            return JSON.parse(text);
        }
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            console.error(`🔌 API Request Timed Out [${url}] after ${timeoutMs}ms`);
            throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s. Please check your connection or refresh.`);
        }
        if (error?.status !== 401) {
            console.error(`🔌 API Request Failed [${url}]:`, error.message);
        }
        throw error;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}


function parseResponsePayload(text, contentType = "") {
    if (!text) return null;
    if (contentType.includes("application/json")) {
        return JSON.parse(text);
    }
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function buildHttpError(status, statusText, responseText) {
    let errorData = {};
    if (responseText) {
        try {
            errorData = JSON.parse(responseText);
        } catch {
            errorData = {};
        }
    }
    const errMsg =
        errorData.message ||
        (typeof errorData.error === "string" ? errorData.error : null) ||
        `API error: ${status} ${statusText}`;
    const err = new Error(errMsg);
    err.status = status;
    if (errorData.errorCode ?? errorData.code) {
        err.errorCode = errorData.errorCode ?? errorData.code;
    }
    return err;
}

function uploadFormWithProgress(url, formData, options = {}) {
    const {
        method = "POST",
        headers = {},
        signal,
        timeout = 120000,
        onUploadProgress,
    } = options;

    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.withCredentials = true;
        xhr.timeout = timeout;

        Object.entries(headers).forEach(([key, value]) => {
            if (key.toLowerCase() !== "content-type" && value !== undefined) {
                xhr.setRequestHeader(key, value);
            }
        });

        let lastPercent = -1;
        let lastPhase = null;

        const emitProgress = (percent, phase, event) => {
            if (typeof onUploadProgress !== "function") return;
            const clamped = Math.min(100, Math.max(0, Math.round(percent)));
            if (clamped === lastPercent && phase === lastPhase) return;
            lastPercent = clamped;
            lastPhase = phase;
            onUploadProgress(clamped, { phase, event });
        };

        const cleanup = () => {
            if (signal) signal.removeEventListener("abort", handleAbort);
        };

        const handleAbort = () => {
            xhr.abort();
        };

        if (signal) {
            signal.addEventListener("abort", handleAbort, { once: true });
        }

        if (xhr.upload && typeof onUploadProgress === "function") {
            xhr.upload.onprogress = (event) => {
                if (!event.lengthComputable || event.total <= 0) return;
                const percent = Math.round((event.loaded / event.total) * 100);
                if (event.loaded >= event.total) {
                    emitProgress(100, "processing", event);
                } else {
                    emitProgress(Math.min(99, percent), "uploading", event);
                }
            };
            xhr.upload.onload = () => {
                emitProgress(100, "processing");
            };
        }

        xhr.onload = () => {
            cleanup();
            if (xhr.status < 200 || xhr.status >= 300) {
                const err = buildHttpError(xhr.status, xhr.statusText, xhr.responseText);
                if (err.status !== 401) {
                    console.error(`🔌 API Request Failed [${url}]:`, err.message);
                }
                reject(err);
                return;
            }
            emitProgress(100, "done");
            if (xhr.status === 204 || xhr.status === 205) {
                resolve(null);
                return;
            }
            const contentType = xhr.getResponseHeader("content-type") || "";
            resolve(parseResponsePayload(xhr.responseText, contentType));
        };

        xhr.onerror = () => {
            cleanup();
            const err = new Error("Network error while uploading file");
            console.error(`🔌 API Request Failed [${url}]:`, err.message);
            reject(err);
        };

        xhr.ontimeout = () => {
            cleanup();
            console.error(`🔌 API Request Timed Out [${url}] after ${timeout}ms`);
            reject(new Error(`Request timed out after ${Math.round(timeout / 1000)}s. Please check your connection or refresh.`));
        };

        xhr.onabort = () => {
            cleanup();
            reject(new DOMException("Aborted", "AbortError"));
        };

        xhr.send(formData);
    });
}

export const api = {
    get: (endpoint, options) => apiRequest(endpoint, { ...options, method: "GET" }),
    post: (endpoint, body, options) => apiRequest(endpoint, {
        ...options,
        method: "POST",
        body: (typeof FormData !== "undefined" && body instanceof FormData) ? body : JSON.stringify(body)
    }),
    postForm: (endpoint, formData, options = {}) => {
        if (typeof options?.onUploadProgress === "function" && typeof XMLHttpRequest !== "undefined") {
            if (!BASE_URL) {
                console.warn("API URL is not defined. Request aborted.");
                return Promise.reject(new Error("API URL is not defined"));
            }
            const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
            return uploadFormWithProgress(url, formData, { ...options, method: "POST" });
        }
        return apiRequest(endpoint, { ...options, method: "POST", body: formData });
    },
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
