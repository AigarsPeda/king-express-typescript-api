import { Response } from "express";
import logging from "../config/logging";
import { getClient, poll } from "../config/postgresql";
import RequestWithUser from "../interfaces/requestWithUser";
import { IPlayerArray } from "../types/playerArray";

const NAMESPACE = "Game";

const createGame = async (req: RequestWithUser, res: Response) => {
  if (req.user) {
    logging.info(NAMESPACE, "Creating game");

    const client = await getClient();
    if (!client) return res.status(503).json("no connection with db");
    try {
      await client.query("begin");
      const { user_id } = req.user;
      const { playerArray }: { playerArray: IPlayerArray } = req.body;

      // create table if it not already exists
      await poll.query(
        `
          CREATE TABLE IF NOT EXISTS games (
            game_id serial PRIMARY KEY,
            game_creator_id INTEGER NOT NULL,
            game_created_on TIMESTAMP NOT NULL,
            game_ended_on TIMESTAMP,
            player_array JSONB,
            FOREIGN KEY (game_creator_id) REFERENCES users (user_id)
          )
        `
      );

      // deposit or withdraw
      // const total = total_balance + deposit_amount;
      const gameCreatedOn = new Date();
      await client.query(
        `insert into games(game_creator_id, game_created_on, player_array)
           values($1, $2, $3)
           returning *
          `,
        // JSON.stringify(playerArray) to save array of json objects
        // to DB if not stringify before it saves weird
        [user_id, gameCreatedOn, JSON.stringify(playerArray)]
      );

      // find games creator
      const gameCreator = playerArray.find((player) => {
        return player.gameCreator === true;
      });

      logging.info(NAMESPACE, "Adding one to games creator total count");

      // if game creator plays add to played games count
      // otherwise don't
      if (gameCreator) {
        logging.info(
          NAMESPACE,
          "Adding one to games creator total count and to the point overall"
        );
        await client.query(
          "UPDATE users_stats SET games_created = games_created + 1, games_played = games_played + 1, point_overall = point_overall + $2  WHERE user_id = $1",
          [user_id, gameCreator.score]
        );
      } else {
        logging.info(NAMESPACE, "Adding one to games creator total count");
        await client.query(
          "UPDATE users_stats SET games_created = games_created + 1 WHERE user_id = $1",
          [user_id]
        );
      }

      await client.query("commit");

      logging.info(NAMESPACE, "Game created");

      res.status(200).json("Game created successful!");
    } catch (error) {
      await client.query("rollback");
      logging.error(NAMESPACE, error.message, error);

      res.status(400).send({
        error: "Error while creating game... Try again later."
      });
    } finally {
      client.release();
    }
  }
};

export const getAllGames = async (req: RequestWithUser, res: Response) => {
  if (req.user) {
    const { user_id } = req.user;
    try {
      const result = await poll.query(
        "SELECT * FROM games WHERE game_creator_id = $1",
        [user_id]
      );
      res.status(200).json(result.rows);
    } catch (error) {
      res.status(404).json("not found!");
    }
  } else {
    res.status(401).json("unauthorized!");
  }
};

export default { createGame, getAllGames };
