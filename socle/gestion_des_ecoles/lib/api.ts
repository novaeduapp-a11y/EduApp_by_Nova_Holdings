import type { ApiResponse } from "@/types";

const API_BASE = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || "Une erreur est survenue");
  }
  
  return data;
}

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<ApiResponse<T>> {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  return handleResponse<ApiResponse<T>>(response);
}

export async function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  return handleResponse<ApiResponse<T>>(response);
}

export async function apiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  return handleResponse<ApiResponse<T>>(response);
}

export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  return handleResponse<ApiResponse<T>>(response);
}
