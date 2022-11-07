"use-strict";
import { connectToDatabase, getDatabase } from "./database/connection.mjs"
import * as dotenv from 'dotenv';
import colors from "colors";
import express, { json, urlencoded } from "express";
import path from "path";
let app = express();
import cors from "cors";

let allowedOrigins = [
  `${process.env.SERVER1}`,
  `${process.env.SERVER2}`,
  `${process.env.SERVER3}`,
];
dotenv.config();
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
app.use(json({ limit: "200mb" }));
app.use(urlencoded({ limit: "200mb", extended: true }));

const PORT = process.env.PORT || 6342;

const userdb = [];

let database;
const key = process.env.SERVER_API_KEY;

app.get(`/`, (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  if (apikey === key) {
    res.status(200).send({ message: "You are running v1.1.0 of this API" });
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
});

/* creating a new user account. */
app.post("/signup", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  let { password, age, username} =
    req.body;
  const identifyuserAuthStatus = userdb.find(
    (identifyuserAuthStatus) => identifyuserAuthStatus.email === req.body.email
  );

  if (apikey === key) {
    CheckIfUserAlreadyExist(
      identifyuserAuthStatus,
      req,
      res,
      password,
      age,
      username
    );
  } else {
    res.status(400).send({ error: "API key is invalid or required" });
  }
});
function CheckIfUserAlreadyExist(
  identifyuserAuthStatus,
  req,
  res,
  password,
  age,
  username
) {
  if (identifyuserAuthStatus) {
    res.status(409).send({
      error: "You already have an account with that email address",
    });
  } else {
    ContinueSignupProcess(password, age, username, req, res);
  }
}
const ContinueSignupProcess = (password, age, username, req, res) => {
  if (age < 18) {
    res.status(401).send({
      error: "You must be at least 18 years old or older to sign up.",
    });
  } else {
    CheckForPasswordLenght(password, req, res);
  }
};

async function CheckForPasswordLenght(password, req, res) {
  if (password.length > 10) {
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
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    req.body.publicID = result;
    req.body.admin = true;
    req.body.profile_image =
      "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";
    req.body.banner_image = "unknown.png";
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
    res.status(400).send({
      error: "Couldn't complete your request because your password is weak",
    });
  }
}

app.get("/userdb", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const key = process.env.SERVER_API_KEY;
  const apikey = req.headers.apikey;
  if (apikey === key) {
    res.send(userdb);
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
});

app.route("/login").post((req, res) => {
  login(res, req);
});

const login = (res, req) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const identifyuserAuthStatus = userdb.find(
    (identifyuserAuthStatus) =>
      identifyuserAuthStatus.email === req.body.email &&
      identifyuserAuthStatus.password === req.body.password
  );

  async function ValidateIfUserAccountExist() {
    if (identifyuserAuthStatus) {
      res.send(identifyuserAuthStatus);
    } else {
      res.status(403).send({
        error:
          "It seems like you don't have an account with us, try creating a new one",
      });
    }
  }

  if (apikey === key) {
    ValidateIfUserAccountExist();
  } else {
    res.status(400).send({
      error: "API KEY is invalid or required!",
    });
  }
};

app.put("/edit_profile", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const identifyuserAuthStatus = userdb.find(
    (identifyuserAuthStatus) =>
      identifyuserAuthStatus.email === req.body.email &&
      identifyuserAuthStatus.password === req.body.password
  );
  if (apikey === key) {
    CheckIfUserIsAuthenticated();
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
  function CheckIfUserIsAuthenticated() {
    if (identifyuserAuthStatus) {
      CheckBioLength();
    }
    function CheckBioLength() {
      const bios = req.body.bio;
      if (bios.length > 100) {
        res.status(200).send({
          error: "You must have at least " + 90 + " bio characters",
        });
      } else {
        ChangeInfo();
        res
          .status(200)
          .send({ message: "Profile has been updated successfully :)" });
      }
    }
    function ChangeInfo() {
      identifyuserAuthStatus.username = req.body.username;
      identifyuserAuthStatus.profile_image = req.body.profile_image;
      identifyuserAuthStatus.banner_image = req.body.banner_image;
      identifyuserAuthStatus.bio = req.body.bio;
    }
    if (!identifyuserAuthStatus) {
      res.status(403).send({
        error:
          "You are not authorized to edit your profile, please try loggin in or signing up and TryAgain",
      });
    }
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
app.post("/post", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const identifyuserAuthStatus = userdb.find(
    (identifyuserAuthStatus) =>
      identifyuserAuthStatus.email === req.body.email &&
      identifyuserAuthStatus.password === req.body.password
  );
  if (apikey === key) {
    CheckIfUserIsAuthenticated();
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
  /**
   * The function checks if the user is authenticated, if the user is authenticated, the function will
   * create a post, if the user is not authenticated, the function will return an error message.
   * @function -$CheckIfUserIsAuthenticated
   * @return {status - 401} - 401, if the user is not authenticated
   * @return {status - 200} - 200, if the user is authenticated, post user's post to the API.
   */
   function CheckIfUserIsAuthenticated() {
    if (identifyuserAuthStatus) {
      FetchRequiredInfoFromUserReq();
      posts.push(req.body);
      res.status(200).send({ message: "Post was successfully created." });
    } else {
      res.status(401).send({
        error: "You are unauthorized to make a post, please login/signup",
      });
    }
  }
  function FetchRequiredInfoFromUserReq() {
    req.body.created = combineDateToReasonableData;
    req.body.username = identifyuserAuthStatus.username;
    req.body.publicID = identifyuserAuthStatus.publicID;
    req.body.profile_image = identifyuserAuthStatus.profile_image;
    req.body.banner_image = identifyuserAuthStatus.banner_image;
  }
});

app.get("/post", (req, res) => {
  if (posts === undefined || posts.length == 0) {
    res.status(500).send({
      xresponse:
        "couldn't find any post on hastag database Try refreshing or try again",
    });
  } else {
    res.status(200).send(posts);
  }
});

const comments = [];
app.post("/comment", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  const identifyuserAuthStatus = userdb.find(
    (identifyuserAuthStatus) =>
      identifyuserAuthStatus.username === req.body.username
  );
  if (apikey === key) {
    CheckIfUserExist();
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
  function CheckIfUserExist() {
    if (identifyuserAuthStatus) {
      identifyuserAuthStatus.comments = comments;
      comments.push(req.body.comment);
      res.send({ message: "Comment was successfully created." });
    } else {
      res.status(401).send({
        error: "You are unauthorized to comment on this post",
      });
    }
  }
});
const upload_database = [];
app.route("/upload").post((req, res) => {
  const apikey = req.headers.apikey;
  const { files } = req.body;
  const identifyuserAuthStatus = userdb.find(
    (identifyuserAuthStatus) => identifyuserAuthStatus.email === req.body.email
  );
  CheckIfAPIKeyIsValid(apikey, files, identifyuserAuthStatus, req, res);
});
function CheckIfAPIKeyIsValid(apikey, req, res) {
  if (apikey === key) {
    CheckIfUserIsAuthenticated(identifyuserAuthStatus, req, res);
  } else {
    res.status(400).send({ error: "API KEY is invalid or required!" });
  }
}
async function CheckIfUserIsAuthenticated(identifyuserAuthStatus, req, res) {
  if (identifyuserAuthStatus) {
    CheckFileTypeRequirement(req, res);
  } else {
    res.status(401).send({
      error:
        "You are unauthorized to upload a file, please login/signup to continue",
    });
  }
}
async function CheckFileTypeRequirement(req, res) {
  const filetype = req.body.files.fileType;
  try {
    if (
      filetype === "image/jpeg" ||
      filetype === "image/png" ||
      filetype === "image/gif" ||
      filetype === "image/jfif" ||
      filetype === "image/jpg" ||
      filetype === "video/mp4"
    ) {
      CheckFileSizeRequirement(req, res);
    } else {
      console.log("Failed to upload file: ");
      res.send({ error: "Failed to upload file" });
    }
  } catch (error) {
    res.status(412).send({
      error,
    });
  }
}
function CheckFileSizeRequirement(req, res) {
  const fileSizeLimit = 98103;
  const userUploadFileSize = req.body.files.fileSize;
  try {
    if (userUploadFileSize > fileSizeLimit) {
      throw new Error("File size limit exceeded");
    } else {
      UploadFilesToDatabase(req, res);
    }
  } catch (error) {
    res
      .status(413)
      .send({ error: "Your file is too large for the server to handle" });
  }
}
function UploadFilesToDatabase(req, res) {
  req.body.files.username = identifyuserAuthStatus.username;
  req.body.files.created = combineDateToReasonableData;
  console.log("File upload completed");
  upload_database.push(req.body.files);
  res.send({ message: "Your File has been Uploaded Succesfully" });
}
app.get("/upload", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  if (apikey === key) {
    res.send(upload_database);
  } else {
    res.status(401).send({ error: "API KEY is invalid or required!" });
  }
});

app.route("/profile/:publicID").get((req, res) => {
  res.setHeader("Content-Type", "application/json");
  const apikey = req.headers.apikey;
  if (apikey === key) {
    FetchUserDataViaID(res, req);
  } else {
    res.status(401).send({error: 'API Key is Invalid or not provided'})
  }
});
function FetchUserDataViaID(res, req) {
  const publicID = req.params.publicID;
  console.log(publicID);
  const result = posts.find(
    (result) => result.publicID === req.params.publicID
  );
  try {
    CheckIfIDIsValid();
  } catch (error) {
    res.status(500).send({
      error: error,
    });
  }
  function CheckIfIDIsValid() {
    if (!result) {
      res
        .status(404)
        .send({ error: "You must make a post to have the access to changing your profile details" });
    } else {
      res.send(result);
    }
  }
}
const trends_data = [
  {
    icon: "#",
    trends: "Hashtag",
    url: "http://localhost:5173/trends",
    created: "21-Oct-22",
    likes: "1K People Likes It",
    intrest: "1K People Intrested",
    _id: "0ab",
  },
];

app.route("/trends").get((req, res) => {
  res.send(trends_data);
});

app.route("/add-trends").post((req, res) => {
  AddNewTrends(res, req);
});

async function AddNewTrends(res, req) {
  const apikey = req.headers.apikey;
  if (apikey === key) {
    const trends = req.body;

    /* The above code is checking if the trends array has more than one element. If it does, it returns a
 400 error. If it doesn't, it returns a 200 success message. */
    if (trends.length > 1) {
      res.status(400).send({ error: "You can only add one trends at a time" });
    } else {
      trends_data.push(trends);
      await database
        .collection("trends")
        .insertOne(trends)
        .then((result) => {
          console.log(result);
        })
        .catch((error) => {
          console.log(error);
        });
      res.status(200).send({
        message: "Trend created succesffully",
        error: false,
        visibleToDatabase: true,
      });
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
