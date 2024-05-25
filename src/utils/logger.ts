import winston from "winston";

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.colorize(),
    winston.format.splat(),
    winston.format.printf(
      ({ level, message }): string => `[${level}]: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
    ...(process.env.NODE_ENV !== "development"
      ? [
        new winston.transports.File({ filename: "combined.log" }),
        new winston.transports.File({
          filename: "error.log",
          level: "error",
        }),
      ]
      : []),
  ],
});

export default logger;
