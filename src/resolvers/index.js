import userResolvers from './user'
import { GraphQLDateTime } from 'graphql-iso-date'

const customScalarResolver = {
  Date: GraphQLDateTime,
}

export default [
  customScalarResolver,
  userResolvers,
]