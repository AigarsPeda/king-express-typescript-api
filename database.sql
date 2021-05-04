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
);

CREATE TABLE IF NOT EXISTS players (
  player_id serial PRIMARY KEY,
  name VARCHAR ( 50 ) NOT NULL,
  in_tournament_id INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  big_points INTEGER NOT NULL DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  tournament_id INTEGER NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments (tournament_id)
)

CREATE TABLE IF NOT EXISTS tournaments (
  tournament_id serial PRIMARY KEY,
  tournament_creator_id INTEGER NOT NULL,
  tournament_created_on TIMESTAMP NOT NULL,
  tournament_winner INTEGER,
  tournament_ended_on TIMESTAMP,
  tournament_location INTEGER,
  FOREIGN KEY (tournament_creator_id) REFERENCES users (user_id)
)

CREATE TABLE IF NOT EXISTS games (
  team_id serial PRIMARY KEY,
  game_number INTEGER NOT NULL,
  player_1 VARCHAR ( 50 ) NOT NULL,
  player_2 VARCHAR ( 50 ) NOT NULL,
  team INTEGER NOT NULL,
  score INTEGER NOT NULL,
  winner BOOLEAN NOT NULL,
  tournament_id INTEGER NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments (tournament_id)
)

-- CREATE TABLE IF NOT EXISTS teams (
--   team_id serial PRIMARY KEY,
--   player_1_id INTEGER NOT NULL,
--   player_2_id INTEGER NOT NULL,
--   team INTEGER NOT NULL,
--   score INTEGER NOT NULL,
--   tournament_id INTEGER NOT NULL,
--   FOREIGN KEY (tournament_id) REFERENCES tournaments (tournament_id)
-- )
