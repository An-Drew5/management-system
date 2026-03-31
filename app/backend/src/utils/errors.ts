/**
 * Custom API Error class for consistent error handling
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.status = status;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Create a success response object
 */
export const successResponse = (data: any, message: string = "Success") => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Create an error response object
 */
export const errorResponse = (
  message: string,
  status: number = 500,
  details?: any,
) => ({
  success: false,
  message,
  status,
  details,
  timestamp: new Date().toISOString(),
});
