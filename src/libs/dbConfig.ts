import mongoose from "mongoose";

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  let mongooseCache: CachedConnection | undefined;
}

const globalWithCache = global as typeof globalThis & {
  mongooseCache: CachedConnection;
};

if (!globalWithCache.mongooseCache) {
  globalWithCache.mongooseCache = {
    conn: null,
    promise: null,
  };
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}

const options: mongoose.ConnectOptions = {
  bufferCommands: true,
  autoIndex: true,
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  connectTimeoutMS: 30000,
  dbName: process.env.MONGODB_DB || "your_default_db_name",
};

let listenersSet = false;

function isConnectionUsable(): boolean {
  // readyState 1 = connected, 2 = connecting
  // But sometimes readyState is 1 but the connection is broken, so we check .db
  return (
    mongoose.connection.readyState === 1 && mongoose.connection.db !== undefined
  );
}

export const connectMongoDB = async (): Promise<typeof mongoose> => {
  try {
    // Check for a truly healthy connection
    if (isConnectionUsable()) {
      return mongoose;
    }

    // If not connected, clear the cache and reconnect
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      globalWithCache.mongooseCache.conn = null;
      globalWithCache.mongooseCache.promise = null;
    }

    if (globalWithCache.mongooseCache.promise) {
      return await globalWithCache.mongooseCache.promise;
    }

    if (!listenersSet) {
      mongoose.connection.on("connected", () => {
        console.log("MongoDB connection established");
      });

      mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
        globalWithCache.mongooseCache.conn = null;
        globalWithCache.mongooseCache.promise = null;
        mongoose.disconnect();
      });

      mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected");
        globalWithCache.mongooseCache.conn = null;
        globalWithCache.mongooseCache.promise = null;
      });

      process.on("SIGTERM", () => handleShutdown("SIGTERM"));
      process.on("SIGINT", () => handleShutdown("SIGINT"));

      listenersSet = true;
    }

    globalWithCache.mongooseCache.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongooseInstance) => {
        console.log("MongoDB connected successfully");
        globalWithCache.mongooseCache.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch(async (error) => {
        console.error("Initial connection error:", error);
        globalWithCache.mongooseCache.promise = null;
        try {
          console.log("Attempting to reconnect...");
          const reconnection = await mongoose.connect(MONGODB_URI, {
            ...options,
            serverSelectionTimeoutMS: 5000,
          });
          console.log("Reconnection successful");
          globalWithCache.mongooseCache.conn = reconnection;
          return reconnection;
        } catch (retryError) {
          console.error("Reconnection failed:", retryError);
          throw error;
        }
      });

    return await globalWithCache.mongooseCache.promise;
  } catch (error) {
    globalWithCache.mongooseCache.conn = null;
    globalWithCache.mongooseCache.promise = null;
    throw new Error(getErrorMessage(error));
  }
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes("ETIMEOUT")) {
      return "Database connection timed out. Please check your network connection and try again.";
    }
    if (error.message.includes("Authentication failed")) {
      return "Database authentication failed. Please check your credentials.";
    }
    if (error.message.includes("ECONNREFUSED")) {
      return "Could not connect to database. Please check if the database server is running.";
    }
    return error.message;
  }
  return "An unexpected error occurred while connecting to the database.";
};

const handleShutdown = async (signal: string): Promise<void> => {
  try {
    await disconnectMongoDB();
    console.log(`MongoDB connection closed through ${signal}`);
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;
  try {
    await mongoose.connection.close();
    globalWithCache.mongooseCache.conn = null;
    globalWithCache.mongooseCache.promise = null;
    console.log("MongoDB disconnected successfully");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
    throw error;
  }
};

export { mongoose };
