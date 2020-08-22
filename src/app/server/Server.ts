import * as restify from 'restify'
import {environment} from '../common/environment'
import {Router} from '../common/router'
import {DataBaseInitializer} from '../DataBase/DataBaseInitializer'
import {mergePatchBodyParser} from './merge-patch.parser'
import {handleError} from './error.handler'
export class Server{

    private application: restify.Server;
    private all_base_paths:Record<string,string>;
    constructor(){
        this.application = restify.createServer({
            name:environment.server.name,
            version:environment.server.version
        })
        this.application.use(restify.plugins.queryParser())
        this.application.use(restify.plugins.bodyParser())
        this.application.use(mergePatchBodyParser)
        this.application.on('restifyError',handleError)
        this.all_base_paths = {}
    }

    private startListening(resolve: Function){
        this.application.listen(environment.server.port,()=>{
            resolve(this.application)
        })
    }

    private hyperMediaBasePaths = (req:restify.Request,resp:restify.Response,next:restify.Next) => {
        resp.json(this.all_base_paths)
        next()
    }

    public async initRoutes(routers: Router[] = []): Promise<any>{
        return new Promise((resolve,rejects)=>{
            try{
                this.startListening(resolve)
                routers.forEach(route => {
                    route.applyRoutes(this.application)
                    this.all_base_paths[route.name] = route.basePath
                })
                this.application.get('/',this.hyperMediaBasePaths);
            }
            catch(error){
                rejects(error);
            }
        })
    }
    
    public get address():string{
        return JSON.stringify(this.application?.address())
    }
    

    public async bootstrap(routers: Router[] = []): Promise<Server>{
        try{
            await DataBaseInitializer.init()
            return this.initRoutes(routers).then(()=> this);
        }
        catch(err){
            throw err
        }
    }
}