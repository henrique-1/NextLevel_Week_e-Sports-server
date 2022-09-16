import express from 'express'
import { PrismaClient } from '@prisma/client'
import { convertHourString_to_Minutes } from './utils/convertHourString_to_Minutes';
import { convertMinutes_to_HourString } from './utils/convertMinutes_to_HourString';
import cors from 'cors'

const app = express();

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
    log: ['query']
});

/**
 * * HTTP methods / API RESTful
 * 
 * * GET     => Buscar uma informação
 * * POST    => Inserir uma informação
 * * PUT     => Alterar uma informação
 * * DELETE  => Remover um dado
 * * PATCH   => Alterar informação especifica
*/

/**
 * * Tipos de parâmetros
 * ? Route Params => http://localhost:3000/products/13461237461
 * ? Query Params => http://localhost:3000/products?name=teclado&description=tecladotop
 * 
 * ? Body Params  => {
 * ?  "name": "Teclado",
 * ?  "description": "Teclado bom"
 * ? }
 */

/**
 * * HTTP Codes
 * * 1** -> Respostas de Informação
 * ! 100 -> Continue
 * ! 101 -> Switching Protocols
 * ! 102 -> Processing
 * ! 103 -> Early Hints
 * * 2** -> Códigos de Aceitação
 * ! 200 -> Ok
 * ! 201 -> Created
 * ! 202 -> Accepted
 * ! 203 -> Non-Authoritative Information
 * ! 204 -> No Content
 * ! 205 -> Reset Content
 * ! 206 -> Partial Content
 * ! 207 -> Multiple Status
 * ! 208 -> Already Reported
 * ! 226 -> IM Used
 *      ? The server has fulfilled a GET request for the resource, and the response is a representation of the result of one or more instance-manipulations applied to the current instance.
 * * 3** -> Redirecionamento
 * ! 300 -> Multiple Choices
 *      ? The request has more than one possible response. The user agent or user should choose one of them. (There is no standardized way of choosing one of the responses, but HTML links to the possibilities are recommended so the user can pick.
 * ! 301 -> Moved Permanently
 * ! 302 -> Found
 * ! 303 -> See Other
 * ! 304 -> Not Modified
 * ! 305 -> Use Proxy
 *      ? Defined in a previous version of the HTTP specification to indicate that a requested response must be accessed by a proxy. It has been deprecated due to security concerns regarding in-band configuration of a proxy.
 * ! 307 -> Temporary Redirect
 * ! 308 -> Permanent Redirect
 * * 4** -> Erros no Cliente
 * ! 400 -> Bad Request
 * ! 401 -> Unauthorized
 * ! 402 -> Payment Required
 * ! 403 -> Forbidden
 * ! 404 -> Not Found
 * ! 405 -> Method Not Allowed
 * ! 406 -> Not Acceptable
 * ! 407 -> Proxy Authentication Required
 *      ? This is similar to 401 Unauthorized but authentication is needed to be done by a proxy.
 * ! 408 -> Request Timeout
 * ! 409 -> Conflict
 *      ? This response is sent when a request conflicts with the current state of the server.
 * ! 410 -> Gone
 * ! 411 -> Length Required
 * ! 412 -> Precondition Failed
 * ! 413 -> Payload Too Large
 * ! 414 -> URI Too Long
 * ! 415 -> Unsupported Media Type
 * ! 416 -> Range Not Satisfiable
 * ! 417 -> Expectation Failed
 * ! 418 -> I'm a teapot
 *      ? The server refuses the attempt to brew coffee with a teapot.
 * ! 421 -> Misdirect Request
 * ! 422 -> Unprocessable Entity
 * ! 423 -> Locked
 * ! 424 -> Failed Dependency
 * ! 425 -> Too Early
 *      ? Indicates that the server is unwilling to risk processing a request that might be replayed.
 * ! 426 -> Upgrade Required
 *      ? The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol. The server sends an Upgrade header in a 426 response to indicate the required protocol(s).
 * ! 428 -> Precondition Required
 * ! 429 -> Too Many Requests
 * ! 431 -> Request Header Fields Too Large
 * ! 451 -> Unavailable For Legal Reasons
 *      ? The user agent requested a resource that cannot legally be provided, such as a web page censored by a government.
 * * 5** -> Erros no Servidor
 * ! 500 -> Internal Server Error
 * ! 501 -> Not Implemented
 * ! 502 -> Bad Gateway
 * ! 503 -> Service Unavailable
 * ! 504 -> Gateway Timeout
 * ! 505 -> HTTP Version Not Supported
 * ! 506 -> Variant Also Negotiates
 * ! 507 -> Insufficient Storage
 * ! 508 -> Loop Detected
 * ! 510 -> Not Extended
 * ! 511 -> Network Authentication Required
*/

app.get('/games', async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true,
                }
            }
        }
    });

    return response.json(games);
})

app.post('/games/:gameId/ads', async (request, response) => {
    const gameId = request.params.gameId;
    const body = request.body;

    const ad = await prisma.ad.create({
        data: {
            gameId: gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertHourString_to_Minutes(body.hourStart),
            hourEnd: convertHourString_to_Minutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel,
        }
    })

    return response.status(201).json(ad);
})

app.get('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true,
        },
        where: {
            gameId: gameId
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(","),
            hourStart: convertMinutes_to_HourString(ad.hourStart),
            hourEnd: convertMinutes_to_HourString(ad.hourEnd)

        }
    }))
})

app.get('/ads/:id/discord', async (request, response) => {
    const adId = request.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id: adId,
        }
    })

    return response.json({
        discord: ad.discord,
    })
})

app.listen(3333)