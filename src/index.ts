// imports
import express, { Application, Request, Response, NextFunction } from "express";
import http from "http";
import { Server } from "socket.io";
import "dotenv/config";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import compression from "compression";
import fileUpload from "express-fileupload";
import cors from "cors";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { logger } from "./utils/index";

// constants
const port: number = parseInt(process.env.PORT || "8000");
const databaseUrl: string = process.env.DATABASE_URL || "";

const app: Application = express();
const server: http.Server = http.createServer(app);
const io: Server = new Server(server);

// middlewares
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "tiny"));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(cookieParser());
app.use(compression());
app.use(fileUpload({ useTempFiles: true }));
app.use(cors({ origin: "*" }));
app.use("/files", express.static("./files"));
// app.use("/api/v1", routes);

// database
mongoose.connect(databaseUrl).then(() => {
  logger.info("connected to database");
});

mongoose.connection.on("error", (error: Error): void => {
  logger.error("database connection error: " + error);
  process.exit(1);
});

if (process.env.NODE_ENV === "development") {
  mongoose.set("debug", true);
}

// error handling
app.use((req: Request, res: Response, next: NextFunction): void => {
  next(createHttpError.NotFound("This route doesn't exist"));
});

interface CustomError extends Error {
  status?: number;
}

app.use(
  (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
    res.status(err.status || 500);
    res.send({ error: { status: err.status || 500, message: err.message } });
  }
);

// handle unexpected errors
const exitHandler = (): void => {
  if (server) {
    logger.info("server closed");
  }
  process.exit(1);
};

const unexpectedErrorHandler = (error: Error) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", (): void => {
  if (server) {
    logger.info("Server closed.");
    process.exit(1);
  }
});

// listening to server
server.listen(port, (): void => {
  logger.info("server listening to port " + port);
});
