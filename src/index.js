
import dotenv from "dotenv";
console.log("dotenv vars count:", Object.keys(process.env).filter(k => k.startsWith('CLOUDINARY')).length);
dotenv.config({ path: "./.env", override: true });
console.log("CLOUDINARY_CLOUD_NAME after dotenv:", process.env.CLOUDINARY_CLOUD_NAME);
import { app } from "./app.js";
import connectDB from "./db/index.js"



connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`server is running on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed",err)
})    