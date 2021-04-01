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