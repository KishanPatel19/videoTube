import {v2 as cloudinary } from "cloudinary"
import fs from "fs"


const setupCloudinary = () => {
  console.log("🔍 CLOUDINARY LAZY SETUP:");
  console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME || "MISSING");
  console.log("API Key:", process.env.CLOUDINARY_API_KEY ? `LOADED (${process.env.CLOUDINARY_API_KEY.length} chars)` : "MISSING");
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
};

//   cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
//   });

setupCloudinary();

const uploadOnCloudinary = async (localFilePath) => {
    setupCloudinary(); // Ensure config runs after dotenv
    try {
        if (!localFilePath) return null;
        const res = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // console.log("File uploaded successfully !", res.url);
        // console.log(res)
        fs.unlinkSync(localFilePath);

        return res;
    } catch (error) {
        if (localFilePath) fs.unlinkSync(localFilePath);
        console.error("Cloudinary Upload Error:", error.message);
        return null;
    }
};


export {uploadOnCloudinary}