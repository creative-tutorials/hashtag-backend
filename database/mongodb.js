require("dotenv").config({ path: __dirname + "/../.env.local" });
const { MongoClient } = require("mongodb");

let databaseConnection;

module.exports = {
  connectToDatabase: (callback) => {
    MongoClient.connect(process.env.MONGODB_CONNECTION_STRING)
    .then((client) => {
      databaseConnection = client.db();
      return callback();
    }).catch((error) => {
      console.log(error);
      return callback(error);
    })
  },
  getDatabase: () => databaseConnection,
};
