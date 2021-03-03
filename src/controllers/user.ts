import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { poll } from "../config/postgresql";

const NAMESPACE = "User";

// const createBook = async (req: Request, res: Response, next: NextFunction) => {
//     logging.info(NAMESPACE, 'Inserting books');

//     let { author, title } = req.body;

//     let query = `INSERT INTO books (author, title) VALUES ("${author}", "${title}")`;

//     Connect()
//         .then((connection) => {
//             Query(connection, query)
//                 .then((result) => {
//                     logging.info(NAMESPACE, 'Book created: ', result);

//                     return res.status(200).json({
//                         result
//                     });
//                 })
//                 .catch((error) => {
//                     logging.error(NAMESPACE, error.message, error);

//                     return res.status(200).json({
//                         message: error.message,
//                         error
//                     });
//                 })
//                 .finally(() => {
//                     logging.info(NAMESPACE, 'Closing connection.');
//                     connection.end();
//                 });
//         })
//         .catch((error) => {
//             logging.error(NAMESPACE, error.message, error);

//             return res.status(200).json({
//                 message: error.message,
//                 error
//             });
//         });
// };

// const getAllBooks = async (req: Request, res: Response, next: NextFunction) => {
//     logging.info(NAMESPACE, 'Getting all books.');

//     let query = 'SELECT * FROM books';

//     Connect()
//         .then((connection) => {
//             Query(connection, query)
//                 .then((results) => {
//                     logging.info(NAMESPACE, 'Retrieved books: ', results);

//                     return res.status(200).json({
//                         results
//                     });
//                 })
//                 .catch((error) => {
//                     logging.error(NAMESPACE, error.message, error);

//                     return res.status(200).json({
//                         message: error.message,
//                         error
//                     });
//                 })
//                 .finally(() => {
//                     logging.info(NAMESPACE, 'Closing connection.');
//                     connection.end();
//                 });
//         })
//         .catch((error) => {
//             logging.error(NAMESPACE, error.message, error);

//             return res.status(200).json({
//                 message: error.message,
//                 error
//             });
//         });
// };

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, surname } = req.body;
    const created_on = new Date();

    // hash password
    const hashPassword = await argon2.hash(password);

    // cre table if its not already exists
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

    // sign jsonwebtoken to save it in front
    // and identify user later
    const token = jwt.sign({ user: newUser.rows[0] }, process.env.SECRET_KEY!);

    // returning user and token
    return res.status(200).json({
      user: newUser.rows[0],
      token: token
    });
  } catch (error) {
    console.error("SIGNUP ERROR: ", error.message);
    return res.json({ error: "user name or email already taken" });
  }
};

export default { createUser };
