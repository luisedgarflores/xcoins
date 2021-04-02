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