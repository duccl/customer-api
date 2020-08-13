import { Router } from './router'
import mongoose from 'mongoose'
import { Request, Response, Next } from 'restify'
import { NotFoundError } from 'restify-errors'

export abstract class ModelRouter<T extends mongoose.Document> extends Router {
    basePath: string;
    constructor(protected model: mongoose.Model<T>, protected fieldsToSelectAtGetById: string) {
        super()
        this.on('beforeRender', document => {
            document.password = 'encrypted'
        })
        this.basePath = `/${model.collection.name}`
    }

    envelopeAll(documents: mongoose.Document[], page: number, limit: number, totalPages: number,currentURL:string | undefined): any {
        const resource: any = {
            items: documents,
            _links: {
                self:currentURL,
                next: totalPages - (page * limit) > 0 ? `${this.basePath}?_page=${page + 1}` : "",
                previous: `${this.basePath}?_page=${page - 1 >= 1 ? page - 1 : 1}`,
            }
        }
        
        return resource
    }

    paginatorOptions = (req: Request) => {
        let { _page = 1, limit = 5 } = req.query
        _page = Number.parseInt(_page)
        limit = Number.parseInt(limit)
        return { _page, limit }
    }

    envelope(document: mongoose.Document): any {
        let resource = Object.assign({ _links: {} }, document.toJSON())
        resource._links.self = `${this.basePath}/${resource._id}`
        return resource
    }

    protected prepareOne(query: mongoose.DocumentQuery<T | null, T, {}>): mongoose.DocumentQuery<T | null, T, {}> {
        return query
    }

    validateId = (req: Request, resp: Response, next: Next) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            next(new NotFoundError("Not a valid ID"))
        }
        else {
            next()
        }
    }

    findAll = (req: Request, resp: Response, next: Next) => {
        const { _page, limit } = this.paginatorOptions(req)
        this.model.countDocuments()
            .exec()
            .then(totalDocumentsCount => {
                this.model.find()
                    .limit(limit)
                    .skip((_page - 1) * limit)
                    .then(this.renderAll(resp, next, _page, limit,totalDocumentsCount,req.url))
            })

            .catch(next)
    }

    findById = (req: Request, resp: Response, next: Next) => {
        this.prepareOne(this.model.findById(req.params['id'], this.fieldsToSelectAtGetById)).then(this.render(resp, next)).catch(next)
    }

    save = (req: Request, resp: Response, next: Next) => {
        let document = new this.model(req.body)
        document.save().then(this.render(resp, next)).catch(next)
    }

    replace = (req: Request, resp: Response, next: Next) => {
        const options = {
            overwrite: true,
            runValidators: true
        }
        this.model.update({ "_id": req.params['id'] }, req.body, options)
            .exec()
            .then(result => {
                if (result.n) {
                    return this.model.findById(req.params['id'])
                }
                throw new NotFoundError("Documento não encontrado!")
            })
            .then(this.render(resp, next))
            .catch(next)
        return next()
    }

    update = (req: Request, resp: Response, next: Next) => {
        const options = {
            new: true,
            runValidators: true
        }
        return this.model.findByIdAndUpdate({ "_id": req.params['id'] }, req.body, options)
            .then(this.render(resp, next))
            .catch(next)
    }

    delete = (req: Request, resp: Response, next: Next) => {
        this.model.deleteOne({ "_id": req.params['id'] })
            .exec()
            .then(queryResult => {
                if (queryResult.n) {
                    resp.send(204)
                    return next()
                }
                throw new NotFoundError("Documento não encontrado!")
            })
            .catch(err =>
                resp.send(500, err)
            )
        return next()
    }
}