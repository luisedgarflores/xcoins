import "dotenv/config";
import http from "http";
import cors from "cors";
import express from "express";
import { ApolloServer, AuthenticationError } from "apollo-server-express";
import schema from "./schema";
import resolvers from "./resolvers";
import models, { sequelize } from "./models";
import jwt from "jsonwebtoken";
import { pubsub, EVENTS, fetchAPI } from "./utils";
import axios from "axios";
const port = process.env.SERVER_PORT;
const colors = require("colors"); // allows to print colored terminal output during development
const helmet = require("helmet");

const app = express();
const erase_database_on_restart = true;

const updateExchangeRate = (exchangeRate) => {
  pubsub.publish(EVENTS.EXCHANGE_RATE.UPDATED, {
    exchangeRateUpdated: {
      usd: exchangeRate.quote.USD.price,
      lastUpdated: exchangeRate.last_updated,
    },
  });
};

const coinmarketConsumer = setInterval(async () => {
  console.log("ENTRANDO AL TIME");
  // axios({
  //   method: "get",
  //   timeout: 1000,
  //   url:
  //     "https://pro-api.coinmarketcap.com/v1/tools/price-conversion?symbol=BTC&convert=USD&amount=1",
  //   headers: { "X-CMC_PRO_API_KEY": "c7d43b67-b87c-430d-8bda-084997ed3bd6" },
  //   withCredentials: true,
  // })
  //   .then((res) => {
  //     console.log(
  //       "\x1b[32m%s\x1b[0m",
  //       "================================================="
  //     );
  //     console.log("RESPUESTA", res.data);
  //     console.log(
  //       "\x1b[32m%s\x1b[0m",
  //       "================================================="
  //     );
  //   })
  //   .catch((err) => {
  //     console.log(
  //       "\x1b[32m%s\x1b[0m",
  //       "================================================="
  //     );
  //     console.log("ERROR", err);
  //     console.log(
  //       "\x1b[32m%s\x1b[0m",
  //       "================================================="
  //     );
  //   })
  const exchangeRate = await fetchAPI();
  updateExchangeRate(exchangeRate);
}, 60000);

// Ensures port is not used when nodemon or user send signals
process.once("SIGUSR2", async function () {
  await clearInterval(coinmarketConsumer);
  await process.kill(process.pid, "SIGUSR2");
});
process.on("SIGINT", async function () {
  await clearInterval(coinmarketConsumer);
  await process.kill(process.pid, "SIGINT");
});

app.use(cors()); // enables cors for requests
//app.use(helmet({ contentSecurityPolicy: (process.env.NODE_ENV === 'production') ? undefined : false }))

// Sets up apollo server instance
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  formatError: (error) => {
    // Formats error to mantain consistency around the server
    const message = error.message
      .replace("SequelizeValidationError: ", "")
      .replace("Validation error: ", "");

    return {
      ...error,
      message,
    };
  },
  context: async ({ req, connection }) => {
    // sets server context
    if (connection) {
      return {
        models,
      };
    }

    if (req) {
      const me = await getMe(req);

      return {
        models,
        me,
        secret: process.env.SECRET,
        sequelize,
        pubsub,
        EVENTS,
      };
    }
  },
});

server.applyMiddleware({ app, path: "/graphql" });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

//syncs models into db and delete all present records based on condition
sequelize
  .sync({ force: erase_database_on_restart, alter: true })
  .then(async () => {
    if (erase_database_on_restart) {
      //if data is deleted on restart, generate basic records
      await setUpMockData();
    }
    httpServer.listen({ port }, () => {
      console.log("Apollo Server on http://localhost:8000/graphql".green);
    });
  });

// Generates fake data for development usage
const setUpMockData = async () => {
  await models.User.create({
    username: "luisflores",
    email: "luis@gmail.com",
    password: "12345678",
    role: "ADMIN",
    name: "Luis Flores",
  });

  await models.User.create({
    username: "diegoflores",
    email: "diego@gmail.com",
    password: "12345678",
    role: "CLIENT",
    name: "Diego Flores",
  });
};

// when request is made, check if token exist, if it does, verify it is valid token
const getMe = async (req) => {
  const token = req.headers["authorization"];
  if (token) {
    try {
      return await jwt.verify(token, process.env.SECRET);
    } catch (err) {
      throw new AuthenticationError("Your session expired. Sign in again"); // if no authorization header present, return error
    }
  }
};

module.exports = {
  pubsub,
  EVENTS,
};
