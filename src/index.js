import "dotenv/config";
import http from "http";
import cors from "cors";
import express from "express";
import {
  ApolloServer,
  AuthenticationError,
} from "apollo-server-express";
import schema from "./schema";
import resolvers from "./resolvers";
import models, { sequelize } from "./models";
import jwt from "jsonwebtoken";
const port = process.env.SERVER_PORT;
const colors = require('colors');
const helmet = require("helmet");
const app = express();
const erase_database_on_restart = false;
app.use(cors());
app.use(helmet({ contentSecurityPolicy: (process.env.NODE_ENV === 'production') ? undefined : false }))

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  formatError: (error) => {
    const message = error.message
      .replace("SequelizeValidationError: ", "")
      .replace("Validation error: ", "");

    return {
      ...error,
      message,
    };
  },
  context: async ({ req, connection }) => {
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
      };
    }
  },
});

server.applyMiddleware({ app, path: "/graphql" });

const httpServer = http.createServer(app);


//syncs models into db
sequelize
  .sync({ force: erase_database_on_restart, alter: false })
  .then(async () => {
    if (erase_database_on_restart) {
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
    role: "CLIENTE",
    name: "Diego Flores",
  });
};

// when request is made, check if token exist, if it does, verify it is valid token
const getMe = async (req) => {
  const token = req.headers['authorization'];
  if (token) {
    try {
      return await jwt.verify(token, process.env.SECRET);
    } catch (err) {
      throw  new AuthenticationError("Your session expired. Sign in again");
    }
  }
};
