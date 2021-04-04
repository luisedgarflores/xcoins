import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    me: User
    getUser(input: GetUserInput!): User!
    getUsers: [User!]!
    getExchangeRate: ExchangeRate!
    requestOTP: Boolean!
  }

  extend type Mutation {
    signUp(input: SignUpInput!): LoginPayload!
    signIn(input: SignInInput!): LoginPayload!
    deleteUser(input: DeleteUserInput!): Boolean!
    upsertUser(input: UpsertUserInput!): User!
    validateUser(input: ValidateUserInput!): LoginPayload!
  }

  extend type Subscription {
    exchangeRateUpdated: ExchangeRate!
  }

  type ExchangeRate {
    usd: String!
    lastUpdated: Date!
  }

  type OTPRequested {
    message: String!
  }

  type Token {
    token: String!
  }

  input SignInInput {
    login: String!
    password: String!
  }


  input ValidateUserInput {
    otp: String!
  }

  type LoginPayload {
    user: User!
    token: Token!
  }

  input DeleteUserInput {
    id: ID!
  }

  type User {
    id: ID!
    name: String!
    role: Roles!
    email: String!
    username: String!
    validatedUser: Boolean!
  }

  input UpsertUserInput {
    id: ID
    name: String
    username: String
    role: String
    email: String
    password: String
  }

  input GetUserInput {
    id: ID!
  }

  input SignUpInput {
    username: String!
    name: String!
    email: String!
    password: String!
  }

  enum Roles {
    ADMIN
    CLIENT
  }
`;
