import { createGraphQLClient, basicClient } from "../utils";
import factory from "factory-girl";
import { LOGIN } from "./users.test.mutations";
import colors from "colors";

export const createAdminWithClient = async () => {
  console.log("GENERATING ADMIN WITH CLIENT".yellow);
  const user = await factory.create('User', {}, { role: 'ADMIN' })

  const input = {
    login: user.username,
    password: "12345678",
  };

  const loginData = await basicClient.request(LOGIN, {
    input,
  });

  const client = await createGraphQLClient(loginData.signIn.token.token);

  return {
    user,
    client,
  };
};

export const createAdmin = async () => {
  console.log("GENERATING ADMIN".yellow);

  const user = await factory.create("User", {}, { role: "ADMIN" });

  return {
    user,
  };
};

export const createDumbUser = async () => {
  console.log("GENERATION DUMB USER".yellow);

  const user = await factory.create("DumbUser", {}, {role: 'CLIENT'});

  console.log

  return {
    user,
  };
};
