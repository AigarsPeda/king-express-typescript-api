import argon2 from "argon2";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import logging from "../config/logging";
import { poll } from "../config/postgresql";
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

      console.log("process.env.SECRET_KEY: ", process.env.SECRET_KEY);
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

export default { updateUser };
