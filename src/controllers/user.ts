import argon2 from "argon2";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import logging from "../config/logging";
import { getClient, poll } from "../config/postgresql";
import RequestWithUser from "../interfaces/requestWithUser";

const NAMESPACE = "User";

export const updateUser = async (req: RequestWithUser, res: Response) => {
  logging.info(NAMESPACE, "Updating user");
  if (req.user) {
    try {
      const { user_id } = req.user;
      const { name, surname, email, password } = req.body;

      const updateUser = await poll.query(
        `
          UPDATE users SET 
            name = $1,
            surname = $2, 
            email = $3, 
            password = $4
          WHERE user_id = $5
          RETURNING name, surname, email, created_on, user_id
        `,
        [name, surname, email, password, user_id]
      );

      logging.info(NAMESPACE, "User updated: ", updateUser.rows[0]);

      // sign jsonwebtoken to save it in front
      // and identify user later
      const token = jwt.sign(
        { user: updateUser.rows[0] },
        process.env.SECRET_KEY!
      );

      return res.status(200).json({
        user: updateUser.rows[0],
        token: token
      });
    } catch (error) {
      logging.error(NAMESPACE, error.message, error);
      return res.status(503).json({ error: "service unavailable" });
    }
  } else {
    res.status(401).json("unauthorized!");
  }
};

export const deleteUser = async (req: RequestWithUser, res: Response) => {
  logging.info(NAMESPACE, "Delete user");
  if (req.user) {
    try {
      const client = await getClient();
      if (!client) return res.status(503).json("no connection with db");

      const { user_id } = req.user;
      const { user_id_param } = req.params;

      if (user_id === parseInt(user_id_param)) {
        await client.query("begin");
        // all user-related data must be deleted first
        // and only then user
        await client.query(
          `
            DELETE FROM games
            WHERE game_creator_id = $1;
            `,
          [user_id]
        );

        await client.query(
          `
            DELETE FROM users_stats
            WHERE user_id = $1;
            `,
          [user_id]
        );

        await client.query(
          `
            DELETE FROM users
            WHERE user_id = $1;
            `,
          [user_id]
        );

        await client.query("commit");

        logging.info(NAMESPACE, "User deleted");
        res.status(200).json("User deleted");
      } else {
        res.status(401).json("Unauthorized!");
      }
    } catch (error) {
      logging.error(NAMESPACE, error.message, error);
      return res.status(503).json({ error: "service unavailable" });
    }
  } else {
    res.status(401).json("Unauthorized!");
  }
};

export default { updateUser, deleteUser };
