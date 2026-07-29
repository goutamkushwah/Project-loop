export type ApiFieldErrors = Record<string, string[] | undefined>;

export type ApiErrorCode =
  | "INVALID_CONTENT_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "EMAIL_ALREADY_EXISTS"
  | "REGISTRATION_FAILED"
  | "INTERNAL_SERVER_ERROR";

export type ApiErrorResponse = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: ApiFieldErrors;
  };
};

export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
};