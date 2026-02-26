export interface ApiResponse<T = any> {
  success: boolean;
  message: string | null;
  data: T | null;
}

export interface OtpResponseData {
  attempts: number;
  correlationID?: string;
  created?: string;
  emailAddress?: string;
  expiry?: string;
  retries?: number;
  state?: string;
  trxnId?: string;
  type?: string;
  phoneNumber?: string;
  updated?: string;
}

export interface PasswordResponseData {
  id: string;
  userName: string;
}

export interface ErrorResponse {
  data: {
    success: boolean;
    message: string;
    data: any;
  } | null;
  status?: number;
}

export interface MSWMock<T = any> {
  type: "get" | "post" | "put" | "delete" | string;
  endpoint: string;
  response: ApiResponse<T> | ErrorResponse | { status: number } | any;
}
