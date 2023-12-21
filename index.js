const express = require('express')
const cors = require('cors')
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require('dotenv').config()
const app=express()
const port =process.env.PORT || 5000

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json())
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldrxrdq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = (req, res, next) => {
  
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log("Value of token", token);
  if (!token) {
    return res.status(401).send({ message: "Not authorized" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "Unauthorized" });
    }
    // console.log("value in the token of decoded", decoded);
    req.user = decoded;

    next();
  });
};


async function run() {
  try {
 
    await client.connect();
   
   //database collection
   const taskCollection = client.db("taskDB").collection("tasks");

   app.post("/auth", logger, async (req, res) => {
    const user = req.body;
    // console.log(user);
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite:'none'
      })
      .send({ success: true });
  });

  app.post("/logout", async (req, res) => {
    const user = req.body;
    
    res.clearCookie("token", { maxAge: 0, secure:process.env.NODE_ENV === "production" ? true : false, sameSite:process.env.NODE_ENV === "production" ? "none" : "strict" }).send({ success: true });
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

  app.get("/tasks", logger, verifyToken, async (req, res) => {
  try{
    const emailParam = req.query?.email;
    const userEmail = req.user.email
    let query={}
    console.log(req.user, query,emailParam,userEmail)
    //verify
    if(emailParam && emailParam !== userEmail){
      return res.status(403).send({message: 'forbidden'})
    }
    

    if(emailParam) {
    query = { email: emailParam };
  }else{
    query = { email: userEmail}
  }

    const result = await taskCollection.find(query).toArray();
    console.log(result);
    res.send(result);
  }catch(error){
    console.error(error)
  }
  });
  app.put("/tasks/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };

    const updatedData = req.body;
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