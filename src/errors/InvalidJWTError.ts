import HttpError from "./HttpError";

export default class InvalidJWTError extends HttpError {
  constructor() {
    super("Bad JWT");
    this.status = 403;
  }
}
