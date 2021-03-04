import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import IUser from "../interfaces/user";
import RequestWithUser from "../interfaces/requestWithUser";

export const authMiddleware = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  // get auth header value
  const bearerHeader = req.headers["authorization"];

  if (
    typeof bearerHeader !== "undefined" &&
    bearerHeader.startsWith("Bearer ")
  ) {
    // split at the space
    const bearerToken = bearerHeader.split(" ");
    // get token from array
    const token = bearerToken[1];
    try {
      const { user } = jwt.verify(token, process.env.SECRET_KEY!) as {
        user: IUser;
      };

      req.user = user;
      return next();
    } catch (error) {
      console.log("JWT ERROR: ", error.message);
      return res.status(401).json({ error: "unauthorized!" });
    }
  } else {
    return res.status(401).json({ error: "unauthorized!" });
  }
};
