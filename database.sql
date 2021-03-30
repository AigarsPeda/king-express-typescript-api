CREATE DATABASE kingdb;

CREATE TABLE IF NOT EXISTS users (
  user_id serial PRIMARY KEY,
  name VARCHAR ( 50 ) NOT NULL,
  surname VARCHAR ( 50 ) NOT NULL,
  password VARCHAR ( 255 ) NOT NULL,
  email VARCHAR ( 255 ) UNIQUE NOT NULL,
  created_on TIMESTAMP NOT NULL,
  last_login TIMESTAMP,
  agree_to_terms BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS users_stats (
  stats_id serial PRIMARY KEY,
  points_overall INTEGER NOT NULL DEFAULT 0,
  tournaments_played INTEGER NOT NULL DEFAULT 0,
  tournaments_won INTEGER NOT NULL DEFAULT 0,
  tournaments_lost INTEGER NOT NULL DEFAULT 0,
  tournaments_created INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id)
)


CREATE TABLE IF NOT EXISTS tournaments (
  tournament_id serial PRIMARY KEY,
  tournament_creator_id INTEGER NOT NULL,
  tournament_created_on TIMESTAMP NOT NULL,
  tournament_ended_on TIMESTAMP,
  player_array JSONB,
  FOREIGN KEY (tournament_creator_id) REFERENCES users (user_id)
)