import 'reflect-metadata'
import { ApolloServerPluginLandingPageProductionDefault, ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-express'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import hpp from 'hpp'
import { buildSchema } from 'type-graphql'
import { ENVIRONMENT, PORT, ORIGIN, CREDENTIALS } from '@config'
import { dbConnection } from '@/database/index'
import { AuthMiddleware, AuthCheckerMiddleware } from '@middlewares/auth.middleware'
import { ErrorMiddleware } from '@middlewares/error.middleware'
import { logger, responseLogger, errorLogger } from '@utils/logger'

// Global error handler
process.on('uncaughtException', error => {
  console.log(error)
  process.exit(1)
})

export class App {
  public app: express.Application
  public env: string
  public port: number

  constructor(resolvers) {
    this.app = express()
    this.env = ENVIRONMENT || 'development'
    this.port = Number(PORT) || 9000

    this.connectToDatabase()
    this.initializeMiddlewares()
    this.initApolloServer(resolvers)
    this.initializeErrorHandling()
  }

  public async listen() {
    this.app.listen(this.port, '0.0.0.0', () => {
      logger.info(`=================================`)
      logger.info(`======= ENV: ${this.env} =======`)
      logger.info(`🚀 App listening on the port ${this.port}`)
      logger.info(`🎮 http://localhost:${this.port}/graphql`)
      logger.info(`=================================`)
    })
  }

  public getServer() {
    return this.app
  }

  private async connectToDatabase() {
    await dbConnection()
  }

  private initializeMiddlewares() {
    if (this.env === 'production') {
      this.app.use(hpp())
      this.app.use(helmet())
    }

    const allowedOriginsString = ORIGIN

    const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(',').map(origin => origin.trim()) : []
    this.app.use(cors({ origin: allowedOrigins, credentials: CREDENTIALS }))
    this.app.use(compression())
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(cookieParser())
  }

  private async initApolloServer(resolvers) {
    const schema = await buildSchema({
      resolvers: resolvers,
      authChecker: AuthCheckerMiddleware,
    })

    const apolloServer = new ApolloServer({
      schema: schema,
      plugins: [
        this.env === 'production'
          ? ApolloServerPluginLandingPageProductionDefault({ footer: false })
          : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
      ],
      context: async ({ req, res }) => {
        try {
          const user = await AuthMiddleware(req)
          return { req, res, user }
        } catch (error) {
          throw new Error(error)
        }
      },
      formatResponse: (response, request) => {
        // responseLogger(request)

        return response
      },
      formatError: error => {
        try {
          errorLogger(error)
          return error
        } catch (err) {
          return error
        }
      },
    })

    await apolloServer.start()
    apolloServer.applyMiddleware({ app: this.app, cors: false, path: '/graphql' })
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware)
  }
}
