/**
 * Makes an API request with automatic token refresh on 401.
 * @param {string} endpoint - The API endpoint (relative to API_URL)
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  let accessToken = localStorage.getItem("accessToken");
  let refreshToken = localStorage.getItem("refreshToken");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  options.headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  };

  let response = await fetch(`${API_URL}${endpoint}`, options);

  // Handle both 401 and 403 errors for token refresh
  if ((response.status === 401 || response.status === 403) && refreshToken) {
    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (refreshRes.ok) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshRes.json();
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        
        // Retry the original request with new token
        options.headers = {
          ...(options.headers || {}),
          Authorization: `Bearer ${newAccessToken}`,
        };
        response = await fetch(`${API_URL}${endpoint}`, options);
      } else {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        throw new Error("Session expired. Please log in again.");
      }
    } catch (error) {
      // If refresh fails, clear tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      throw new Error("Authentication failed. Please log in again.");
    }
  }
  
  return response;
}
