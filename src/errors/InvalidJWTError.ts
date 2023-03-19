import HttpError from "./HttpError";

export default class InvalidJWTError extends HttpError {
  constructor(msg?: string) {
    super(msg || "Bad JWT");
    this.status = 403;
  }
}
