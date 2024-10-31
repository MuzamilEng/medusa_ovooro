const express = require("express")
const { GracefulShutdownServer } = require("medusa-core-utils")
const cors = require("cors");

const loaders = require("@medusajs/medusa/dist/loaders/index").default

;(async() => {
  async function start() {
    const app = express()
    const directory = process.cwd()
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

      // Serve static files and apply cache headers
    app.use(express.static("public", {
      setHeaders: function (res, path) {
        res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      }
    }));


    app.use(cors({
      origin: "https://medusa-ovooro.vercel.app",
      optionsSuccessStatus: 200,
      credentials: true,
    }));
  
    


    try {
      const { container } = await loaders({
        directory,
        expressApp: app
      })
      const configModule = container.resolve("configModule")
      const port = process.env.PORT ?? configModule.projectConfig.port ?? 9000

      const server = GracefulShutdownServer.create(
        app.listen(port, (err) => {
          if (err) {
            return
          }
          console.log(`Server is ready on port: ${port}`)
        })
      )

      // Handle graceful shutdown
      const gracefulShutDown = () => {
        server
          .shutdown()
          .then(() => {
            console.info("Gracefully stopping the server.")
            process.exit(0)
          })
          .catch((e) => {
            console.error("Error received when shutting down the server.", e)
            process.exit(1)
          })
      }
      process.on("SIGTERM", gracefulShutDown)
      process.on("SIGINT", gracefulShutDown)
    } catch (err) {
      console.error("Error starting server", err)
      process.exit(1)
    }
  }

  await start()
})()
