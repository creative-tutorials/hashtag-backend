import * as dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from "mongodb";
let databaseConnection;

export function connectToDatabase(callback) {
  MongoClient.connect(process.env.MONGODB_CONNECTION_STRING)
    .then((client) => {
      databaseConnection = client.db();
      return callback();
    }).catch((error) => {
      console.log(error);
      return callback(error);
    });
}
export function getDatabase() { return databaseConnection; }