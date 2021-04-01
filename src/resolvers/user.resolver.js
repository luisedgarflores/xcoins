import jwt from "jsonwebtoken";
import { AuthenticationError, UserInputError } from "apollo-server";
import { combineResolvers } from "graphql-resolvers";
import { isAdmin, isAuthenticated } from "./permissions/globalPermissions";

// Handles token creation usign user fields to create jwt token
const createToken = async (user, secret, expiresIn) => {
  const { id, email, username, role } = user;
  return await jwt.sign({ id, email, username, role }, secret, {
    expiresIn,
  });
};

export default {
  Query: {
    me: async (parent, args, { models, me }) => {
      if (!me) return null;
      return await models.User.findByPk(me.id);
    },
    getUser: async (parent, { id }, { models }) => {
      return await models.User.findByPk(id);
    },
    getUsers: combineResolvers(
      isAuthenticated,
      async (parent, args, { models, me }) => {
        if (me.role === "ADMIN") return await models.User.findAll();
      }
    ),
  },
  Mutation: {
    // Allow users to register into the platform
    signUp: async (
      parent,
      { email, password, username, ...rest },
      { models, secret }
    ) => {
      const user = await models.User.create({
        username,
        email,
        password,
        rest,
      });
      return { token: createToken(user, secret, "30m") };
    },
    //Allows register users to sign into the platform
    signIn: async (parent, { input }, { models, secret }) => {
      const { login, password } = input;

      // login can either be username or email
      const user = await models.User.findByLogin(login);

      if (!user) {
        throw new UserInputError("User sent does not exist");
      }

      // Validates user by its class function validaPassword
      const isValid = await user.validatePassword(password);

      if (!isValid) {
        throw new AuthenticationError("Invalid password");
      }

      return user;
    },
    //Allows admin to delete users
    deleteUser: combineResolvers(
      isAdmin,
      async (parent, { input: { id } }, { models }) => {
        return await models.User.destroy({
          where: {
            id,
          },
        });
      }
    ),
    // Allows admin to register new users and update them if necessary
    upsertUser: combineResolvers(
      isAuthenticated,
      async (parent, { input }, { models, me }) => {
        const { id, ...rest } = input;

        // In case id is sent, an update is perform
        if (id !== null && id !== undefined) {
          // updates user instance based on updateInstance User function
          return models.User.updateInstance({
            loggedInUser: me,
            data: {
              id,
              rest,
            },
          });
        } else {
          //Otherwise, validate if all creation fields are present and create new user
          if (
            rest.username &&
            rest.name &&
            rest.password &&
            rest.email &&
            rest.role
          ) {
            // Creates user based on createInstance User function
            return models.User.createInstance({
              loggedInUser: me,
              data: {
                ...rest,
              },
            });
          }
        }
        return new UserInputError("Invalid data provided");
      }
    ),
  },
  // User to parse default return information into login payload
  LoginPayload: {
    user: async (user, _args, _context) => {
      return user;
    },
    token: async (user, _args, { secret }) => {
      return await {
        token: createToken(user, secret, "600m"),
      };
    },
  },
};
