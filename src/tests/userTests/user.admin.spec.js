const { createAdmin } = require('./utils')
const { deleteAllRecords } = require('../utils')
const chai = require('chai')
const chaiString = require('chai-string')
chai.use(chaiString)
const {
  expect
} = chai

let admin

const AdminSetup = async () => {
  await deleteAllRecords()
  const currentAdmin = await createAdmin()
  return currentAdmin
}

describe('Login tests', async() => {
  it(() => async() => {
    
  })
})

describe('Create users test', async () => {
  beforeEach(async () => {
    admin = await AdminSetup()
  });

  it('setup test', async() => {
    console.log(admin)
  })
})