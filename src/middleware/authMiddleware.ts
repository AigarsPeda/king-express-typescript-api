import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import IUser from "../interfaces/user";
import RequestWithUser from "../interfaces/requestWithUser";

export const authMiddleware = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  /** get auth header value */
  // const bearerHeader = req.headers["authorization"];

  /** Get vale from cookies */
  const bearerCookie = req.cookies.access_token;

  if (
    typeof bearerCookie !== "undefined" &&
    bearerCookie.startsWith("Bearer ")
  ) {
    /** Split at the space */
    const bearerToken = bearerCookie.split(" ");

    /** Get token from array */
    const token = bearerToken[1];

    /** Verified token */
    try {
      const { user } = jwt.verify(token, process.env.SECRET_KEY!) as {
        user: IUser;
      };

      /** Adding user to request add passing it forwards */
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
