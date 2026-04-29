import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinari.js";
import { ApiResponse } from "../utils/APiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;
  console.log(username, email);
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required !");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { password }],
  });
  if (existedUser) {
    throw new ApiError(409, "This email or username are already taken ");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar ia required !");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar is mandetory");
  }
  const user = User.create({
    username:username.toLowerCase(),
    password:password,
    email:email,
    fullName:fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url||""
  })

 const createdUser = User.findById(user._id).select(
  "-password -refreshToken"
 )

 if(!createdUser){
   throw new ApiError(500,"Somthing went wrong while creating the user ")
 }

 return res.status(201).json(
  new ApiResponse(200,createdUser,"User Created successfully !")
 )

});

export { registerUser };
