import NotAuthorizedError from '../errors/NotAuthorizedError'


export default (request: any, _response: any, next: any) => {
    if (!request.user) return next(new NotAuthorizedError())
    next()
}