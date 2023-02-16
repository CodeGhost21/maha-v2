export default class HttpError extends Error {
  status: number;
  constructor(message?: string) {
    super(message);
    this.status = 500;
  }
}
