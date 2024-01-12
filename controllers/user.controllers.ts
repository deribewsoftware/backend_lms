require("dotenv").config();

import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import userModel, { IUser } from "../models/user.model";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from 'ejs'
import path from "path";
import sendEmail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import cloudinary from "cloudinary"
import { redis } from "../utils/redis";
import { getAllUsersService, getUserById, updateUserRoleService } from "../services/user.service";




//user registrastion
interface IregistrationBody{
  name:string;
  email:string;
  password:string;
  avatar?:string;
}


export const registrationUser=CatchAsyncError(async(req:Request, res:Response,next:NextFunction)=>{
  try{
    const {name,email,password}=req.body;

    const isEmailExist=await userModel.findOne({email:email});

    if(isEmailExist){
      return next(new ErrorHandler("Email already exists",400))
    }
const user:IregistrationBody={
  name,email,password
}
const activationToken=createActivationToken(user)
const activationCode=activationToken.activationCode
const data={user:{name:user.name},activationCode}
  
  const html=ejs.renderFile(path.join(__dirname,"../mails/activation-mail.ejs"),data);
  try{
   await sendEmail({
    email:user.email,
    subject:"Account Activation",
    template:"activation-mail.ejs",
    data:data
   })

  res.status(201).json({
    success:true,
    message:`Success please check your email ${user.email}`,
    activationToken:activationToken.token
   });
  }

  catch(error:any){
    return next(new ErrorHandler(error.message,400));
  }

}
  catch(error:any){
    return next(new ErrorHandler(error.message,400));
  }
});

interface ActivationToken{
  token:string;
  activationCode:string;
}
const createActivationToken=(user:any):ActivationToken=>{
  const activationCode=Math.floor(1000+Math.random()*9000).toString();
  const token=jwt.sign(
    {user,activationCode},
    process.env.ACTIVATION_SECRET as Secret,{
      expiresIn:"5m"
    }
    );

    return {token,activationCode}
}
//activation User
interface IActivationRequest{
  activation_token:string;
  activation_code:string;

}
export const ActivateUser=CatchAsyncError(async(req:Request, res:Response,next:NextFunction)=>{
  try{
    const {activation_code,activation_token}=req.body as IActivationRequest;
    const newUser:{user:IUser;activationCode:string}=jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET as string
    )as{user:IUser;activationCode:string};

    if(newUser.activationCode!==activation_code){
      return next(new ErrorHandler("Invalid activation code",400))

    }


    const {name,email,password}=newUser.user;

    const existingUser =await userModel.findOne({email})
    if (existingUser){
      return next(new ErrorHandler("user already exists",400));
    }

    const user = await userModel.create({name,email,password});
    res.status(201).json({success:true,user});
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,400));
  }
});

//login user

interface ILoginRequest{
  email:string;
  password:string;
}
export const LoginUser=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const {email,password} = req.body as ILoginRequest;
    if(!email || !password){
      return next(new ErrorHandler('email and password required',400));
    }

    const user= await userModel.findOne({email}).select("+password")
    if(!user){
      return next(new ErrorHandler('invalid email and password',400));
    }
    const isMatchPassword=user.comparePassword(password);

    if(!isMatchPassword){
      return next(new ErrorHandler('incorrect password',400));
    }
    sendToken(user,200,res)
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,400));
  }

});

// logou user
export const LogoutUser=CatchAsyncError(async(req:Request, res:Response,next:NextFunction)=>{
  try{
    res.cookie('access_token','',{maxAge:1})
    res.cookie('refresh_token','',{maxAge:1})
    const userId=req.user?._id || ""
    
    redis.del(userId)
    res.status(200).json({
      success:true,
      message:"user logged out successfully"
    })
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,400));
  }
})

// update access token
export const updateAccessToken=CatchAsyncError(async (req:Request,res:Response,next:NextFunction) =>{
  try{
    const refresh_token=req.cookies.refresh_token as string;
    const decoded=jwt.verify(refresh_token,process.env.REFRESH_TOKEN as string) as JwtPayload;
    const message='please login to acces this resource'
    if(!decoded){
      return next(new ErrorHandler(message,400));

    }
    const session= await redis.get(decoded.id,)

    if(!session){
      return next(new ErrorHandler(message,400));

    }

    const user=JSON.parse(session);
    const accessToken=jwt.sign({id:user._id},process.env.ACCESS_TOKEN as string,{
      expiresIn:"5m"
    });
    const refreshToken=jwt.sign({id:user._id},process.env.REFRESH_TOKEN as string,{
      expiresIn:"3d"
    });
req.user = user;
    res.cookie('access_token',accessToken,accessTokenOptions);
    res.cookie('refresh_token',refreshToken,refreshTokenOptions)
    await redis.set(user._id, JSON.stringify(user),"EX",604800 );// 7 days
    res.status(200).json({
      status: 'success',
      accessToken
    })
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,400));
  }

})

// get user information
export const getUserInfo=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const userId=req.user?._id;
    getUserById(userId,res)
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,400));
  }

})


// social auth
interface ISocialAuthRequest {
  name:string;
  email:string;
  avatar:string;
}
export const socialAuth=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const {email,name,avatar} = req.body as ISocialAuthRequest;

    const user = await userModel.findOne({email});
    if(!user){
      const newUser = await userModel.create({name,email,avatar});
      sendToken(newUser,200,res)

    }
    else{
      sendToken(user,200,res)
    }
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,400));
  }
})

// update user info
interface IUpdateUserInfo{
  name:string;
  email:string;
}
export const UpdateUserInfo=CatchAsyncError(async (req:Request,res:Response,next:NextFunction) => {
  try{
    const {name,email} = req.body as IUpdateUserInfo;
    const userId=req.user?._id;
    const user=await userModel.findById(userId);

    if(email && user){
      const extingUser=await userModel.findOne({email});
      if(extingUser){
        return next(new ErrorHandler(`user already exists`,400));
      }
      user.email = email;

    }

    if(name && user){
      user.name = name;
    }

    await user?.save();
    await redis.set(userId,JSON.stringify(user));
    res.status(201).json({
      success: true,
      user
    });
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,400));
  }
});

// update Password

interface IUpdatePassword{
oldPassword:string;
newPassword:string;
}

export const updatePassword=CatchAsyncError(async (req:Request,res:Response,next:NextFunction) => {
  try{
    const {oldPassword,newPassword} =req.body as IUpdatePassword;

    // const userId=req.user?._id;
    const user=await userModel.findById(req.user?._id).select("+password");
    // if (!user){
    //   return next(new ErrorHandler(`User not found`,400));
    // }

    const isMatchPassword= await user?.comparePassword(oldPassword);
    console.log("data=",isMatchPassword);
    if(!oldPassword ||!newPassword){
      return next(new ErrorHandler('enter password',400));
    }
    if(user?.password===undefined){
      return next(new ErrorHandler('invalid user',400));
    }
    if(!isMatchPassword){
      return next(new ErrorHandler("invalid password",400));
    }
    user.password = newPassword;
    await user.save();
    await redis.set(req.user?._id,JSON.stringify(user));
    res.status(201).json({
      success: true,
      user
    })
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,400));
  }
});

// update userProfilePicture
interface IUserProfilePicture{
  avatar:string;
}

export const updateUserProfilePicture=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{

  try{
    const {avatar} = req.body as IUserProfilePicture;
    const userId=req.user?._id;
    const user=await userModel.findById(userId);
    if(avatar && user){
      if(user?.avatar?.public_id){
        await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
        const myCloudnary=await cloudinary.v2.uploader.upload(avatar,{
          folder:"avatars",
          width:150
        });
        user.avatar={
          public_id: myCloudnary.public_id,
          url:myCloudnary.secure_url
        
        }

      }
      else{
        const myCloudnary= await cloudinary.v2.uploader.upload(avatar,{
          folder:"avatars",
          width:150
        });
        user.avatar={
          public_id: myCloudnary.public_id,
          url:myCloudnary.secure_url
        
        }

      }


    }
console.log("avatar",user?.avatar)
    await user?.save();
    await redis.set(userId,JSON.stringify(user));
    res.status(200).json({
      success: true,
      user
    })
  }
  
  catch(err:any){
    return next(new ErrorHandler(err.message,400));
  }
})


// get All Users

export const getAllUsers=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
   await getAllUsersService(res)
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));
  }

})


export const updateUserRole=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const {id,role}=req.body;
    updateUserRoleService(res,id,role);
  }
  catch(err:any){return next(new ErrorHandler(err.message,500));}
});



//delete  User for only admins

export const deleteUser=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const {id}=req.params;
    const user=await userModel.findById(id);
    if(!user){
      return next(new ErrorHandler('User not found',400));
    }
    await user.deleteOne({id})
    await redis.del(id);
    res.status(200).json(
     { success:true,
      message:"User deleted successfully"});
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500))
  }
});