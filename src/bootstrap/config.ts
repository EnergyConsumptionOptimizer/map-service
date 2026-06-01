import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGODB_HOST: z.string().default("localhost"),
  MONGODB_PORT: z.coerce.number().default(27017),
  MONGO_DB: z.string().default("map-service"),
  HOOKUP_SERVICE_HOST: z.string().default("hookup-service"),
  HOOKUP_SERVICE_PORT: z.coerce.number().default(3000),
  KAFKA_CLIENT_ID: z.string().default("map-service"),
  KAFKA_BOOTSTRAP_SERVERS: z.string().default("kafka:9092"),
  KAFKA_GROUP_ID: z.string().default("map-service-group"),
  KAFKA_TOPIC_HOOKUP: z.string().default("hookup-events"),
  KAFKA_TOPIC_DLQ: z.string().default("map-dlq"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NAME: z.string().default("map-service"),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment configuration:",
    JSON.stringify(result.error.issues, null, 2),
  );
  process.exit(1);
}

const env = result.data;

export const config = {
  port: env.PORT,
  mongo: {
    uri: `mongodb://${env.MONGODB_HOST}:${env.MONGODB_PORT}/${env.MONGO_DB}`,
  },
  kafka: {
    clientId: env.KAFKA_CLIENT_ID,
    brokers: env.KAFKA_BOOTSTRAP_SERVERS.split(","),
    groupId: env.KAFKA_GROUP_ID,
    topics: {
      hookup: env.KAFKA_TOPIC_HOOKUP,
      forecastsDlq: env.KAFKA_TOPIC_DLQ,
    },
  },
  hookupServiceUrl: `http://${env.HOOKUP_SERVICE_HOST}:${env.HOOKUP_SERVICE_PORT}`,
  logLevel: env.LOG_LEVEL,
  appName: env.NAME,
} as const;

export type Config = typeof config;
