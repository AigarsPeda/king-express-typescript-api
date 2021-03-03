import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { poll } from "../config/postgresql";
import logging from "../config/logging";

const NAMESPACE = "User";

export const createUser = async (req: Request, res: Response) => {
  logging.info(NAMESPACE, "Inserting user");

  try {
    const { email, password, name, surname } = req.body;
    const created_on = new Date();

    // hash password
    const hashPassword = await argon2.hash(password);

    // create table if it not already exists
    await poll.query(
      `
        CREATE TABLE IF NOT EXISTS users (
        user_id serial PRIMARY KEY,
        name VARCHAR ( 50 ) NOT NULL,
        surname VARCHAR ( 50 ) NOT NULL,
        password VARCHAR ( 255 ) NOT NULL,
        email VARCHAR ( 255 ) UNIQUE NOT NULL,
        created_on TIMESTAMP NOT NULL,
        last_login TIMESTAMP )
      `
    );

    // saving user to db and returning new user
    // without password to return it later
    // with response
    const newUser = await poll.query(
      ` INSERT INTO users (name, surname, email, password, created_on, last_login) 
        VALUES($1, $2, $3, $4, $5, $5) 
        RETURNING name, surname, email, created_on, user_id
      `,
      [
        name.toLowerCase(),
        surname.toLowerCase(),
        email.toLowerCase(),
        hashPassword,
        created_on
      ]
    );

    logging.info(NAMESPACE, "User created: ", newUser.rows[0]);

    // sign jsonwebtoken to save it in front
    // and identify user later
    const token = jwt.sign({ user: newUser.rows[0] }, process.env.SECRET_KEY!);

    // returning user and token
    return res.status(200).json({
      user: newUser.rows[0],
      token: token
    });
  } catch (error) {
    logging.error(NAMESPACE, error.message, error);
    // console.error("SIGNUP ERROR: ", error.message);
    return res.json({ error: "user name or email already taken" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  logging.info(NAMESPACE, "Logging in user");
  try {
    const { email, password } = req.body;

    // find user id DB with email
    const loginUser = await poll.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase()
    ]);

    // user not found
    if (!loginUser.rows[0]) {
      return res.status(400).json({ error: "user not found" });
    }

    // check password
    // compare password entered and what is saved in db
    if (await argon2.verify(loginUser.rows[0].password, password)) {
      const last_login = new Date();

      // updating to save login date
      const updatedClient = await poll.query(
        `UPDATE users SET last_login = $1 WHERE email = $2 
         RETURNING name, surname, email, created_on, user_id
        `,
        [last_login, email.toLowerCase()]
      );

      // sign jsonwebtoken to save it in front
      // end identify user later
      const token = jwt.sign(
        { user: updatedClient.rows[0] },
        process.env.SECRET_KEY!
      );

      // delete password from user so it
      // would not be in response
      // delete loginUser.rows[0].password;

      logging.info(NAMESPACE, "User login: ", updatedClient.rows[0]);

      // return token and found user
      return res.status(200).json({
        user: updatedClient.rows[0],
        token: token
      });
    } else {
      // password did not match
      return res.status(401).json({ error: "wrong credentials" });
    }
  } catch (error) {
    logging.error(NAMESPACE, error.message, error);
    // console.error("LOGIN ERROR: ", error.message);
    return res.status(503).json({ error: "service unavailable" });
  }
};

export default { createUser, loginUser };
