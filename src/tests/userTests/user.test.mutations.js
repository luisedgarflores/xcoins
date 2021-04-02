import gql from 'graphql-tag'

export const LOGIN = gql`
  mutation login($input: SignInInput!) {
    signIn(input: $input){
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
`

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
`