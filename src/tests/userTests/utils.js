import { createGraphQLClient, basicClient } from "../utils";
import factory from "factory-girl";
import { LOGIN } from "./users.test.mutations";

const createAdmin = async () => {
  const user = await factory.create("User", {}, { role: "ADMIN" });
  const input = {
    login: user.username,
    password: "12345678",
  }

  const loginData = await basicClient.request(LOGIN, {
    input
  });

  const client = createGraphQLClient(loginData.signIn.token.token)

  return {
    user,
    client
  };
};

module.exports = {
  createAdmin,
};
