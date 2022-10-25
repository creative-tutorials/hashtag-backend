"use-strict";
const { connectToDatabase, getDatabase } = require("./database/mongodb");
let colors = require("colors");
let express = require("express");
const path = require("path");
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

/* Setting the limit of the data that can be sent to the server. */
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));

const PORT = process.env.PORT || 6342;

const userdb = [];
let currentYear = new Date().getFullYear();

let database;
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

/* creating a new user account. */
app.post("/signup", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  let { publicID, password, age, genLimit } = req.body;
  const findemail = userdb.find(
    (findemail) => findemail.email === req.body.email
  );

  if (apikey === key) {
    const ContinueSignupProcess = () => {
      async function CheckForPasswordLenght() {
        if (password.length > 10) {
          console.log("Password is strong");
          /* Declaring a variable named length and assigning it the value of 8. */
          const length = 8;
          let result = "";
          let characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          /** Creating a variable called charactersLength and assigning it the value of the length of
          the characters string. 
          *@return {number} - the characters string length
          */
          let charactersLength = characters.length;
          for (let i = 0; i < length; i++) {
            result += characters.charAt(
              Math.floor(Math.random() * charactersLength)
            );
          }
          req.body.publicID = result;
          req.body.username = "YOUR_USERNAME";
          req.body.genLimit = 0;
          res.status(200).send(req.body);
          userdb.push(req.body);
          await database
            .collection("users")
            .insertOne(req.body)
            .then((result) => {
              console.log(result);
            })
            .catch((error) => {
              console.log(error);
            });
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

app.route("/login").post((req, res) => {
  login(res, req);
});

/**
 * Trying to log user in - to have access to the app, while logging in the user, we're validating the password and email address
 * The validation is taken place to make sure, user has an account with our software
 * We then give user back the access to the app, if validation is complete and succesfull
 * @param res - response object
 * @param req - request
 */
const login = (res, req) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const finduser = userdb.find(
    (finduser) =>
      finduser.email === req.body.email &&
      finduser.password === req.body.password
  );

  async function CheckDatabase() {
    if (finduser) {
      res.send(finduser);
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
    res.status(400).send({
      error: "API KEY is invalid or required!",
    });
  }
};

app.put("/edit_profile", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const finduser = userdb.find(
    (finduser) =>
      finduser.email === req.body.email &&
      finduser.password === req.body.password
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
      if (finduser) {
        function CheckBioLength() {
          const bios = req.body.bio;

          if (bios.length > 100) {
            res.status(200).send({
              error: "You must have at least " + 90 + " bio characters",
            });
          } else {
            finduser.username = req.body.username;
            finduser.bio = req.body.bio;
            finduser.dob = req.body.dob;
            res
              .status(200)
              .send({ message: "Profile has been updated successfully :)" });
          }
        }
        CheckBioLength();
      }
      if (!finduser) {
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
    res.status(500).send({
      error:
        "The server encountered an unexpected condition that prevented it from fulfilling the request.",
    });
  }
});

const posts = [
  {
    username: "Hashtag",
    post: "Welcome to hashtag",
    status: "posting",
    pfp: "",
    image: "",
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
const currentMonth = months[getCurrentMonth.getMonth()];
const fetchingCurrentDate = getCurrentDate.getDate();
const fetchCurrentYear = getFullYear.getFullYear();
const combineDateToReasonableData =
  currentMonth + " " + fetchingCurrentDate + " " + fetchCurrentYear;
app.post("/make_post", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const identifyuserAuthStatus = userdb.find(
    (identifyuserAuthStatus) =>
      identifyuserAuthStatus.email === req.body.email &&
      identifyuserAuthStatus.password === req.body.password
  );
  /**
   * The function checks if the user is authenticated, if the user is authenticated, the function will
   * create a post, if the user is not authenticated, the function will return an error message.
   * @function -$CheckIfUserIsAuthenticated
   * @return {status - 401} - 401, if the user is not authenticated
   * @return {status - 200} - 200, if the user is authenticated, post user's post to the API.
   */
  function CheckIfUserIsAuthenticated() {
    if (identifyuserAuthStatus) {
      // console.log(fetchingDatePostWasMade);
      req.body.created = combineDateToReasonableData;
      req.body.username = identifyuserAuthStatus.username;
      console.log("post req", req.body.post);
      console.log(identifyuserAuthStatus.username);
      posts.push(req.body);
      res.status(200).send({ message: "Post was successfully created." });
    } else {
      res.status(401).send({
        error: "You are unauthorized to make a post, please login/signup",
      });
    }
  }
  if (apikey === key) {
    CheckIfUserIsAuthenticated();
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
    res.status(500).send({
      error:
        "The server encountered an unexpected condition that prevented it from fulfilling the request.",
    });
  }
});
const uploads = [];
app.post("/upload", (req, res) => {
  const filetype = req.body.files.fileType;
  console.log(filetype);
  const apikey = req.headers.apikey;
  const { files } = req.body;
  const identifyuserAuthStatus = userdb.find(
    (identifyuserAuthStatus) => identifyuserAuthStatus.email === req.body.email
  );

  const CheckForFileSize = async () => {
    const fileSizeLimit = 98103;
    const userUploadFileSize = req.body.files.fileSize;
    try {
      if (userUploadFileSize > fileSizeLimit) {
        throw new Error("File size limit exceeded");
      } else {
        req.body.username = identifyuserAuthStatus.username;
        console.log("File upload completed");
        uploads.push(req.body.files);
        res.send({ message: "Your File has been Uploaded Succesfully" });
      }
    } catch (error) {
      res
        .status(413)
        .send({ error: "Your file is too large for the server to handle" });
      console.log("Your file is too large for the server to handle");
    }
  };
  const UserHasRegisterd = () => {
    CheckForFileSize();
    try {
      if (
        filetype === "image/jpeg" ||
        filetype === "image/png" ||
        filetype === "image/gif" ||
        filetype === "image/jfif" ||
        filetype === "image/jpg" ||
        filetype === "video/mp4"
      ) {
        console.log("file type meets the requirements");
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
    if (identifyuserAuthStatus) {
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
    try {
      res.send(uploads);
    } catch (err) {
      res.status(500).send({
        error:
          "The server encountered an unexpected condition that prevented it from fulfilling the request.",
      });
    }
  } else {
    res.status(401).send({ error: "API KEY is invalid or required!" });
  }
});

app.route("/generateUsername").post((req, res) => {
  UsernameGenerator(res, req);
});
const Maxedgeneratelimit = 2;
function UsernameGenerator(res, req) {
  if (!req.body.length) {
    console.log(req.body);
    res.status(406).send({ error: "request of length is not specified" });
  } else {
    Send_User_The_GeneratedUsername();
  }

  function Send_User_The_GeneratedUsername() {
    const finduser = userdb.find(
      (finduser) =>
        finduser.email === req.body.email &&
        finduser.password === req.body.password
    );
    if (finduser) {
      CheckForMaxedOutLimitOnUser();
    } else {
      res.status(401).send({
        error:
          "You would need to login/signup first to be able to generate your unique username",
      });
    }
    async function CheckForMaxedOutLimitOnUser() {
      if (finduser.genLimit > Maxedgeneratelimit) {
        console.log(Maxedgeneratelimit);
        res.status(400).send({
          error:
            "Hi There! you have reached your daily limit of 10 username generators",
        });
      } else {
        const length = req.body.length;
        const num = 8;
        const randomNameGenerator = (length) => {
          let res = "";
          for (let i = 0; i < length; i++) {
            const random = Math.floor(Math.random() * 27);
            res += String.fromCharCode(97 + random);
          }
          return res;
        };
        finduser.genLimit++;
        finduser.username = randomNameGenerator(length);
        res.send({ YOUR_GENERATED_USERNAME: randomNameGenerator(length) });
      }
    }
  }
}
const trending = [
  {
    icon: "#",
    trends: "Hashtag",
    url: "http://localhost:5173/trends",
    created: "21-Oct-22",
    likes: "1K People Likes It",
    intrest: "1K People Intrested",
    _id: "0ab"
  },
];

app.route("/trends").get((req, res) => {
  TrendingList(res, req);
});

function TrendingList(res, req) {
  res.send(trending);
}

app.route("/add-trends").post((req, res) => {
  AddNewTrends(res, req);
});

async function AddNewTrends(res, req) {
  const apikey = req.headers.apikey;
  if(apikey === key) {
    const trends = req.body;

  /* The above code is checking if the trends array has more than one element. If it does, it returns a
 400 error. If it doesn't, it returns a 200 success message. */
  if (trends.length > 1) {
    res.status(400).send({ error: "You can only add one trends at a time" });
  } else {
    console.log({message: 'Trend created succesffully', error: false, visibleToDatabase: true});
    trending.push(trends);
    await database
      .collection("trends")
      .insertOne(trends)
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.log(error);
      });
    res
      .status(200)
      .send({message: 'Trend created succesffully', error: false, visibleToDatabase: true});
  }
  } else {
    return res.status(401).send({ error: "API KEY is invalid or required!" });
  }
}

app
  .listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
    function connectionMadeToMongoDB() {
      connectToDatabase((error) => {
        if (!error) {
          console.log("Connected to MongoDB atlas successfully".green);
          database = getDatabase();
        } else {
          console.log("Failed to connect to MongoDB atlas".underline.red);
        }
      });
    }
    connectionMadeToMongoDB();
  })
  .on("error", function (err) {
    console.log(err);
  });
