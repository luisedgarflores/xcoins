import factory from "factory-girl"
import models from "../../models";

factory.define("User", models.User, (buildOptions = { role: "CLIENT" }) => {
  const attrs = {
    email: factory.sequence(
      "user.email",
      (n) => `dummy-user-${n}@my-domain.com`
    ),
    password: '12345678',
    name: factory.chance("name"),
    username: factory.chance("word"),
    role: buildOptions.role
  };

  return attrs;
});
