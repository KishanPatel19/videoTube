import { app } from "./app.js";
import connectDB from "./db/index.js"

import dotenv from "dotenv"
// require('dotenv').config({path:"./env"})



dotenv.config();

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`server is running on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed",err)
})    