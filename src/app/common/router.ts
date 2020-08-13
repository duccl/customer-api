import * as restify from 'restify'
import { EventEmitter } from 'events';
import { NotFoundError } from 'restify-errors';
import { Document } from 'mongoose'
export abstract class Router extends EventEmitter {
    abstract applyRoutes(application: restify.Server): any

    envelope(document: Document): any {
        return document
    }

    envelopeAll(documents: Document[],page: number, limit: number, totalPages: any,currentURL:string | undefined): any {
        return documents
    }

    render(response: restify.Response, next: restify.Next) {
        return (document: any) => {
            if (document) {
                this.emit('beforeRender', document)
                response.statusCode = 200;
                response.json(document)
            }
            else {
                throw new NotFoundError("Documento não encontrado!")
            }
            return next()
        }
    }

    renderAll(response: restify.Response, next: restify.Next,page: number, limit: number, totalPages: number,currentURL:string | undefined) {
        return (documents: any[]) => {
            if (documents) {
                documents.forEach((document, index, array) => {
                    this.emit('beforeRender', document)
                    array[index] = this.envelope(document)
                });
                response.statusCode = 200;
                response.json({
                    "documents": this.envelopeAll(documents,page,limit,totalPages,currentURL),
                    page,
                    limit,
                    totalPages
                })
                .catch(next)
            }
            else {
                response.json(this.envelopeAll([],page,limit,totalPages,currentURL))
            }
            return next()
        }
    }
}