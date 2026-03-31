import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { Server } from "http";
import config from "@config/index";
import routes from "@routes/index";
import {
  errorHandlingMiddleware,
  notFoundMiddleware,
  requestLoggerMiddleware,
  tenantMiddleware,
} from "@middleware/index";

class App {
  private app: Express;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS middleware
    this.app.use(
      cors({
        origin: config.api.corsOrigin,
        credentials: true,
      }),
    );

    // Body parser middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(requestLoggerMiddleware);

    // Tenant middleware (multi-tenant support)
    this.app.use(tenantMiddleware);
  }

  private setupRoutes(): void {
    // API routes
    this.app.use("/api", routes);

    // Health check at root
    this.app.get("/", (req, res) => {
      res.json({
        message: "Arrow API Server",
        version: "1.0.0",
        status: "running",
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 Not Found middleware
    this.app.use(notFoundMiddleware);

    // Error handling middleware (must be last)
    this.app.use(errorHandlingMiddleware);
  }

  public getApp(): Express {
    return this.app;
  }

  public listen(port: number): Promise<Server> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, () => {
        console.log(
          `Server running on port ${port} in ${config.nodeEnv} environment`,
        );
        resolve(server);
      });

      server.on("error", (error) => {
        reject(error);
      });
    });
  }
}

export default App;
