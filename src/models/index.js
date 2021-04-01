import Sequelize from "sequelize";
import testDB from './testingVariables'

const sequelize = new Sequelize(
  process.env.DATABASE || testDB.DATABASE,
  process.env.DATABASE_USER || testDB.DATABASE_USER,
  process.env.DATABASE_PASSWORD || testDB.DATABASE_PASSWORD,
  {
    host: process.env.HOST || testDB.HOST,
    port: process.env.PORT || testDB.PORT,
    dialect: process.env.DIALECT || testDB.DIALECT,
  }
);

const models = {
  User: sequelize.import('./user')
};

Object.keys(models).forEach((key) => {
  if ("associate" in models[key]) {
    models[key].associate(models);
  }
});

console.log(models)

export { sequelize };
export default models;
