import config from "@config/index";
import database from "@config/database";
import App from "./app";

interface NodeError extends Error {
  code?: string;
}

async function bootstrap(): Promise<void> {
  try {
    // Connect to database
    console.log("Connecting to database...");
    try {
      await database.connect();
    } catch (dbError) {
      if (config.nodeEnv === "production") {
        console.error("Failed to connect to database in production:", dbError);
        process.exit(1);
      } else {
        console.warn(
          "⚠️  Failed to connect to database. Running in development mode without database connection.",
        );
        console.warn(
          "Make sure PostgreSQL is running before using database features.",
        );
      }
    }

    // Create Express app
    const app = new App();

    // Start server
    await app.listen(config.port);

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM signal received: closing HTTP server");
      await database.disconnect();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT signal received: closing HTTP server");
      await database.disconnect();
      process.exit(0);
    });
  } catch (error) {
    const startupError = error as NodeError;

    if (startupError.code === "EADDRINUSE") {
      console.error(
        `Port ${config.port} is already in use. Stop the running process or set a different PORT in .env.`,
      );
    } else {
      console.error("Failed to start application:", error);
    }

    await database.disconnect();
    process.exit(1);
  }
}

bootstrap();
