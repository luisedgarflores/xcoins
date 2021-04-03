import models from "../models";
const ENDPOINT = "http://localhost:8000/graphql";

const { GraphQLClient } = require("graphql-request");

// Generates an authenticated graphQL client based on user token
export const createGraphQLClient = (token) => {
  return new GraphQLClient(ENDPOINT, {
    headers: {
      Authorization: token,
    },
  });
};

// Generates an unauthenticated graphQL client 
export const basicClient = new GraphQLClient(ENDPOINT, {
  headers: {},
});

// Destroys all rows in the user table
export const deleteAllRecords = async () => {
  await models.User.destroy({ truncate: true });
};
