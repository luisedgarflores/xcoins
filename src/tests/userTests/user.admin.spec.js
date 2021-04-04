import { basicClient } from "../utils";
import {
  createAdmin,
  createAdminWithClient,
  createUser,
  createDumbUser,
  createInvalidDumbUser,
} from "./user.utils";
import { describe, beforeEach, it } from "mocha";
import { LOGIN, UPSERT_USER } from "./user.test.mutations";
import colors from "colors";
import { GET_USERS, GET_USER } from "./user.test.queries";

const { deleteAllRecords } = require("../utils");
const chai = require("chai");
const chaiString = require("chai-string");
chai.use(chaiString);
const { expect } = chai;

let admin, client;
let multipleUsers = [];

// Saves admin and returns admin instances and it's graphQL client
const setUpAdmin = async () => {
  const currentAdmin = await createAdminWithClient();
  return currentAdmin;
};

// Saves a single user with no graphQL client
const setUpUser = async () => {
  const user = await createUser();
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

describe("ADMIN TESTS".yellow, async () => {
  beforeEach(async () => {
    await deleteAllRecords();
  });

  describe("LOGIN TESTS".blue, async () => {
    it("LOGIN WITH A VALID ADMIN", async () => {
      const { user: mockValidAdmin } = await createAdmin();

      const validAdminData = {
        id: mockValidAdmin.id.toString(),
        name: mockValidAdmin.name,
        role: mockValidAdmin.role,
        email: mockValidAdmin.email,
        username: mockValidAdmin.username,
      };

      const input = {
        login: mockValidAdmin.username,
        password: "12345678",
      };

      const loginData = await basicClient.request(LOGIN, { input });

      expect(loginData.signIn.user).to.deep.equal(validAdminData);
    });

    it("LOGIN WITH INVALID CREDENTIALAS", async () => {
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
  });

  describe("CREATE USER TESTS".blue, async () => {
    beforeEach(async () => {
      admin = await setUpAdmin();
    });

    it("CREATE USER WITH VALID DATA", async () => {
      const { user: validUserData } = await createDumbUser();

      const input = {
        ...validUserData,
      };

      const { upsertUser: validUser } = await admin.client.request(
        UPSERT_USER,
        {
          input,
        }
      );

      delete validUser.id;
      delete validUserData.get;
      delete validUserData.save;
      delete validUserData.password;

      expect(validUser).to.deep.equal(validUserData);
    });

    it("CREATE USER WITH MISSING REQUIRED FIELDS", async () => {
      const { user: invalidUserData } = await createInvalidDumbUser();

      const input = {
        ...invalidUserData,
      };

      try {
        await admin.client.request(UPSERT_USER, {
          input,
        });

        expect.fail();
      } catch (error) {
        const { response } = error;
        expect(response.errors[0].message).to.equal("Invalid data provided");
      }
    });

    it("CREATE USER WITH TOO SHORT PASSWORD", async () => {
      const { user: validUserData } = await createDumbUser();

      validUserData.password = "1234";

      const input = {
        ...validUserData,
      };

      try {
        await admin.client.request(UPSERT_USER, { input });
        expect.fail();
      } catch (error) {
        const { response } = error;
        expect(response.errors[0].message).to.equal(
          "Validation len on password failed"
        );
      }
    });
  });

  describe("UPDATE USER TESTS".blue, async () => {
    beforeEach(async () => {
      admin = await setUpAdmin();
      client = await setUpUser();
    });

    it("UPDATING VALID USER", async () => {
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
      } = await admin.client.request(UPSERT_USER, { input });

      expect(updatedClient).to.deep.equal(updatedClientData);
    });

    it("UPDATING NON EXISTANT USER", async () => {
      try {
        const input = {
          id: client.user.id+=2,
          username: "fakeUsername",
        };
        const error = await admin.client.request(UPSERT_USER, { input });
        console.log(error)
        expect.fail();
      } catch (error) {
        const { response } = error;
        expect(response.errors[0].message).to.equal("User sent does not exist");
      }
    });

    it("UPDATE USER PASSWORD WITH TOO SHORT VALUE", async () => {
      try {
        const input = {
          id: client.user.id,
          password: "1234",
        };

        await admin.client.request(UPSERT_USER, { input });
        expect.fail()
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
      admin = await setUpAdmin();
    });

    describe("GET REGISTERED USERS", async () => {
      beforeEach(async () => {
        multipleUsers = await setUpMultipleUsers({ usersQuantity: 15 });
      });

      it("QUERYING MULTIPLE USERS", async () => {
        const { getUsers: users } = await admin.client.request(GET_USERS, {});
        // remove admin from retrurned data since it will not be contained in the recently created users
        const usersWithoutAdmin = users.filter(
          (user) => user.id !== admin.user.id.toString()
        );

        expect(usersWithoutAdmin).to.deep.equal(multipleUsers);
      });

      it("GET A SINGLE REGISTERED USER", async () => {
        const input = {
          id: multipleUsers[0].id,
        };
        const { getUser: user } = await admin.client.request(GET_USER, {
          input,
        });

        expect(user).to.deep.equal(multipleUsers[0]);
      });

      it('SEND INVALID PARAMS FOR QUERY', async () => {
        try {
          await admin.client.request(GET_USER, {})
          expect.fail()
        } catch(error) {
          const { response } = error
          expect(response.errors[0].message).to.equal('Variable "$input" of required type "GetUserInput!" was not provided.')
        }
      })
    });

    it('GET NON EXISTANT USER', async () => {
      const input = {
        id: admin.user.id+=16
      }
      try {
        await admin.client.request(GET_USER, { input })
        expect.fail()
      } catch (error) {
        const { response } = error

        expect(response.errors[0].message).to.equal('User sent does not exist')
      }
    })
  });
});
