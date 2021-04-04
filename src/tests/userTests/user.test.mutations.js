import gql from "graphql-tag";

export const LOGIN = gql`
  mutation login($input: SignInInput!) {
    signIn(input: $input) {
      user {
        id
        name
        username
        email
        role
      }
      token {
        token
      }
    }
  }
`;

export const UPSERT_USER = gql`
  mutation upsertUser($input: UpsertUserInput!) {
    upsertUser(input: $input) {
      id
      name
      username
      role
      email
    }
  }
`;

export const SIGNUP = gql`
  mutation signUp($input: SignUpInput!) {
    signUp(input: $input) {
      user {
        id
        name
        username
        email
        role
      }
      token {
        token
      }
    }
  }
`;

export const VALIDATE_USER = gql`
  mutation validateUser($input: ValidateUserInput!) {
    validateUser(input: $input) {
      user {
        id
        name
        username
        email
      }
      token {
        token
      }
    }
  }
`;
