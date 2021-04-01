import factory from "factory-girl";
import models from "../../models";


function DumbUser ({username, name, password, email, role})  {
  this.username = username
  this.name = name
  this.password = password
  this.email = email
  this.role = role

  this.get = function() {
    return this
  }

  this.save = function() {
    return this
  }
}

factory.define("User", models.User, (buildOptions = { role: "CLIENT" }) => {
  const attrs = {
    email: factory.sequence(
      "user.email",
      (n) => `dummy-${buildOptions.role}-${n}@my-domain.com`
    ),
    password: "12345678",
    name: factory.chance("name"),
    username: factory.chance("word"),
    role: buildOptions.role,
  };

  return attrs;
});

factory.define("DumbUser", DumbUser, (buildOptions = { role: "CLIENT" }) => {
  const attrs = {
    email: factory.sequence(
      "user.email",
      (n) => `dummy-${buildOptions.role}-${n}@my-domain.com`
    ),
    password: "12345678",
    name: factory.chance("name"),
    username: factory.chance("word"),
    role: buildOptions.role,
  };

  return attrs;
});


factory.define("InvalidDumbUser", DumbUser, (buildOptions = { role: "CLIENT" }) => {
  const attrs = {
    email: factory.sequence(
      "user.email",
      (n) => `dummy-${buildOptions.role}-${n}@my-domain.com`
    ),
    password: "12345678",
    username: factory.chance("word"),
    role: buildOptions.role,
  };

  return attrs;
});