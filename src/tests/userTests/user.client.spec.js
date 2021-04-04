import { basicClient } from "../utils";
import { createUser, createDumbUser, createUserWithClient } from "./user.utils";
import { describe, beforeEach, it } from "mocha";
import {
  LOGIN,
  UPSERT_USER,
  SIGNUP,
  VALIDATE_USER,
} from "./user.test.mutations";
import colors from "colors";
import { GET_USERS, GET_USER } from "./user.test.queries";
import { totp } from "otplib";
const { deleteAllRecords } = require("../utils");
const chai = require("chai");
const chaiString = require("chai-string");
chai.use(chaiString);
const { expect } = chai;

let client;
let multipleUsers = [];

// Saves a single user with no graphQL client
const setUpUser = async () => {
  const user = await createUserWithClient();
  return user;
};

// Use User factories to generate and save fake user to db
const setUpMultipleUsers = async ({ usersQuantity }) => {
  const users = [];

  for (let i = 0; i < usersQuantity; i++) {
    users.push((await createUser()).user);
  }
  return users.map((user) => {
    return {
      id: user.id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  });
};

describe("CLIENT TESTS".yellow, async () => {
  beforeEach(async () => {
    await deleteAllRecords();
  });

  describe("LOGIN TESTS".blue, async () => {
    it("LOGIN WITH A VALID USER", async () => {
      const { user: mockValidClient } = await createUser();

      const validClientData = {
        id: mockValidClient.id.toString(),
        name: mockValidClient.name,
        role: mockValidClient.role,
        email: mockValidClient.email,
        username: mockValidClient.username,
      };

      const input = {
        login: mockValidClient.username,
        password: "12345678",
      };

      const loginData = await basicClient.request(LOGIN, { input });

      expect(loginData.signIn.user).to.deep.equal(validClientData);
    });

    it("LOGIN WITH INVALID CREDENTIALS", async () => {
      const input = {
        login: "notValidUser",
        password: "notValidPassword",
      };

      try {
        await basicClient.request(LOGIN, { input });
        expect.fail();
      } catch (error) {
        const { response } = error;
        expect(response.errors[0].message).to.equal("User sent does not exist");
      }
    });

    it("LOGIN WITH WRONG PASSWORD", async () => {
      const { user: mockValidClient } = await createUser();
      const input = {
        login: mockValidClient.username,
        password: "notValidPassword",
      };

      try {
        await basicClient.request(LOGIN, { input });
        expect.fail();
      } catch (error) {
        const { response } = error;
        expect(response.errors[0].message).to.equal("Invalid password");
      }
    });
  });

  describe("SIGN UP TESTS", () => {});
  it("SIGNUP WITH VALID DATA", async () => {
    const { user } = await createDumbUser();
    const input = {
      username: user.username,
      email: "luisedgarflorescarpinteyro@gmail.com",
      name: user.name,
      password: "12345678",
    };
    const { signUp: response } = await basicClient.request(SIGNUP, { input });

    expect(response).to.be.true;
  });

  it("SIGNUP WITH REPEATED USERNAME", async () => {
    try {
      const { user } = await createUser();
      const input = {
        username: user.username,
        email: "luisedgarflorescarpinteyro@gmail.com",
        name: user.name,
        password: "12345678",
      };
      await basicClient.request(SIGNUP, { input });
    } catch (error) {
      const { response } = error;
      expect(response.errors[0].message).to.equal("Validation error");
    }
  });

  // it.only("VALIDATE USER WITH PROPER OTP", async () => {
  //   const secret = "aISrlPG4PSL96yvdZu9Y";
  //   totp.options = { digits: 6, step: 300 };
  //   const otp = await totp.generate(secret);
  //   console.log(otp);
  //   const { user } = await createUser(otp);

  //   const input = {
  //     otp,
  //   };

  //   const userData = {
  //     id: user.id.toString(),
  //     email: user.email,
  //     name: user.name,
  //     username: user.username,
  //     role: user.role,
  //   };

  //   const { validateUser: response } = await basicClient.request(
  //     VALIDATE_USER,
  //     {
  //       input,
  //     }
  //   );

  //   expect(response.user).to.deep.equal(userData);
  // });

  it("SIGNUP WITH REPEATED EMAIL", async () => {
    try {
      const { user } = await createUser();
      const input = {
        username: user.username + "abc",
        email: user.email,
        name: user.name,
        password: "12345678",
      };
      await basicClient.request(SIGNUP, { input });
    } catch (error) {
      const { response } = error;
      expect(response.errors[0].message).to.equal("Validation error");
    }
  });

  describe("CREATE USER TESTS".blue, async () => {
    beforeEach(async () => {
      client = await setUpUser();
    });

    it("CREATE USER WITH VALID DATA", async () => {
      try {
        const { user: validUserData } = await createDumbUser();

        const input = {
          ...validUserData,
        };

        await client.client.request(UPSERT_USER, {
          input,
        });
        expect.fail();
      } catch (error) {
        const { response } = error;

        expect(response.errors[0].message).to.equal(
          "User does not have admin permissions"
        );
      }
    });
  });

  describe("UPDATE USER".blue, async () => {
    beforeEach(async () => {
      client = await setUpUser();
    });

    it("UPDATING MYSELF", async () => {
      const updatedName = client.user.name + "abc";

      const input = {
        id: client.user.id,
        name: updatedName,
      };

      const updatedClientData = {
        id: client.user.id.toString(),
        username: client.user.username,
        name: updatedName,
        email: client.user.email,
        role: client.user.role,
      };

      const {
        upsertUser: updatedClient,
      } = await client.client.request(UPSERT_USER, { input });

      expect(updatedClient).to.deep.equal(updatedClientData);
    });

    it("UPDATE MY PASSWORD WITH TOO SHORT VALUE", async () => {
      try {
        const input = {
          id: client.user.id,
          password: "1234",
        };

        await client.client.request(UPSERT_USER, { input });
        expect.fail();
      } catch (error) {
        const { response } = error;

        expect(response.errors[0].message).to.equal(
          "Validation len on password failed"
        );
      }
    });
  });

  describe("GET USERS TEST".blue, async () => {
    beforeEach(async () => {
      await deleteAllRecords();
      client = await setUpUser();
    });

    describe("GET REGISTERED USERS", async () => {
      beforeEach(async () => {
        multipleUsers = await setUpMultipleUsers({ usersQuantity: 15 });
      });

      it("QUERYING MULTIPLE USERS", async () => {
        try {
          await client.client.request(GET_USERS, {});
          expect.fail();
        } catch (error) {
          const { response } = error;
          expect(response.errors[0].message).to.equal(
            "User does not have admin permissions"
          );
        }
      });

      it("GET A SINGLE REGISTERED USER", async () => {
        try {
          const input = {
            id: multipleUsers[0].id,
          };
          await client.client.request(GET_USER, {
            input,
          });
          expect.fail();
        } catch (error) {
          const { response } = error;
          expect(response.errors[0].message).to.equal(
            "User does not have admin permissions"
          );
        }
      });

      it("SEND INVALID PARAMS FOR QUERY", async () => {
        try {
          await client.client.request(GET_USER, {});
          expect.fail();
        } catch (error) {
          const { response } = error;
          expect(response.errors[0].message).to.equal(
            'Variable "$input" of required type "GetUserInput!" was not provided.'
          );
        }
      });
    });

    it("GET MYSELF", async () => {
      const input = {
        id: client.user.id,
      };
      const { getUser: user } = await client.client.request(GET_USER, {
        input,
      });

      const userData = {
        id: client.user.id.toString(),
        name: client.user.name,
        username: client.user.username,
        email: client.user.email,
        role: client.user.role,
      };

      expect(user).to.deep.equal(userData);
    });
  });
});
