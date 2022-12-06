const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// Middleware

app.use(cors());
app.use(express.json());

// Connect MongoBD

// Dotenv Config
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@simple-node-mongo.gm35wt9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

// JWT Function
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
    if (error) {
      return res.status(401).send({ message: "UnAuthorized Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client
      .db("mix-photography")
      .collection("services");
    const reviewCollection = client.db("mix-photography").collection("reviews");

    // API for JWT Token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Get API to Load all Service
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // Get API to Load 3 Service for Homepage
    app.get("/home", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });

    // Get API to Load Specific Service based on id
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // Post Reviews API to add Review
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // Get Specific Service Reviews
    app.get("/reviews", async (req, res) => {
      let query = {};
      if (req.query.service_id) {
        query = {
          service_id: req.query.service_id,
        };
      }
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Reviews API for every different user
    app.get("/my-reviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if (decoded.user_email !== req.user_email) {
        res.status(403).send({ message: "UnAuthorized Access" });
      }

      let query = {};
      if (req.query.user_email) {
        query = {
          user_email: req.query.user_email,
        };
      }
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Reviews API usinf id to delete
    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      let query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    // Reviews Update API
    app.patch("/review/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      let query = { _id: ObjectId(id) };
      const result = await reviewCollection.updateOne(query, { $set: body });
      res.send(result);
    });

    // Post Service API to add Service
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });
  } finally {
  }
}

run().catch((error) => console.error(error));

// First get API for home route

app.get("/", (req, res) => {
  res.send("Mix-Photography Server is Runnig");
});

// Listen API for Port

app.listen(port, () => {
  console.log(`Mix-Photography is Runnig on Port : ${port}`);
});
