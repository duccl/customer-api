import 'jest'
import {default as request} from 'supertest'
import {environment} from '../../common/environment'
import * as usersRoutes from '../index'
import {Server} from '../../server/Server'
import { UserDTO } from '../models/users.model'

let test_server_endpoint = 'http://localhost:'
let server: Server;
beforeAll(()=>{
    environment.db.url = process.env.DB_URL_HOMOLOG || 'mongodb://localhost:27017/customer-api'
    environment.server.port = 8080
    server = new Server()
    return server.bootstrap([...usersRoutes.routes])
                 .then(() => UserDTO.deleteMany({}).exec())
                 .catch(console.error)
})

test('get /users', () =>{
    return request(test_server_endpoint + environment.server.port)
        .get('/users')
        .then(response => {
            expect(response.status).toBe(200);
            expect(response.body.documents.items).toBeInstanceOf(Array)
        })
        .catch(fail)
})

test('post /users', () =>{
    return request(test_server_endpoint + environment.server.port)
        .post('/users')
        .send({
            name:'nasasd',
            password:"none",
            email:"asdasdasd@sasasas.com"
        })
        .then(response => {
            expect(response.status).toBe(200);
            expect(response.body._id).toBeDefined()
            expect(response.body.name).toBe('nasasd')
            expect(response.body.password).toBe('encrypted')
        })
        .catch(fail)
})

afterAll(() => {
    server.shutdown()
})