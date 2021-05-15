import { Response } from "express";
import logging from "../config/logging";
import { getClient, poll } from "../config/postgresql";
import RequestWithUser from "../interfaces/requestWithUser";
import { ITeam, ITeamDB } from "../types/team";

const NAMESPACE = "Game";

const saveGame = async (req: RequestWithUser, res: Response) => {
  if (req.user) {
    const client = await getClient();
    if (!client) return res.status(503).json("no connection with db");

    try {
      logging.info(NAMESPACE, "Saving game");
      await client.query("begin");

      const {
        teams,
        game_number,
        tournament_id
      }: {
        teams: ITeam[];
        game_number: number;
        tournament_id: number;
      } = req.body;

      /* Save teams data to database **/
      teams.forEach(async (player) => {
        await client.query(
          `insert into games(game_number, player_id, team_number, score, winner, tournament_id)
             values($1, $2, $3, $4, $5, $6)
             returning *
            `,
          [
            game_number,
            player.player_id,
            player.team_number,
            player.points,
            player.is_winner,
            tournament_id
          ]
        );
      });

      teams.forEach(async (player) => {
        await client.query(
          "UPDATE players SET points = points + $1, big_points = big_points + $2 WHERE player_id = $3 AND tournament_id = $4",
          [player.points, player.big_points, player.player_id, tournament_id]
        );
      });

      await client.query(
        `UPDATE tournaments SET tournament_current_game = $1 WHERE tournament_id = $2`,
        [game_number, tournament_id]
      );

      const result = await poll.query(
        "SELECT * FROM players WHERE tournament_id = $1",
        [tournament_id]
      );

      // console.log(result.rows);

      await client.query("commit");
      logging.info(NAMESPACE, "Game saved");

      /* If tournaments created return message **/
      // res.status(200).json("Game saved!");
      res.status(200).json(result.rows);
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

// const groupBy = function(xs, key) {
//   return xs.reduce(function(rv, x) {
//     (rv[x[key]] = rv[x[key]] || []).push(x);
//     return rv;
//   }, {});
// };

export const getTournamentGames = async (
  req: RequestWithUser,
  res: Response
) => {
  if (req.user) {
    const { user_id } = req.user;
    const { id } = req.params;

    const result = await poll.query(
      "SELECT tournament_creator_id FROM tournaments WHERE tournament_id = $1 ",
      [id]
    );

    /* If request maker isn't creator off tournament don't share it **/
    const tournamentsOwner: number = result.rows[0].tournament_creator_id;
    if (tournamentsOwner != user_id) res.status(401).json("unauthorized!");

    try {
      const result = await poll.query(
        "SELECT * FROM games WHERE tournament_id = $1",
        [id]
      );
      // res.status(200).json(result.rows);

      const teamsGroupedGameNumber: ITeamDB[][] = Object.values(
        result.rows.reduce((rv, team: ITeamDB) => {
          (rv[team.game_number] = rv[team.game_number] || []).push(team);
          return rv;
        }, {})
      );

      /* Accessing values in array **/
      // for (let i = 0; i < teamsGroupedGameNumber.length; i++) {
      //   const element = teamsGroupedGameNumber[i];
      //   for (let j = 0; j < element.length; j++) {
      //     const team = element[j];
      //     console.log(team.game_number);
      //   }
      // }

      // const grouped = Object.values(
      //   result.rows.reduce((r, team: ITeamDB) => {
      //     if (!r[team.game_number]) {
      //       r[team.game_number] = team;
      //       console.log(typeof r);
      //       return r;
      //     }
      //     if (!Array.isArray(r[team.game_number]))
      //       r[team.game_number] = [r[team.game_number]];
      //     r[team.game_number].push(team);
      //     console.log(r);
      //     return r;
      //   }, {})
      // );

      res.status(200).json(teamsGroupedGameNumber);
    } catch (error) {
      res.status(404).json("not found!");
    }
  } else {
    res.status(401).json("unauthorized!");
  }
};

export default { saveGame, getTournamentGames };
