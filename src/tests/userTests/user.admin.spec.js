import { basicClient } from "../utils";

import {
  createAdmin,
  createAdminWithClient,
  createDumbUser,
  createInvalidDumbUser,
} from "./user.utils";
import { describe, beforeEach, it, reporters } from 'mocha'
import { LOGIN, UPSERT_USER } from "./users.test.mutations";
const { deleteAllRecords } = require("../utils");
const chai = require("chai");
const chaiString = require("chai-string");
chai.use(chaiString);
const { expect } = chai;


let admin;

const AdminSetup = async () => {
  await deleteAllRecords();
  const currentAdmin = await createAdminWithClient();
  return currentAdmin;
};

describe("LOGIN TESTS".green, async () => {
  beforeEach(async () => {
    await deleteAllRecords();
  });

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


describe("CREATE USER TESTS".green, async () => {
  beforeEach(async () => {
    admin = await AdminSetup();
  });

  it("CREATE USER WITH VALID DATA", async () => {
    const { user: validUserData } = await createDumbUser()

    const input = {
      ...validUserData,
    };

    const { upsertUser: validUser } = await admin.client.request(UPSERT_USER, {
      input,
    });


    delete validUser.id;
    delete validUserData.get
    delete validUserData.save
    delete validUserData.password

    expect(validUser).to.deep.equal(validUserData);
  });

  it('CREATE USER WITH MISSING REQUIRED FIELDS', async () => {
    const { user: invalidUserData } = await createInvalidDumbUser()

    const input = {
      ...invalidUserData
    }

    try {
      await admin.client.request(UPSERT_USER, {
        input
      })

      expect.fail()
    } catch (error) {
      const { response } = error
      expect(response.errors[0].message).to.equal('Invalid data provided')
    }
  })

  it('CREATE USER WITH TOO SHORT PASSWORD', async () => {
    const { user: validUserData } = await createDumbUser()

    validUserData.password = '1234'

    const input = {
      ...validUserData
    }

    try {
      await admin.client.request(UPSERT_USER, { input })
      expect.fail()
    } catch (error) {
      const { response } = error
      expect(response.errors[0].message).to.equal('Validation len on password failed')
    }
  })
});
