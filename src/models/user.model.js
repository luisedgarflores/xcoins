import bcrypt from "bcrypt";
import { UserInputError, ForbiddenError } from "apollo-server";

const UserDefinition = (sequelize, DataTypes) => {
  // Definition of user fields and it's types
  const User = sequelize.define(
    "users",
    {
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [7, 42],
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: true,
          isEmail: true,
        },
      },
    },
    {
      freezeTableName: true, // Disable sequelize default pluralization of tables
      timestamps: true, // Automatically add updatedAt and createdAt for each instance
    }
  );

  User.updateInstance = async ({ data, loggedInUser }) => {
    if (data && loggedInUser) {
      if (loggedInUser.role === "ADMIN" || loggedInUser.id === data.id) {
        const { id } = data;
        const user = await User.findByPk(parseInt(id));

        if (!user) throw new UserInputError("User sent does not exist");

        await user.update(data);

        await user.save();

        return user;
      }
    }

    throw new UserInputError("The input provided is not valid");
  };

  User.createInstance = async ({ data, loggedInUser }) => {
    if (data && loggedInUser) {
      if (loggedInUser.role === "ADMIN") {
        return await User.create(data);
      }
    }
    throw new ForbiddenError("You are not allowed to perform this action");
  };

  User.findByLogin = async (login) => {
    let user = await User.findOne({
      where: { username: login },
    });

    if (!user) {
      user = await User.findOne({
        where: { email: login },
      });
    }

    return user;
  };

  User.beforeCreate(async (user) => {
    user.password = await user.generatePasswordHash();
  });

  User.prototype.generatePasswordHash = async function () {
    const saltRounds = 10;
    return await bcrypt.hash(this.password, saltRounds);
  };

  User.prototype.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
  };

  return User;
};

export default UserDefinition;
