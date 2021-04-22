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

      // Add new tournament to table
      const gameCreatedOn = new Date();
      const createdTournament = await client.query(
        `insert into tournaments(tournament_creator_id, tournament_created_on)
           values($1, $2)
           returning *
          `,
        [user_id, gameCreatedOn]
      );

      playerArray.forEach(async (player) => {
        console.log(player);
        await client.query(
          `insert into players(tournament_id, in_tournament_id, name)
             values($1, $2, $3)
             returning *
            `,
          [
            createdTournament.rows[0].tournament_id,
            parseInt(player.id),
            player.playerName.toLowerCase()
          ]
        );
      });

      if (gameCreator && parseInt(gameCreator.id) === user_id) {
        logging.info(
          NAMESPACE,
          "Adding one to tournaments creator total count"
        );
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
