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
      otp: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      otpCreatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      validatedUser: {
        type: DataTypes.BOOLEAN,
        default: false,
      },
    },
    {
      freezeTableName: true, // Disable sequelize default pluralization of tables
      timestamps: true, // Automatically add updatedAt and createdAt for each instance
    }
  );

  // Wrapper for class update function, validates extra permission and data
  User.updateInstance = async ({ data, loggedInUser }) => {
    if (data && loggedInUser) {
      if (
        loggedInUser.role === "ADMIN" ||
        loggedInUser.id.toString() === data.id
      ) {
        const { id } = data;
        const user = await User.findByPk(parseInt(id));

        if (!user) throw new UserInputError("User sent does not exist");

        await user.update(data);

        await user.save();

        return user;
      }
    }

    throw new UserInputError("Invalid data provided");
  };

  //  Wrapper for class create function, validates permissions and data existance
  User.createInstance = async ({ data, loggedInUser }) => {
    if (data && loggedInUser) {
      if (loggedInUser.role === "ADMIN") {
        return await User.create(data);
      }
    }
    throw new ForbiddenError("User does not have admin permissions");
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

  // Hook to hash user password before instance gets stored in the db
  User.beforeCreate(async (user) => {
    user.password = await user.generatePasswordHash();
  });

  User.beforeUpdate(async (user) => {
    user.otp = user.otp ? await user.generateOTPHash() : user.otp;
  });

  // Handles password hashing using bcrypt
  User.prototype.generatePasswordHash = async function () {
    const saltRounds = 10;
    return await bcrypt.hash(this.password, saltRounds);
  };

  User.prototype.generateOTPHash = async function () {
    const saltRounds = 3;
    return await bcrypt.hash(this.otp.toString(), saltRounds);
  };

  // Performs a comparission between input password and stored hashed password
  User.prototype.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
  };

  User.prototype.validateOTP = function (otp) {
    return bcrypt.compareSync(otp, this.otp);
  };

  return User;
};

export default UserDefinition;
