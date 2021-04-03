import { PubSub } from 'apollo-server'
import * as EXCHANGE_RATE_EVENTS from './exchangeRate'

export const EVENTS = {
  EXCHANGE_RATE: EXCHANGE_RATE_EVENTS
}

export default new PubSub()