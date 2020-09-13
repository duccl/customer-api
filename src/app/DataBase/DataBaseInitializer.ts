import mongoose from 'mongoose'
import {environment} from '../common/environment'
export class DataBaseInitializer{
    static init(){
        let uri = environment.db.url
        uri = uri.replace('"',"").replace('"',"")        
        return mongoose.connect(uri,{
            useCreateIndex:true,
            useNewUrlParser:true,
            useUnifiedTopology:true
        })
    }

    static disconnect(){
        return mongoose.disconnect()
    }
}