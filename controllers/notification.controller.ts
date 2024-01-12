import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import notificationModel from "../models/notificationModels";
import ErrorHandler from "../utils/errorHandler";
import cron from 'node-cron'

export const getNotifications=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const notifications=await notificationModel.find().sort({createdAt:-1});
    res.status(201).json({
      success:true,
      notifications
    })
  }
  catch(error:any){
    return next(new ErrorHandler(error.message,500))
  }
})

export const updateNotification = async(req:Request, res:Response, next:NextFunction)=>{

  try{

  const notification=await notificationModel.findById(req.params.id);
  if(!notification){
    return next(new ErrorHandler('notification not found',400));
  }
  else{
    notification.status? notification.status="read":notification.status;}
  await notification.save();
  const notifications=await notificationModel.find().sort({createdAt:-1});
    res.status(201).json({
      success:true,
      notifications
    })
    

  }
  catch(error:any){
    return next(new ErrorHandler(error.message,500))
  }
}


// delete notification
cron.schedule('0 0 0 * * *',async()=>{
  const thirtyDaysAgo=new Date(Date.now()-30*24*60*60*1000);
  await notificationModel.deleteMany({status: 'read',createdAt:{$lt:thirtyDaysAgo}})
  console.log("deleted read notification")
});