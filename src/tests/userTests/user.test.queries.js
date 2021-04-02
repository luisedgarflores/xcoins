import gql from 'graphql-tag'

export const GET_USERS = gql`
  query getUsers {
    getUsers{
      id
      name
      username
      email
      role
    }
  }
`

export const GET_USER = gql`
  query getUser($input: GetUserInput!) {
    getUser(input: $input){
      id
      name
      username
      email
      role
    }
  }
`