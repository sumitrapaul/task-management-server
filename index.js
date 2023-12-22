const express = require('express')
const app=express()
const cors = require('cors')
const jwt = require("jsonwebtoken");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =process.env.PORT || 5000

app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldrxrdq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});




async function run() {
  try {
 
    await client.connect();
   
   //database collection
   const taskCollection = client.db("taskDB").collection("tasks");
   const userCollection = client.db("taskDB").collection("users");

   // //auth related
   app.post("/jwt", async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });
    // console.log('tik ttok token',token)
    res.send({ token });
  });

  //middlewares
  const verifyToken = (req, res, next) => {
    // console.log('inside',req.headers.authorization)
    if (!req.headers.authorization) {
      return res.status(401).send({ message: "unauthorized" });
    }

    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "unauthorized" });
      }
      req.decoded = decoded;
      next();
    });
  };

  app.get("/users", verifyToken, async (req, res) => {
    // console.log('head',req.headers)
    const result = await userCollection.find().toArray();
    // console.log(result);
    res.send(result);
  });

  //1
  app.post("/users", async (req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await userCollection.findOne(query);
    if (existingUser) {
      return res.send({ message: "User already exists", insertedId: null });
    }
    const result = await userCollection.insertOne(user);
    res.send(result);
  });

  app.get("/users/:email", verifyToken, async (req, res) => {
    const email = req.params.email;
    // console.log(email);
    const query = { email: email };
    // console.log(query);
    const result = await userCollection.find(query).toArray();
    // console.log(result);
    res.send(result);
  });


   app.post('/tasks', async(req, res) =>{
    const taskInfo= req.body
    const result = await taskCollection.insertOne(taskInfo)
    res.send(result)
   })

   app.get("/tasks", async (req, res) => {
    const result = await taskCollection.find().toArray();
    res.send(result);
  });

  app.get("/tasks1/:id", async (req, res) => {
    const email = req.params.id;
   console.log(email)

    const result1 = await taskCollection.find().sort({deadline : 1}).toArray();
    const result = result1.filter(result2 =>(
      result2.useremail == email
    ))
   console.log(result)
    res.send(result);
  
  });
  app.put("/tasks/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };

    const updatedData = req.body;
    console.log(updatedData)
    const task = {
      $set: updatedData,
    };

    const result = await taskCollection.updateOne(
      filter,
      task,
      options
    );

    if (result.modifiedCount > 0) {
      res.send(result);
    }
  });

  app.delete("/tasks/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await taskCollection.deleteOne(query);
    res.send(result);
  });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("Task management server is running");
  });
  
  app.listen(port, (req, res) => {
    console.log(`Task management server is running on port : ${port}`);
  });