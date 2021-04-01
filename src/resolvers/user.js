import jwt from "jsonwebtoken";
import { AuthenticationError, UserInputError } from "apollo-server";
import { combineResolvers } from "graphql-resolvers";
import { isAdmin, isAuthenticated } from "./permissions/globalPermissions";
import { Op } from "sequelize";

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
    signIn: async (parent, { input }, { models, secret }) => {
      const { login, password } = input;

      const user = await models.User.findByLogin(login);

      if (!user) {
        throw new UserInputError("User sent does not exist");
      }

      const isValid = await user.validatePassword(password);

      if (!isValid) {
        throw new AuthenticationError("Invalid password");
      }

      return user;
    },
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
    upsertUser: combineResolvers(
      isAuthenticated,
      async (parent, { input }, { models, me }) => {
        const { id, ...rest } = input;

        if (id) {
          return models.User.updateInstance({
            loggedInUser: me,
            data: {
              id,
              rest,
            },
          });
        } else {
          if (input.username && input.name && input.password && input.email) {
            return models.User.createInstance({
              loggedInUser: me,
              data: {
                rest,
              },
            });
          }
         
        }
        return UserInputError('Invalid data provided')
        
      }
    ),
  },
  LoginPayload: {
    user: async (user, _args, { models }) => {
      return user;
    },
    token: async (user, _args, { secret }) => {
      return await {
        token: createToken(user, secret, "600m"),
      };
    },
  },
};
