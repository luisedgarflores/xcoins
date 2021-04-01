import { sequelize } from '../models'
const ENDPOINT = "http://localhost:8000/graphql";

const { GraphQLClient } = require("graphql-request");

export const createGraphQLClient = (token) => {
  return new GraphQLClient(ENDPOINT, {
    headers: {
      Authorization: token,
    },
  });
};

export const basicClient = new GraphQLClient(ENDPOINT, {
  headers: {},
});

export const deleteAllRecords = async () => {
  await sequelize
  .sync({ force: true, alter: true })
};
