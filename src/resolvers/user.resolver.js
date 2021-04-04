import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} from "apollo-server";
import { combineResolvers } from "graphql-resolvers";
import { isAdmin, isAuthenticated } from "./permissions/globalPermissions";
import {
  pubsub,
  EVENTS,
  fetchAPI,
  generateOTP,
  generateEmailSender,
  validateOTP
} from "../utils";

// Handles token creation usign user fields to create jwt token
const createToken = async (user, secret, expiresIn) => {
  const { id, email, username, role } = user;
  return await jwt.sign({ id, email, username, role }, secret, {
    expiresIn,
  });
};

const shouldFetch = false;

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
    getExchangeRate: combineResolvers(
      isAuthenticated,
      async () => {
        const exchangeRate = await fetchAPI(shouldFetch);

        return {
          usd: exchangeRate.quote.USD.price,
          lastUpdated: exchangeRate.last_updated,
        };
      }
    ),
    requestOTP: async (_parent, { input: { email } }, { models }) => {
      const user = models.User.findOne({
        where: {
          email,
        },
      });

      const emailSender = await generateEmailSender();

      if (user) {
        const otp = await generateOTP();
        await user.update({ otp });
        await user.save();
        await emailSender.sendEmail({
          to: user.email,
          subject: "BTC/USD requested code",
          text: otp,
        });
      }

      return {
        message:
          "If the email belongs to a registered user, a code will be send to that email",
      };
    },
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
        otp,
      });
      let validOTP = false;
      let otp;

      do {
        otp = await generateOTP(300);
        const users = await models.User.findAll({
          where: {
            otp,
          },
        });

        if (!users || users.length === 0) {
          validOTP = true;
          await emailSender.sendEmail({
            to: user.email,
            text: otp,
            subject: "Account created successfully",
          });
        }
      } while (!validOTP);

      return true;
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
      isAuthenticated,
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

    validateUser: async (_parent, { input: otp}, { models }) => {
      console.log(otp)
      const user = models.User.findOne({
        where: {
          otp: otp.otp
        }
      })

      console.log(user)

      const validOTP = await validateOTP({ otp: otp.otp })
      console.log(validOTP)
      if (user && validOTP) {
        await user.update({
          validatedUser: true
        })

        await user.save()

        console.log(user)
        
        return user

      }
    },
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
    exchangeRateUpdated: console.log("I HAVE BEEN CALLED") || {
      subscribe: () => pubsub.asyncIterator(EVENTS.EXCHANGE_RATE.UPDATED),
    },
  },
};
