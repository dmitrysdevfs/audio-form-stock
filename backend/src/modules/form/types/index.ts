export interface User {
  _id?: string;
  email: string;
  password?: string; // Optional for responses that exclude password
  createdAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
  count?: number;
}
