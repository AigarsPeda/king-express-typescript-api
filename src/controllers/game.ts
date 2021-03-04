import { Response } from "express";
import logging from "../config/logging";
import { getClient } from "../config/postgresql";
import RequestWithUser from "../interfaces/requestWithUser";

const NAMESPACE = "Game";

const createGame = async (req: RequestWithUser, res: Response) => {
  if (req.user) {
    logging.info(NAMESPACE, "Creating game");

    const client = await getClient();
    if (!client) return res.status(503).json("no connection with db");
    try {
      await client.query("begin");
      const { name } = req.user;
      const { players } = req.body;

      console.log("users name: ", name);
      console.log("req.socket.remoteAddress:", req.socket.remoteAddress);
      // console.log("players: ", players);

      // deposit or withdraw
      // const total = total_balance + deposit_amount;
      // const transaction_date = new Date();
      // await client.query(
      //   `insert into transactions(transaction_date, deposit_amount, card_id, balance, deposit_description)
      //      values($1, $2, $3, $4, $5)
      //      returning *
      //     `,
      //   [transaction_date, deposit_amount, card_id, total, deposit_description]
      // );

      await client.query("commit");

      logging.info(NAMESPACE, "Game created");

      res.status(200).json("deposit successful!");
    } catch (error) {
      await client.query("rollback");
      logging.error(NAMESPACE, error.message, error);

      res.status(400).send({
        add_error: "Error while depositing amount..Try again later."
      });
    } finally {
      client.release();
    }
  }
};

export default { createGame };
