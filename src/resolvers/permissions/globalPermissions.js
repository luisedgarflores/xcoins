import { ForbiddenError } from "apollo-server";
import { skip, combineResolvers } from "graphql-resolvers";

export const isAuthenticated = (parent, args, { me }) => {
  me ? skip : new ForbiddenError("Authentication is mandatory");
};

export const isAdmin = combineResolvers(
  isAuthenticated,
  async (parent, args, { me }) => {
    if (me.role !== "ADMIN") {
      throw new ForbiddenError("User does not have admin permissions");
    }

    return skip;
  }
);
