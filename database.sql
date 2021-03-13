CREATE DATABASE kingdb;

CREATE TABLE IF NOT EXISTS users (
  user_id serial PRIMARY KEY,
  name VARCHAR ( 50 ) NOT NULL,
  surname VARCHAR ( 50 ) NOT NULL,
  password VARCHAR ( 255 ) NOT NULL,
  email VARCHAR ( 255 ) UNIQUE NOT NULL,
  created_on TIMESTAMP NOT NULL,
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users_stats (
  stats_id serial PRIMARY KEY,
  point_overall INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  games_lost INTEGER NOT NULL DEFAULT 0,
  games_created INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);


CREATE TABLE IF NOT EXISTS games (
  game_id serial PRIMARY KEY,
  game_creator_id INTEGER NOT NULL,
  game_created_on TIMESTAMP NOT NULL,
  game_ended_on TIMESTAMP,
  player_array JSONB,
  FOREIGN KEY (game_creator_id) REFERENCES users (user_id)
);