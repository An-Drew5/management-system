import dotenv from "dotenv";

dotenv.config();

interface Config {
  nodeEnv: "development" | "production" | "test";
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  api: {
    baseUrl: string;
    corsOrigin: string;
  };
  logging: {
    level: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
}

const config: Config = {
  nodeEnv: (process.env.NODE_ENV as any) || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME || "arrow_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  },
  api: {
    baseUrl: process.env.API_BASE_URL || "http://localhost:5000",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
};

export default config;
