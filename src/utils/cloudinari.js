import {v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARI_CLOUD_NAME ,
    api_key:process.env.CLOUDINARI_API_KEY,
    api_secret:process.env.CLOUDINARI_API_SECRET
})

const uploadOnCloudinary =  async (localFilePath)=>{
    try {
        if (!localFilePath) return null;
        const res = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        }) 
        console.log("File uploaded successfully !" ,res.url)
        return res
    } catch (error) {
        fs.unlinkSync(localFilePath)
    }
}

export {uploadOnCloudinary}