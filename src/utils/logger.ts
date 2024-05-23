import winston from "winston";

const enumerateErrorFormat = winston.format(
  (
    info: winston.Logform.TransformableInfo
  ): winston.Logform.TransformableInfo => {
    if (info instanceof Error) {
      Object.assign(info, { message: info.stack });
    }
    return info;
  }
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    enumerateErrorFormat(),
    winston.format.colorize(),
    winston.format.splat(),
    winston.format.printf(
      ({ level, message }): string => `${level}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});

export default logger;
