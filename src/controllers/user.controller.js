import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinari.js";
import { ApiResponse } from "../utils/APiResponse.js";
import {jwt} from "jsonwebtoken"

const generateAccessAndRefreshToken =async (userId)=>{
    try {
     const user = await User.findById(userId);
      // console.log("User :",user)
    const accessToken = user.generateAccessToken()
    // console.log("access :",accessToken)
    const refreshToken = user.generateRefreshToken()
    // console.log("refresh :",refreshToken)
       user.refreshToken = refreshToken

       await user.save({validateBeforeSave:false})

       return {accessToken , refreshToken}



    } catch (error) {
      console.log(error)
      throw new ApiError(500,"Somthing went wrong while creating access or refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;
  console.log(username, email);
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required !");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "This email or username are already taken ");
  }
  console.log(req.files)

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) &&
  req.files.coverImage.length > 0)
  {
    coverImageLocalPath = req.files.coverImage[0].path
  }



  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar ia required !");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("Avatar response:", avatar);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar is mandetory");
  }
  const user = await User.create({
    username:username.toLowerCase(),
    password:password,
    email:email,
    fullName:fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url||""
  })

 const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
 )

 if(!createdUser){
   throw new ApiError(500,"Somthing went wrong while creating the user ")
 }

 return res.status(201).json(
  new ApiResponse(200,createdUser,"User Created successfully !")
 )

});

const loginUser = asyncHandler(async (req,res)=>{

  const {email,username,password} = req.body

  if(!email && !username){
    throw new ApiError(400 , "username or email is required")
  }

  const user = await User.findOne({
    $or :[{email},{username}]
  })

  if(!user){
    throw new ApiError(404, "username or email is not exist")
  }
 
   const isPasswordValid = await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credential")
   }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id);

      const loggedInUser= await User.findById(user._id).select(
        "-password -refreshToken"
      )

    const options = {
      httpOnly:true,
      secure:true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken,options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
      new ApiResponse(
          200,
          {
            user: loggedInUser,accessToken , refreshToken
          },
          "User is logged in successfully !"
      )
    )
})

const logoutUser = asyncHandler(async (req,res)=>{

  await  User.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          refreshToken:undefined
        }
      },
      {
        new:true
      }
    )
const options={
  httpOnly:true,
  secure:true
}

return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(
  new ApiResponse(200,{},"User logged out")
)

})

const refreshAccessToken = asyncHandler(async (req,res)=>{
 const incomingRefreshToken = req.cookies.refreshToken||req.body.refreshToken

 if(!incomingRefreshToken){
  throw new ApiError(401,"Refresh token is not recieved")
 }

try {
   const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

const user = await User.findById(decodedToken._id)

if(!user){
  throw new ApiError(401,"Refresh token is not valid")
}
if(incomingRefreshToken !== user.refreshToken){
  throw new ApiError(401, "Refresh token is expired or used" )
}

const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id)

const options = {
  httpOnly:true,
  secure:true
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",newRefreshToken,options)
.json(
  new ApiResponse(
    200,
    {
      accessToken,refreshToken:newRefreshToken
    },
    "Access token refreshed "
  )
)
} catch (error) {
  throw new ApiError(401,error?.message ||"Invalid refresh token")
}
 
})

const changeCurrentPassword = asyncHandler(    async (req,res)=>{
  const {oldPassword,newPassword} = req.body

 const user = await User.findById(req.user?._id)
 const ispasswordCorrect = await user.isPasswordCorrect(oldPassword);

 if(!ispasswordCorrect){
  throw new ApiError(401,"invalid old password ")
 }

 user.password=newPassword;
 await user.save({validateBeforeSave:false})

 return res
 .status(200)
 .json(
  new ApiResponse(200,{},"Password changed")
 )

} )

const getCurrentUser= asyncHandler( async (req,res)=>{
  return res
  .status(200)
  .json(
    new ApiResponse(200,req.user,"Current user fatched")
  )
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName , email}= req.body;

  if(!fullName || !email){
    throw new ApiError(400,"All fields are required")
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        fullName:fullName,
        email:email
      }
    },
    {new:true}

  ).select("-password")

  return rres
  .status(200)
  .json(
    new ApiResponse(200,user,"Profile updated")
  )
})

const updateUSerAvatar = asyncHandler( async (req,res)=>{
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"AVatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(avatar.url){
    throw new ApiError(400,"Error while uploding avatar on cloudinary")
  }

  const  user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"Avatar updated")
  )

  const updateUserCoverImag = asyncHandler(async (req,res)=>{

    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
      throw new ApiError(400,"Cover image file is missing")
    }
    const coverImage= await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
      throw new ApiError(400,"Erroe while uploading coverImage on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          coverImage:coverImage.url
        }
      },
      {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(200,user,"Cover image updated")
    )

  })

} )
 

export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUSerAvatar,
   updateUserCoverImag,

};
