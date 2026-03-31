import database from "@config/database";
import BaseService from "./baseService";
import { AppError } from "@utils/errors";

export interface Tenant {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

class TenantService extends BaseService {
  private sanitizeName(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z0-9\s-]/g, "");
  }

  private generateBaseCode(name: string): string {
    const cleaned = this.sanitizeName(name).toLowerCase();

    if (!cleaned) {
      throw new AppError("Tenant name is required", 400);
    }

    const words = cleaned.split(" ").filter(Boolean);
    let code = "";

    if (words.length > 1) {
      code = words.map((word) => word[0]).join("");
    } else {
      const single = words[0] || cleaned;
      // Prefer consonants to keep code short/readable, then fallback to full characters.
      const consonants = single.replace(/[aeiou]/g, "");
      code = (consonants || single).slice(0, 6);
    }

    code = code.replace(/[^a-z0-9-]/g, "");

    if (code.length < 3) {
      const compact = cleaned.replace(/[^a-z0-9]/g, "");
      code = compact.slice(0, 6);
    }

    if (code.length < 3) {
      throw new AppError("Unable to generate a valid tenant code", 400);
    }

    return code.slice(0, 12);
  }

  private async assertCodeUnique(code: string): Promise<void> {
    const existing = await this.getTenantByCode(code);
    if (existing) {
      throw new AppError("Tenant code already exists", 409, { code });
    }
  }

  async createTenant(name: string): Promise<Tenant> {
    try {
      const sanitizedName = this.sanitizeName(name);

      if (!sanitizedName) {
        throw new AppError("Tenant name is required", 400);
      }

      const code = this.generateBaseCode(sanitizedName);
      await this.assertCodeUnique(code);

      const query = `
        INSERT INTO tenants (name, code)
        VALUES ($1, $2)
        RETURNING id, name, code, created_at, updated_at
      `;

      const result = await database.query(query, [sanitizedName, code]);
      return result.rows[0] as Tenant;
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new AppError("Tenant code already exists", 409);
      }
      this.handleError(error);
    }
  }

  async getTenantByCode(code: string): Promise<Tenant | null> {
    try {
      const normalizedCode = code
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9-]/g, "");

      if (!normalizedCode) {
        throw new AppError("Tenant code is required", 400);
      }

      const query = `
        SELECT id, name, code, created_at, updated_at
        FROM tenants
        WHERE code = $1
        LIMIT 1
      `;

      const result = await database.query(query, [normalizedCode]);
      return (result.rows[0] as Tenant) || null;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export default new TenantService();
