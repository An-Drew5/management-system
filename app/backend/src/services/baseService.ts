/**
 * Service layer - This is where business logic lives
 * Services should be called by controllers
 * Services interact with database layer
 *
 * Example structure:
 * - Validate input
 * - Call database/external APIs
 * - Transform and return data
 */

class BaseService {
  constructor() {
    // Initialize common service logic
  }

  protected handleError(error: any): never {
    console.error("Service error:", error);
    throw error;
  }
}

export default BaseService;
