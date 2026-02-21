// Centralized API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

interface ApiResponse<T> {
  success: boolean;
  ok?: boolean,
  data?: T;
  message?: string;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { body, headers, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);

      // Handle 204 No Content (common for DELETE requests)
      if (response.status === 204) {
        return { success: true } as ApiResponse<T>;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Request failed with status ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const askFinancialAssistant = async (question: string): Promise<string> => {
  // We expect the backend to return { success: true, data: { answer: string } }
  try{

    const response = await api.post<{ answer: string }>("/chat", { question });
    
    if (response.data && response.data.answer) {
      return response.data.answer;
    }

    if (typeof response.data === "string"){
      return response.data;
    }

    throw new Error(response.message || "The AI response was empty.");
  
  } catch (error) {
    console.error("Chat API Error: ", error);
    throw error;
  }
};

export const api = new ApiService(API_BASE_URL);
export default api;
