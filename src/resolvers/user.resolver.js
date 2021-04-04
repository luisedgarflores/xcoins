import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} from "apollo-server";
import { combineResolvers } from "graphql-resolvers";
import {
  isAdmin,
  isAuthenticatedAndVerified,
  isAuthenticated,
} from "./permissions/globalPermissions";
import {
  pubsub,
  EVENTS,
  fetchAPI,
  generateOTP,
  generateEmailSender,
} from "../utils";

// Handles token creation usign user fields to create jwt token
const createToken = async (user, secret, expiresIn) => {
  const { id, email, username, role, validatedUser } = user;
  return await jwt.sign({ id, email, username, role, validatedUser }, secret, {
    expiresIn,
  });
};

const shouldFetch = true;

export default {
  Query: {
    // Allows user to get it's information when logged in
    me: async (parent, args, { models, me }) => {
      if (!me) return null;
      return await models.User.findByPk(me.id);
    },
    // Allows admin to see any user, but client users can only see their profiles
    getUser: async (parent, { input: { id } }, { models, me }) => {
      if (me.role === "ADMIN" || me.id.toString() === id.toString()) {
        const user = await models.User.findByPk(id);
        if (!user) return new UserInputError("User sent does not exist");
        return user;
      }

      throw new ForbiddenError("User does not have admin permissions");
    },
    // Allows admin to see all users
    getUsers: combineResolvers(
      isAdmin,
      async (parent, args, { models, me }) => {
        if (me.role === "ADMIN") return await models.User.findAll();
      }
    ),
    getExchangeRate: combineResolvers(isAuthenticatedAndVerified, async () => {
      const exchangeRate = await fetchAPI(shouldFetch);

      return {
        usd: exchangeRate.quote.USD.price,
        lastUpdated: exchangeRate.last_updated,
      };
    }),
    requestOTP: combineResolvers(
      isAuthenticated,
      async (_parent, _args, { models, me }) => {
        const user = await models.User.findByPk(me.id);

        if (user) {
          const emailSender = await generateEmailSender();
          const otp = generateOTP({ id: user.id });
          await user.update({ otp, otpCreatedAt: new Date() });
          await emailSender.sendEmail({
            to: user.email,
            subject: "BTC/USD requested code",
            text: otp,
          });
        } else {
          return false;
        }

        return true;
      }
    ),
  },
  Mutation: {
    // Allow users to register into the platform
    signUp: async (
      parent,
      { input: { email, password, username, name } },
      { models }
    ) => {
      const emailSender = await generateEmailSender();
      const user = await models.User.create({
        username,
        email,
        password,
        name,
        role: "CLIENT",
        validatedUser: false,
      });
      const otp = generateOTP({ id: user.id });
      await user.update({ otp, otpCreatedAt: new Date() });

      await emailSender.sendEmail({
        to: user.email,
        text: otp,
        subject: "Account created successfully",
      });

      return user;
    },
    //Allows register users to sign into the platform
    signIn: async (parent, { input }, { models }) => {
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
      isAuthenticatedAndVerified,
      async (parent, { input }, { models, me }) => {
        const { id, ...rest } = input;
        // In case id is sent, an update is performed
        if (id !== null && id !== undefined) {
          // updates user instance based on updateInstance User function
          return models.User.updateInstance({
            loggedInUser: me,
            data: {
              id,
              ...rest,
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
                validatedUser: false,
              },
            });
          }
        }
        return new UserInputError("Invalid data provided");
      }
    ),

    // Validates if otp is assigned to an user and if it is valid
    validateUser: combineResolvers(
      isAuthenticated,
      async (_parent, { input: { otp } }, { models, me }) => {
        try {
          const currentDate = new Date();
          const user = await models.User.findByPk(me.id);

          const isValid = await user.validateOTP(otp);

          if (isValid) {
            if (
              currentDate - new Date(user.otpCreatedAt) <=
              process.env.OTP_DURATION
            ) {
              await user.update({
                validatedUser: true,
                otp: null,
                otpCreatedAt: null,
              });

              return user;
            } else {
              await user.update({
                otp: null,
                otpCreatedAt: null,
              });

              await user.save();
            }
          }
        } catch (error) {
          throw new UserInputError("Code send is not valid, or it has expired");
        }
      }
    ),
  },
  // User to parse default return information into login payload
  LoginPayload: {
    user: async (user) => {
      return user;
    },
    token: async (user, _args, { secret }) => {
      return await {
        token: createToken(user, secret, "600m"),
      };
    },
  },
  Subscription: {
    exchangeRateUpdated: {
      subscribe: () => pubsub.asyncIterator(EVENTS.EXCHANGE_RATE.UPDATED),
    },
  },
};
