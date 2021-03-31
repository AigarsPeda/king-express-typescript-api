import argon2 from "argon2";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import logging from "../config/logging";
import { poll } from "../config/postgresql";
import { validateUserCreateLogin } from "../helpers/validateUserCreateLogin";

const NAMESPACE = "Auth";

export const createUser = async (req: Request, res: Response) => {
  logging.info(NAMESPACE, "Inserting user");

  try {
    const {
      email,
      password,
      name,
      surname,
      terms
    }: {
      email: string;
      password: string;
      name: string;
      surname: string;
      terms: boolean;
    } = req.body;
    const created_on = new Date();

    /** Validating inputs */
    const { isValid, errorMessage } = validateUserCreateLogin({
      name: name,
      surname: surname,
      email: email,
      password: password,
      terms: terms
    });

    if (!isValid) {
      return res.status(400).json({ error: errorMessage });
    }

    /** Hashing password */
    const hashPassword = await argon2.hash(password.trim());

    /** Create table if it not already exists */
    await poll.query(
      `
        CREATE TABLE IF NOT EXISTS users (
          user_id serial PRIMARY KEY,
          name VARCHAR ( 50 ) NOT NULL,
          surname VARCHAR ( 50 ) NOT NULL,
          password VARCHAR ( 255 ) NOT NULL,
          email VARCHAR ( 255 ) UNIQUE NOT NULL,
          created_on TIMESTAMP NOT NULL,
          last_login TIMESTAMP,
          agree_to_terms BOOLEAN NOT NULL
        )
      `
    );

    /** Saving user to db and returning new user
     *  without password
     * to return it later with response
     */
    const newUser = await poll.query(
      ` INSERT INTO users (name, surname, email, password, created_on, last_login, agree_to_terms) 
        VALUES($1, $2, $3, $4, $5, $5, $6) 
        RETURNING name, surname, email, created_on, user_id
      `,
      [
        name.toLowerCase(),
        surname.toLowerCase(),
        email.toLowerCase(),
        hashPassword,
        created_on,
        terms
      ]
    );

    logging.info(NAMESPACE, "New user created");

    await poll.query(
      `
        CREATE TABLE IF NOT EXISTS users_stats (
          stats_id serial PRIMARY KEY,
          points_overall INTEGER NOT NULL DEFAULT 0,
          tournaments_played INTEGER NOT NULL DEFAULT 0,
          tournaments_won INTEGER NOT NULL DEFAULT 0,
          tournaments_lost INTEGER NOT NULL DEFAULT 0,
          tournaments_created INTEGER NOT NULL DEFAULT 0,
          user_id INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
      `
    );

    await poll.query(
      `insert into users_stats(user_id)
         values($1)
         returning *
        `,
      [newUser.rows[0].user_id]
    );

    /** Sign jsonwebtoken to save it in front
     * and identify user later
     * */
    const token = jwt.sign(
      {
        user: newUser.rows[0]
        /** One hour */
        // exp: Math.floor(Date.now() / 1000) + 60 * 60
      },
      process.env.SECRET_KEY!
    );

    /** Returning JWT token */
    return res.status(200).json({
      // user: newUser.rows[0],
      token: token
    });
  } catch (error) {
    logging.error(NAMESPACE, error.message, error);
    return res.json({ error: "email already taken" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  logging.info(NAMESPACE, "Logging in user");
  try {
    const { email, password }: { email: string; password: string } = req.body;

    /** Validating inputs */
    if (email.trim().length === 0 || password.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "not all necessary fields was provided" });
    }

    const emailPattern = new RegExp(
      /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i
    );

    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: "email isn't valid" });
    }

    /** Find user id DB with email */
    const loginUser = await poll.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase()
    ]);

    /** User not found */
    if (loginUser.rows[0] === undefined) {
      return res.status(400).json({ error: "user not found" });
    }

    /** Compare password entered and what is saved in db */
    if (await argon2.verify(loginUser.rows[0].password, password.trim())) {
      const last_login = new Date();

      /** Updating last login date to current date */
      const updatedClient = await poll.query(
        `UPDATE users SET last_login = $1 WHERE email = $2 
         RETURNING name, surname, email, created_on, user_id
        `,
        [last_login, email.toLowerCase()]
      );

      /** Sign jsonwebtoken to save it in front
       * and identify user later
       * */
      const token = jwt.sign(
        {
          user: updatedClient.rows[0]
          /** One hour */
          // exp: Math.floor(Date.now() / 1000) + 60 * 60
        },
        process.env.SECRET_KEY!
      );

      logging.info(NAMESPACE, "User login");

      /** Returning JWT token */
      return res.status(200).json({
        // user: updatedClient.rows[0],
        token: token
      });
    } else {
      /** Password did not match*/
      return res.status(401).json({ error: "wrong credentials" });
    }
  } catch (error) {
    logging.error(NAMESPACE, error.message, error);
    return res.status(503).json({ error: "service unavailable" });
  }
};

export default { createUser, loginUser };
