const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require('express');
const dotenv =require('dotenv');
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dotenv.config()

const uri = process.env.MONGODB_URI;

const app = express()
const PORT =process.env.PORT

app.use(cors())
app.use(express.json())


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// JWKS
const JWKS = createRemoteJWKSet(
  new URL(`http://localhost:3000/api/auth/jwks`)
  // new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)

  // http://localhost:3000/api/auth/jwks
  
)

// JWT

const verifyToken = async (req, res, next) =>{
  const authHeader = req?.headers.authorization

  if(!authHeader){
    return res.status(401).json({message: "Unauthorized"})
  }
  const token = authHeader.split(" ")[1]
  if(!token){
    return res.status(401).json({message: "Unauthorized"})
  }

  try{
    const {payload} = await jwtVerify(token, JWKS)
    next()
  }catch (error)
  
  {
    console.log(error);
    return res.status(403).json({
      message: "Forbidden"});
  }
}




async function run() {
  try {
    // await client.connect();

    const db = client.db("assignment-9")
    const petNestCollection = db.collection("addPetNestDetail")
    const adoptionRequestsCollection = db.collection("adoptionRequests")

   // API Call to Pet Nest Details Page
    app.get("/addPetNestDetail/:id", async(req, res) =>{
        const id = req.params

        const result = await petNestCollection.findOne({_id: new ObjectId(id)})
        res.json(result)
    }) 

    // API Call Pet Update Page
    app.patch("/addPetNestDetail/:id", async (req, res)=>{
      const {id} = req.params
      const updatedData = req.body;

      const result = await petNestCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: {...updatedData}}
        
      );
      console.log({result});

      res.json(result);
    });


       // Delete a Pet by ID
    app.delete("/addPetNestDetail/:id",  async (req, res)=>{
      const {id} = req.params;
      const result = await petNestCollection.deleteOne({_id: new ObjectId(id)});
      res.json(result);
    });


  
 // Request Data Post
    app.post("/adoptionRequests",jwtVerify, async (req, res) => {
  const body = req.body;
  const result = await adoptionRequestsCollection.insertOne(body);
  res.send(result);
});


// Request Get
app.get("/adoptionRequests/:id", async(req, res) => {
  const {userId} = req.params
  const result = await adoptionRequestsCollection.find({userId}).toArray();
  res.json(result)
})


    // API Call to All-Pet Nest Card
    app.get("/addPetNestDetail", async(req, res) => {
        const result = await petNestCollection.find().toArray();
        res.json(result);
    });


    // middleware
    app.get("/addPetNestDetail:id", verifyToken, async (req, res)=>{
      const {id} = req.params;

      const result = await adoptionRequestsCollection.findOne({
        _id: new ObjectId(id),
      })
    })



    // API Create
    app.post("/addPetNestDetail", async (req, res) => {
        const addPetNestDetailData = req.body;
        console.log(addPetNestDetailData);
        const result = await petNestCollection.insertOne(addPetNestDetailData)
        
        res.json(result)
    })

    // Cancel Data Request
  app.patch("/adoptionRequests/:userid", async (req, res) => {
  const id = req.params.userid;
  const updateData = req.body;
  const result = await adoptionRequestsCollection.updateOne(
    { _id: new ObjectId(id) },
    {$set: updateData});
  res.send(result);
  console.log(result);
  console.log(updateData);
});


    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// Create a API Route
app.get('/', (req, res) => {
res.send('Server is Running Fine')
})

app.listen(PORT,()=>{
    console.log(`Server Running on port ${PORT}`);
})