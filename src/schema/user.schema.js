import { gql } from "apollo-server-express";

export default gql`
  extend type Query {
    me: User
    getUser(input: GetUserInput!): User!
    getUsers: [User!]!
  }

  extend type Mutation {
    signUp(input: SignUpInput!): Token!
    signIn(input: SignInInput!): LoginPayload!
    deleteUser(input: DeleteUserInput!): Boolean!
    upsertUser(input: UpsertUserInput!): User!
  }

  type Token {
    token: String!
  }

  input SignInInput {
    login: String!
    password: String!
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
  }

  input UpsertUserInput {
    id: ID
    name: String
    username: String
    role: String
    email: String!
    password: String!
  }

  input GetUserInput {
    id: ID!
  }

  input SignUpInput {
    username: String!
    nombre: String!
    email: String!
    password: String!
  }

  enum Roles {
    ADMIN
    CLIENT
  }
`;
