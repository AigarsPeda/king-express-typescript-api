import { Response } from "express";
import logging from "../config/logging";
import { getClient, poll } from "../config/postgresql";
import RequestWithUser from "../interfaces/requestWithUser";
import { IPlayerArray } from "../types/playerArray";

const NAMESPACE = "Tournament";

const createTournaments = async (req: RequestWithUser, res: Response) => {
  if (req.user) {
    logging.info(NAMESPACE, "Creating Tournament");

    const client = await getClient();
    if (!client) return res.status(503).json("no connection with db");

    try {
      await client.query("begin");
      const { user_id } = req.user;
      const {
        playerArray,
        gameCreator
      }: { playerArray: IPlayerArray; gameCreator?: { id: number } } = req.body;

      /* Add new tournament to table **/
      const tournamentCreatedOn = new Date();
      const createdTournament = await client.query(
        `insert into tournaments(tournament_creator_id, tournament_created_on)
           values($1, $2)
           returning *
        `,
        [user_id, tournamentCreatedOn]
      );

      /* Save all players to database **/
      playerArray.forEach(async (player) => {
        await client.query(
          `insert into players(tournament_id, in_tournament_id, name)
             values($1, $2, $3)
             returning *
            `,
          [
            createdTournament.rows[0].tournament_id,
            player.inTournamentId,
            player.playerName.toLowerCase()
          ]
        );
      });

      if (gameCreator && gameCreator.id === user_id) {
        /* Account owner will play **/
        logging.info(
          NAMESPACE,
          "Adding one to tournaments and created tournaments in creator total count"
        );

        await client.query(
          "UPDATE users_stats SET tournaments_created = tournaments_created + 1, tournaments_played = tournaments_played + 1 WHERE user_id = $1",
          [user_id]
        );
      } else {
        /* Account owner won't play **/
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

      /* If tournaments created return its ID **/
      res.status(200).json({
        tournamentId: createdTournament.rows[0].tournament_id
      });
    } catch (error) {
      logging.error(NAMESPACE, error.message, error);
      await client.query("rollback");

      res.status(400).send({
        error: "Error while creating Tournament... Try again later."
      });
    } finally {
      client.release();
    }
  }
};

export const finishTournament = async (req: RequestWithUser, res: Response) => {
  if (req.user) {
    const { user_id, name } = req.user;
    const {
      playerArray,
      tournamentId,
      gameCreator
    }: {
      playerArray: IPlayerArray;
      tournamentId: number;
      gameCreator?: { id: number };
    } = req.body;
    const client = await getClient();
    if (!client) return res.status(503).json("no connection with db");
    try {
      const tournament = await client.query(
        "SELECT * FROM tournaments WHERE tournament_id = $1",
        [tournamentId]
      );

      playerArray.forEach(async (player) => {
        await client.query(
          `
            UPDATE players SET points = $1, is_winner = $2 WHERE tournament_id = $3 AND in_tournament_id = $4
            RETURNING *
          `,
          [
            player.score,
            player.winner,
            tournament.rows[0].tournament_id,
            player.inTournamentId
          ]
        );
      });

      const tournamentEndedOn = new Date();
      const tournamentWinner = playerArray.find((player) => {
        return player.winner === true;
      });
      await client.query(
        `
          UPDATE tournaments SET tournament_winner = $1, tournament_ended_on = $2 WHERE tournament_id = $3
          RETURNING *
        `,
        [
          tournamentWinner?.inTournamentId,
          tournamentEndedOn,
          tournament.rows[0].tournament_id
        ]
      );

      if (gameCreator && gameCreator.id === user_id) {
        const foundGameCreatorInPlyerArray = playerArray.find((player) => {
          return player.playerName.toLowerCase() === name;
        });

        if (foundGameCreatorInPlyerArray) {
          if (foundGameCreatorInPlyerArray.winner === true) {
            // Tournaments creator won
            logging.info(NAMESPACE, "Updating users tournaments won");

            await client.query(
              "UPDATE users_stats SET tournaments_won = tournaments_won + 1, tournaments_played = tournaments_played + 1, points_overall = points_overall + $2  WHERE user_id = $1",
              [user_id, foundGameCreatorInPlyerArray.score]
            );
          } else {
            // Tournaments creator lost
            logging.info(NAMESPACE, "Updating users tournaments lost");

            await client.query(
              "UPDATE users_stats SET tournaments_lost = tournaments_lost + 1 tournaments_played = tournaments_played + 1, points_overall = points_overall + $2  WHERE user_id = $1",
              [user_id, foundGameCreatorInPlyerArray.score]
            );
          }
        } else {
          // Didn't found creator in player array
          res.status(400).send({
            error: "Couldn't find creator in player array"
          });
        }
      }

      // TODO: update winner states HERE not when crating tournament

      await client.query("commit");
      res.status(200).json(tournament.rows);
    } catch (error) {
      await client.query("rollback");
      res.status(404).json("not found!");
    } finally {
      client.release();
    }
  } else {
    res.status(401).json("unauthorized!");
  }
};

export const getAllTournaments = async (
  req: RequestWithUser,
  res: Response
) => {
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

export default { createTournaments, finishTournament, getAllTournaments };
