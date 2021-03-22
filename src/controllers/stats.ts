import { Response } from "express";
import logging from "../config/logging";
import { poll } from "../config/postgresql";
import RequestWithUser from "../interfaces/requestWithUser";

const NAMESPACE = "Tournament";

export const getUsersStats = async (req: RequestWithUser, res: Response) => {
  if (req.user) {
    const { user_id } = req.user;
    try {
      logging.info(NAMESPACE, "Getting users stats");
      const result = await poll.query(
        "SELECT * FROM users_stats WHERE user_id = $1",
        [user_id]
      );
      res.status(200).json(result.rows[0]);
    } catch (error) {
      logging.info(NAMESPACE, "User stats not found");
      res.status(404).json("not found!");
    }
  } else {
    logging.info(NAMESPACE, "Unauthorized request for users stats");
    res.status(401).json("unauthorized!");
  }
};

export default { getUsersStats };
