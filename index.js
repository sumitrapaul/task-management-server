const express = require('express')
const app=express()
const cors = require('cors')
require('dotenv').config()
const port =process.env.PORT || 5000

app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
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

   app.post('/tasks', async(req, res) =>{
    const taskInfo= req.body
    const result = await taskCollection.insertOne(taskInfo)
    res.send(result)
   })



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