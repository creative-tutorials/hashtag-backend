let colors = require("colors");
let express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
var readimage = require("readimage");
const { LocalStorage } = require("node-localstorage");
const { Blob, resolveObjectURL } = require("buffer");
let app = express();
let cors = require("cors");
require("dotenv").config({ path: __dirname + "/.env.local" });
let allowedOrigins = [`${process.env.SERVER1}`, `${process.env.SERVER2}`];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 6342;

const userdb = [];
let currentYear = new Date().getFullYear();

/**
 * A constant variable that is storing the API key.
 * @returns {string} The API key for the server.
 */
app.use("/static", express.static(path.join(__dirname, "public")));
const key = process.env.SERVER_API_KEY;
app.get(`/`, (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  if (apikey === key) {
    res.status(200).send("Hello");
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
});

// Handle User Signup Request
app.post("/signup", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  let { id, email, password, age, dob, username, bio, post, comments } =
    req.body;
  const findemail = userdb.find(
    (findemail) => findemail.email === req.body.email
  );

  if (apikey === key) {
    const ContinueSignupProcess = () => {
      async function CheckForPasswordLenght() {
        if (password.length > 10) {
          console.log("Password is strong");
          const length = 32;
          let result = "";
          let characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          let charactersLength = characters.length;
          for (let i = 0; i < length; i++) {
            result += characters.charAt(
              Math.floor(Math.random() * charactersLength)
            );
          }
          req.body.id = result;
          req.body.username = "Bot";
          req.body.bio = "Bot Bio";
          req.body.post = "A bot posting";
          req.body.dob = "01/01/2000";
          req.body.comments = "Imagine a bot posting";
          res.status(200).send(req.body);
          userdb.push(req.body);
        } else {
          console.log("Password is not strong");
          res.status(400).send({
            error:
              "Couldn't complete your request because your password is weak",
          });
        }
      }

      if (age < 18) {
        res.status(401).send({
          error: "You must be at least 18 years old or older to sign up.",
        });
      } else {
        CheckForPasswordLenght();
      }
    };

    if (findemail) {
      res.status(409).send({
        error: "You already have an account with that email address",
      });
    } else {
      ContinueSignupProcess();
    }
  } else {
    res.status(400).send({ error: "API key is invalid or required" });
  }
});

app.get("/userdb", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const key = process.env.SERVER_API_KEY;
  const apikey = req.headers.apikey;
  if (apikey === key) {
    res.send(userdb);
    const lastElementOfTheUserArray = userdb[userdb.length - 1];
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
});

app.post("/login", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const findemail = userdb.find(
    (findemail) =>
      findemail.email === req.body.email &&
      findemail.password === req.body.password
  );
  function CheckDatabase() {
    if (findemail) {
      res.send({ message: "Login successful" });
    } else {
      res.status(403).send({
        error:
          "Your account is not authorized to access the requested resource.",
      });
    }
  }
  if (apikey === key) {
    CheckDatabase();
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
});

app.put("/edit_profile", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const findemail = userdb.find(
    (findemail) =>
      findemail.email === req.body.email &&
      findemail.password === req.body.password
  );

  /**
   * Finds the user with the given username and updates their profile with the given data.
   * @param {string} username - the username of the user to update
   * @param {string} email - the email of the user to update
   * @param {string} password - the password of the user to update
   * @param
   */
  try {
    function RunFindMailIfCheck() {
      if (findemail) {
        function CheckBioLength() {
          const bios = req.body.bio;

          if (bios.length > 100) {
            res.status(200).send({
              error: "You must have at least " + 90 + " bio characters",
            });
          } else {
            findemail.username = req.body.username;
            findemail.bio = req.body.bio;
            findemail.dob = req.body.dob;
            res
              .status(200)
              .send({ message: "Profile has been updated successfully :)" });
          }
        }
        CheckBioLength();
      }
      if (!findemail) {
        res.status(403).send({ error: "Error editting profile ＞︿＜" });
      }
    }
    if (apikey === key) {
      RunFindMailIfCheck();
    } else {
      res.status(400).send({ error: "API KEY is invalid or required!" });
    }
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error ＞︿＜" });
  }
});

const posts = [];
app.post("/make_post", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const findemail = userdb.find(
    (findemail) =>
      findemail.email === req.body.email &&
      findemail.password === req.body.password
  );
  function RunFindMailIfCheck() {
    if (findemail) {
      findemail.post = posts;
      posts.push(req.body.post);
      res.status(200).send({ message: "Post was successfully created." });
    } else {
      res.status(401).send({
        error: "You are unauthorized to make a post, please login/signup",
      });
    }
  }
  if (apikey === key) {
    RunFindMailIfCheck();
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
});

const comments = [];
app.post("/comment", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const { comment } = req.body;
  const finduser = userdb.find(
    (finduser) => finduser.username === req.body.username
  );
  try {
    function RunFindUserIfCheck() {
      if (finduser) {
        finduser.comments = comments;
        comments.push(req.body.comment);
        res.send({ message: "Comment was successfully created." });
      } else {
        res.status(401).send({
          error: "You are unauthorized to comment on this post",
        });
      }
    }
    if (apikey === key) {
      RunFindUserIfCheck();
    } else {
      res.status(400).send({ error: "API KEY is invalid or required!" });
    }
  } catch {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.post("/upload", (req, res) => {
  const filetype = req.body.files.fileType;
  console.log(filetype);
  const apikey = req.headers.apikey;
  const { files } = req.body;
  const findemail = userdb.find(
    (findemail) => findemail.email === req.body.email
  );
  /**
   * The RunFindMailIfCheck function is used to check if the user has logged in or not.
   * If they have, it will allow them to upload a file.
   * If they haven't, it will send an error message back saying that they are unauthorized and need to login/signup first.
   * @return A message if the user is authorized to upload a file 😉
   *
   * @docauthor 👀
   */

  const CheckForFileSize = () => {
    const fileSizeLimit2 = 1000000;
    const fileSize2 = req.body.files.fileSize;
    if (fileSize2 > fileSizeLimit2) {
      res.send({ error: "File size limit exceeded" });
    } else {
      console.log("Your File has been Uploaded Succesfully");
      res.send({ message: "Your File has been Uploaded Succesfully" });
      userdb.push(req.body.files);
    }
  };
  const UserHasRegisterd = () => {
    try {
      if (
        filetype === "image/jpeg" ||
        filetype === "image/png" ||
        filetype === "image/gif" ||
        filetype === "image/jfif" ||
        filetype === "image/jpg" ||
        filetype === "video/mp4"
      ) {
        CheckForFileSize();
      } else {
        console.log("Failed to upload file: ");
        res.send({ message: "Failed to upload file"});
      }
    } catch (error) {
      res.status(412).send({
        error,
      });
    }
  };
  async function CheckIfUserIsRegistered() {
    if (findemail) {
      UserHasRegisterd();
    } else {
      res.status(401).send({
        error:
          "You are unauthorized to upload a file, please login/signup to continue",
      });
    }
  }
  if (apikey === key) {
    CheckIfUserIsRegistered();
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
});

app.get("/upload", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  if (apikey === key) {
    res.send(userdb.files);
  } else {
    res.status(401).send({ error: "API KEY is invalid or required!" });
  }
});

app
  .listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
  })
  .on("error", function (err) {
    console.log(err);
  });
