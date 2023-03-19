import HttpError from "./HttpError";

export default class NotFoundError extends HttpError {
  constructor(message?: string) {
    super(message || "Not Found");
    this.status = 404;
  }
}
