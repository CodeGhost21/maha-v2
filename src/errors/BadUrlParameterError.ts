import BadRequestError from "./BadRequestError";

export default class BadUrlParameterError extends BadRequestError {
  constructor() {
    super("Bad URL Parameter");
  }
}
