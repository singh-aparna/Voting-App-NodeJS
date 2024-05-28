const mongoose = require("mongoose");
require("dotenv").config();
// define the mongodb connection url
const mongoURL = process.env.MONGODB_URL_LOCAL;
//const mongoURL=process.env.MONGODB_URL;

mongoose.connect(mongoURL, {
  useNewUrlParser: true,
});
const db = mongoose.connection;
db.on("connected", () => {
  console.log("Connected to mongodb server.");
});
db.on("error", (err) => {
  console.log("Mongodb connection error.", err);
});
db.on("disconnected", () => {
  console.log("Disconnected");
});
module.exports = db;
