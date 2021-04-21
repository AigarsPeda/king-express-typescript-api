import { Response } from "express";
import logging from "../config/logging";
import { getClient, poll } from "../config/postgresql";
import RequestWithUser from "../interfaces/requestWithUser";
import { IPlayerArray } from "../types/playerArray";

const NAMESPACE = "Tournament";

const createGame = async (req: RequestWithUser, res: Response) => {
  if (req.user) {
    logging.info(NAMESPACE, "Creating Tournament");

    const client = await getClient();
    if (!client) return res.status(503).json("no connection with db");
    try {
      await client.query("begin");
      const { user_id, name } = req.user;
      const {
        playerArray,
        gameCreator
      }: { playerArray: IPlayerArray; gameCreator?: { id: string } } = req.body;

      // Create table if it not already exists
      await poll.query(
        `
          CREATE TABLE IF NOT EXISTS tournaments (
            tournament_id serial PRIMARY KEY,
            tournament_creator_id INTEGER NOT NULL,
            tournament_created_on TIMESTAMP NOT NULL,
            tournament_ended_on TIMESTAMP,
            player_array JSONB,
            FOREIGN KEY (tournament_creator_id) REFERENCES users (user_id)
          )
        `
      );

      // Add new tournament to table
      const gameCreatedOn = new Date();
      await client.query(
        `insert into tournaments(tournament_creator_id, tournament_created_on, player_array)
           values($1, $2, $3)
           returning *
          `,
        // JSON.stringify(playerArray) to save array of json objects
        // to DB if not stringify before it saves weird
        [user_id, gameCreatedOn, JSON.stringify(playerArray)]
      );

      // Find games creator
      const foundGameCreatorInPlyerArray = playerArray.find((player) => {
        return player.playerName.toLowerCase() === name;
      });

      logging.info(NAMESPACE, "Adding one to tournaments creator total count");

      // If game creator plays add one to played games count
      // otherwise don't
      // if (
      //   gameCreator &&
      //   parseInt(gameCreator.id) === user_id &&
      //   foundGameCreatorInPlyerArray &&
      //   foundGameCreatorInPlyerArray.playerName.toLocaleLowerCase() === name
      // ) {
      //   logging.info(
      //     NAMESPACE,
      //     "Adding one to tournaments creator total count and to the point overall"
      //   );

      //   await client.query(
      //     "UPDATE users_stats SET tournaments_created = tournaments_created + 1, tournaments_played = tournaments_played + 1, points_overall = points_overall + $2  WHERE user_id = $1",
      //     [user_id, foundGameCreatorInPlyerArray.score]
      //   );
      // } else {
      //   logging.info(
      //     NAMESPACE,
      //     "Adding one to tournaments creator total count"
      //   );
      //   await client.query(
      //     "UPDATE users_stats SET tournaments_created = tournaments_created + 1 WHERE user_id = $1",
      //     [user_id]
      //   );
      // }

      if (gameCreator && parseInt(gameCreator.id) === user_id) {
        const foundGameCreatorInPlyerArray = playerArray.find((player) => {
          return player.playerName.toLowerCase() === name;
        });

        if (foundGameCreatorInPlyerArray) {
          logging.info(
            NAMESPACE,
            "Adding one to tournaments creator total count and to the point overall"
          );
          await client.query(
            "UPDATE users_stats SET tournaments_created = tournaments_created + 1, tournaments_played = tournaments_played + 1, points_overall = points_overall + $2  WHERE user_id = $1",
            [user_id, foundGameCreatorInPlyerArray.score]
          );

          if (foundGameCreatorInPlyerArray.winner === true) {
            // Tournaments creator won
            logging.info(NAMESPACE, "Updating users tournaments won");

            await client.query(
              "UPDATE users_stats SET tournaments_won = tournaments_won + 1 WHERE user_id = $1",
              [user_id]
            );
          } else {
            // Tournaments creator lost
            logging.info(NAMESPACE, "Updating users tournaments lost");
            await client.query(
              "UPDATE users_stats SET tournaments_lost = tournaments_lost + 1 WHERE user_id = $1",
              [user_id]
            );
          }
        } else {
          // Didn't found creator in player array
          res.status(400).send({
            error: "Couldn't find creator in player array"
          });
        }
      } else {
        // Account owner didn't play
        logging.info(
          NAMESPACE,
          "Adding one to tournaments creator total count"
        );
        await client.query(
          "UPDATE users_stats SET tournaments_created = tournaments_created + 1 WHERE user_id = $1",
          [user_id]
        );
      }

      await client.query("commit");

      logging.info(NAMESPACE, "Tournament created");

      res.status(200).json("Tournament created successful!");
    } catch (error) {
      await client.query("rollback");
      logging.error(NAMESPACE, error.message, error);

      res.status(400).send({
        error: "Error while creating Tournament... Try again later."
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
        "SELECT * FROM tournaments WHERE tournament_creator_id = $1",
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
