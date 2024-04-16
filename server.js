const express = require("express");
const bcrypt = require("bcrypt");
//require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const Tweets = require("./models/tweets");
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://zishanverse:ff6hkzEuzlGyxblW@cluster0.nucjnys.mongodb.net/twitter?retryWrites=true&w=majority&appName=Cluster0";

app.use(express.json());

const PORT = process.env.PORT || 3000;
const client =  new MongoClient(uri);

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

// swagger integeration 
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hello World',
      version: '1.0.0',
    },
    servers: [
      {
        url: `https://localhost:${PORT}`,
      }
    ],
    components: {
      securitySchemes: {
        jwtToken: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Enter JWT token in the format "Bearer {token}"',
        },
      },
    },
    security: [{ jwtToken: [] }],
  },
  apis: ['./*.js'], // files containing annotations as above
};

const openapiSpecification = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));



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


/**
 * @swagger
 * /register/:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user by registering for using website.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: String
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully created a new User
 */


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

/**
 * @swagger
 * /login/:
 *   post:
 *     summary: Loging user 
 *     description: Loging user with authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: String
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully Logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tweet_id:
 *                   type: number
 *                 tweet:
 *                   type: string
 *                 user_id:
 *                   type: number
 *                 date_time:
 *                   type: string
 */

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

/**
 * @swagger
 * /tweets/{id}/:
 *   get:
 *     summary: getting perticular tweet
 *     description: getting perticular tweet with ID params
 *     security:
 *       - jwtToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully Logged in
 */

app.get("/tweets/:id/", authorization, async (req, res) => {
  const { id } = req.params;
  
  const collection = db.collection('tweets');
  const result = await collection.find({tweet_id: {$eq: id}});
  res.send(result);
  res.status(200);
});




module.exports = app;


