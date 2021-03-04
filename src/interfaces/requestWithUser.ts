import { Request } from "express";
import IUser from "./user";

export default interface RequestWithUser extends Request {
  user?: IUser;
}
