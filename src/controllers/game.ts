import { Response } from "express";
import logging from "../config/logging";
import { getClient } from "../config/postgresql";
import RequestWithUser from "../interfaces/requestWithUser";
import { ITeam } from "../types/team";

const NAMESPACE = "Game";

const saveGame = async (req: RequestWithUser, res: Response) => {
  if (req.user) {
    logging.info(NAMESPACE, "Saving game");

    const client = await getClient();
    if (!client) return res.status(503).json("no connection with db");

    try {
      await client.query("begin");

      const {
        team1,
        team2,
        gameNumber,
        tournamentId
      }: {
        team1: ITeam;
        team2: ITeam;
        gameNumber: number;
        tournamentId: number;
      } = req.body;

      // TODO: add game winner
      // TODO: convert team obj to teams obj array

      /* Save first team to database **/
      await client.query(
        `insert into teams(game_number, player_1, player_2, team, score, tournament_id)
           values($1, $2, $3, $4, $5, $6)
           returning *
          `,
        [
          gameNumber,
          team1.firstPlayer,
          team1.secondPlayer,
          team1.team,
          team1.score,
          tournamentId
        ]
      );

      /* Save second team to database **/
      await client.query(
        `insert into teams(game_number, player_1, player_2, team, score, tournament_id)
          values($1, $2, $3, $4, $5, $6)
          returning *
        `,
        [
          gameNumber,
          team2.firstPlayer,
          team2.secondPlayer,
          team2.team,
          team2.score,
          tournamentId
        ]
      );

      await client.query("commit");
      logging.info(NAMESPACE, "Game saved");

      /* If tournaments created return message **/
      res.status(200).json("Game saved!");
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

export default { saveGame };
