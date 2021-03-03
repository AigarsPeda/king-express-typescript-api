import pg from "pg";
import config from "./config";

const params = {
  user: config.postgresql.user,
  password: config.postgresql.password,
  host: config.postgresql.host,
  database: config.postgresql.database
  // port: config.postgresql.port
};

const Poll = pg.Pool;

// if there are user with password you should add it here
const poll = new Poll(params);

const getClient = async () => {
  try {
    const client = await poll.connect();
    return client;
  } catch (error) {
    return null;
  }
};

export { poll, getClient };
