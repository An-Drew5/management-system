// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: "An internal server error occurred",
  NOT_FOUND: "Resource not found",
  BAD_REQUEST: "Invalid request",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access forbidden",
  CONFLICT: "Resource already exists",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
} as const;
