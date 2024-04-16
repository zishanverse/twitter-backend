const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const Tweets = require("./models/tweets")
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
const { MongoClient } = require('mongodb');
const MONGODB_URI = env.MONGODB_URI;


app.use(express.json());

const PORT = process.env.PORT || 3000;

const client = new MongoClient(uri);

async function connect() {
  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log('Connected to the MongoDB cluster');
  } catch (error) {
    console.error('Error connecting to the MongoDB cluster', error);
  }
}
connect().then(() => {
  app.listen(PORT, () => {
      console.log(`server is running on PORT ${PORT}`);
  });
});

const db = client.db('twitter');
  


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const authorization = (request, response, next) => {
  const auth = request.headers["authorization"];
  let jwtoken;
  if (auth !== undefined) {
    jwtoken = auth.split(" ")[1];
  }
  if (jwtoken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtoken, "MY_SECRET", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.email = payload.email;
        next();
      }
    });
  }
};



app.post("/register/", async (request, response) => {
  const { email, password, name, gender} = request.body;
  try {
    const userResponse = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
      disabled: false
  });
  const collection = db.collection('User');
  if (password.length < 6) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashPassword = await bcrypt.hash(password, 10);
    const result = await collection.insertOne({email, password: hashPassword, name, gender});
    console.log('Document inserted:', result);
    response.status(200);
    response.send("User created successfully");
  }
  }
  catch {
        response.status(400);
        console.log("user already axist");
  }
  
});



app.post("/login/", async (request, response) => {
  const { email, password } = request.body;
  const User = db.collection('User');
  const result = await User.find({email: {$eq: email}}).toArray();
  console.log(result);
  if (!result) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, result[0].password);

    if (checkPassword === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const payload = { email: email };
      const jwtoken = jwt.sign(payload, "MY_SECRET");
      response.send({ jwtToken: jwtoken });
    }
  }
});

app.get("/tweets/:id/", authorization, async (req, res) => {
  const { id } = req.params;
  
  const collection = db.collection('tweets');
  const result = await collection.find({tweet_id: {$eq: id}});
  res.send(result);
  res.status(200);
});




module.exports = app;


