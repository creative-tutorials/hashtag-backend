let colors = require("colors");
let express = require("express");
const path = require("path");
const { readFile } = require("node:fs/promises");
const { LocalStorage } = require("node-localstorage");
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
        res.status(403).send({
          error:
            "We had issues editing your profile because of some invalid credentials",
        });
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

const posts = [
  {
    username: "Timi",
    post: "Hello World",
    status: "posting",
    created: "June 14 2016",
  },
];
const getCurrentMonth = new Date();
const getCurrentDate = new Date();
const getFullYear = new Date();
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
/** Getting the current month and assigning it to the variable currentMonth. 
 * The currentMonth variable will be returned to as MonthOfTheDay - But displayed as Strings e.g. "January" or "February"
 * @return {String} - The current month
 * @return {number} - The current date
 * @return {number} - The current year
 * @example - This was used for testing purposes only
 * @uses - The date will be stored on user's post - The last date,month,and year user made a post[This is what is used for]
*/
const currentMonth = months[getCurrentMonth.getMonth()];
const fetchingCurrentDate = getCurrentDate.getDate();
const fetchCurrentYear = getFullYear.getFullYear();
const combineDateToReasonableData = currentMonth + ' ' + fetchingCurrentDate + ' ' + fetchCurrentYear;
app.post("/make_post", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const identifyuserAuthStatus = userdb.find(
    (identifyuserAuthStatus) =>
      identifyuserAuthStatus.email === req.body.email &&
      identifyuserAuthStatus.password === req.body.password &&
      identifyuserAuthStatus.username === req.body.username
  );
  function RunFindMailIfCheck() {
    if (identifyuserAuthStatus) {
      // console.log(fetchingDatePostWasMade);
      req.body.created = combineDateToReasonableData;
      console.log('post req', req.body.post);
      posts.push(req.body);
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

app.get("/post", (req, res) => {
  if (posts === undefined || posts.length == 0) {
    console.log("empty");
    res.status(200).send({
      xresponse:
        "couldn't find any post on hastag database Try refreshing or try again",
    });
  } else {
    console.log("not empty");
    res.status(200).send(posts);
    console.log(posts);
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
const uploads = [];
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
      req.body.files.dataURL = "";
      console.log("Your File has been Uploaded Succesfully");
      res.send({ message: "Your File has been Uploaded Succesfully" });
      uploads.push(req.body.files);
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
        res.send({ message: "Failed to upload file" });
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
app.get("/upload", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  if (apikey === key) {
    res.send(uploads);
    try {
      /* Creating a new AbortController object. */
      const controller = new AbortController();
      /* Destructuring the signal property from the controller object. */
      const { signal } = controller;
      /* Reading the file and converting it to a base64 string. */
      const promise = readFile("upload/002.jfif", { signal });

      /* Abort the request before the promise settles. */
      // controller.abort();

      /* Awaiting the promise to settle. */
      await promise;
      /* Converting the file  to a base64 string. */
      const convertBufferToBase64Encoding = (await promise).toString("base64");
      console.log(convertBufferToBase64Encoding);
    } catch (err) {
      /** Logging the error to the console if there's an error.
       * @return {string}
       */
      console.error(err);
    }
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
