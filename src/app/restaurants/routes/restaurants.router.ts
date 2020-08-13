import { ModelRouter } from '../../common/model-router'
import { RestaurantDTO } from '../models/restaurants.model'
import { IRestaurant } from '../models/restaurants.model.schema'
import { Server, Next, Response, Request } from 'restify'
import { environment } from '../../common/environment'
import {Document} from 'mongoose'
class RestaurantRouter extends ModelRouter<IRestaurant>{
    constructor() {
        super(RestaurantDTO, environment.db.restaurants.projection)
    }


    envelope(document:Document):any{
        let resource = super.envelope(document)
        resource._links.menu = `${this.basePath}/${resource._id}/menu`
        return resource
    }


    findRestaurantMenuOption = (req: Request, res: Response, next: Next) => {
        const { id, menuID } = req.params
        this.model.find({ _id: id }, { menu: { $elemMatch: { _id: menuID } } })
            .then(this.render(res, next))
            .catch(next)

    }

    findAllMenus = (req: Request, res: Response, next: Next) => {
        const { id } = req.params
        const { _page, limit } = this.paginatorOptions(req)
        this.model.findById(id, 'menu')
            .limit(limit)
            .skip((_page - 1) * limit)
            .then(this.render(res,next))
            .catch(next)

    }

    applyRoutes(application: Server) {
        application.post(`${this.basePath}`, this.save)
        application.get(`${this.basePath}`, this.findAll)
        application.del(`${this.basePath}/:id`, [this.validateId, this.delete])
        application.get(`${this.basePath}/:id`, [this.validateId, this.findById])
        application.put(`${this.basePath}/:id`, [this.validateId, this.replace])
        application.patch(`${this.basePath}/:id`, [this.validateId, this.update])
        application.get(`${this.basePath}/:id/menu`, [this.validateId, this.findAllMenus])
        application.get(`${this.basePath}/:id/menu/:menuID`, [this.validateId, this.findRestaurantMenuOption])
    }
}

export const restaurantRouter = new RestaurantRouter()