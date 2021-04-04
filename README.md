# Backend

How to run the server

* Go to env variables and change it to your proper db configurations
* run npm install
* run npm start

Features

* Client and Admin roles were implemented
* Passwords are hashed
* All routes are protected, leaving only login as public
* Routes are tested for both user roles
* Tests use mocka, chai and factory-girl to generate data and validate it with the server
* Websocket was implemented using graphQL subscriptions, it call the coinmarketcap api every 60 seconds (since it is the time it takes to obtain an updated value from the API request used in this implementation), afterwards, the information is passed to all the clients subscribed.
* Instead of postman collections, graphQL playground can be accessed in localhost:8000/graphql
* The API manages two factor authentication for the signup, using nodemailer and otp to send a code to the registered user, this code is also saved and hashed in database, and it expires in 5 minutes.
* A non validated user can login, but it will have to re send the code to it’s email, this functionality is also implemented

Considerations

* For this implementation, postgress was used for the db server, but, I implemented all database accesses using sequelize, so, by changing the dialect in .env file (including custom db credentials), the project can be run using mysql with no problems.
* All tests run with random generated data, this ensures that each one of them is completely independent from external influence.

