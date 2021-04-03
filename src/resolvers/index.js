import userResolvers from './user.resolver'
import { GraphQLDateTime } from 'graphql-iso-date'

const customScalarResolver = {
  Date: GraphQLDateTime,
}

export default [
  customScalarResolver,
  userResolvers,
]