import { ModelRouter } from '../../common/model-router';
import * as restify from 'restify';
import { UserDTO } from '../models/users.model'
import { IUser, IUserDTO } from '../models/users.model.schema';
import { environment } from '../../common/environment';
class UsersRouter extends ModelRouter<IUser> {
    constructor() {
        super(UserDTO, environment.db.users.projection)
    }

    findByEmail = (req: restify.Request, resp: restify.Response, next: restify.Next) => {
        const { email } = req.query
        let { _page, limit } = this.paginatorOptions(req)
        if (email) {
            const model = (<IUserDTO>this.model)
            model.countDocuments()
                .exec()
                .then(totalPageCount => {
                    model.findByEmail(email)
                        .then(users => [users])
                        .then(this.renderAll(resp, next, _page, limit, totalPageCount, req.url))
                        .catch(next)
                })
                .catch(next)
        }
        else {
            next()
        }
    }

    applyRoutes(application: restify.Server) {
        application.get(`${this.basePath}`, [this.findByEmail, this.findAll])
        application.get(`${this.basePath}/:id`, [this.validateId, this.findById])
        application.post(`${this.basePath}`, this.save)
        application.put(`${this.basePath}/:id`, [this.validateId, this.replace])
        application.patch(`${this.basePath}/:id`, [this.validateId, this.update])
        application.del(`${this.basePath}/:id`, [this.validateId, this.delete])
    }
}

export const usersRouter = new UsersRouter()