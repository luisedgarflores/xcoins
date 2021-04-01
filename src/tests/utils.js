import models from '../models'
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
  console.log('DELETING IT ALL')
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    await model.destroy({ truncate: true });
  }
};
