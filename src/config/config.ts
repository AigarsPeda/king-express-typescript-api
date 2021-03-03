import dotenv from "dotenv";

dotenv.config();

const POSTGRESQL_HOST = process.env.POSTGRESQL_HOST || "localhost";
const POSTGRESQL_DATABASE = process.env.POSTGRESQL_DATABASE || "kingdb";
const POSTGRESQL_PORT = process.env.POSTGRESQL_PORT || 5432;
const POSTGRESQL_USER = process.env.POSTGRESQL_USER || "";
const POSTGRESQL_PASSWORD = process.env.POSTGRESQL_PASS || "";

const POSTGRESQL = {
  host: POSTGRESQL_HOST,
  database: POSTGRESQL_DATABASE,
  user: POSTGRESQL_USER,
  password: POSTGRESQL_PASSWORD,
  port: POSTGRESQL_PORT
};

const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || "localhost";
const SERVER_PORT = process.env.SERVER_PORT || 8000;

const SERVER = {
  hostname: SERVER_HOSTNAME,
  port: SERVER_PORT
};

const config = {
  postgresql: POSTGRESQL,
  server: SERVER
};

export default config;
