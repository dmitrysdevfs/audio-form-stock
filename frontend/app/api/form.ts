const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface RegisterUserPayload {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

export const formApi = {
  registerUser: async (payload: RegisterUserPayload): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  getUsers: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/form`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      return data;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },
};
