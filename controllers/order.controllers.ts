import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { IOrder } from "../models/order.models";
import userModel from "../models/user.model";
import courseModel from "../models/course.models";
import { getAllOrdersService, newOrder } from "../services/order.service";
import ejs from "ejs"
import path from "path";
import sendEmail from "../utils/sendMail";
import notificationModel from "../models/notificationModels";

export const createOrder=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{

    const {courseId,payment_info}=req.body as IOrder;
    const user = await userModel.findById(req.user?._id);

    const isExistingCourse=user?.courses.some((course:any)=>course._id.toString()===courseId.toString());
    if (isExistingCourse){
      return next(new ErrorHandler('user already purchased this course',400)); 
    }

    const course=await courseModel.findById(courseId.toString());
    if(!course){
      return next(new ErrorHandler('course not found',400));
    }

    const data:any={
      courseId:course._id,
      userId:user?._id,
      payment_info
    }
   
    const mailData={
      order:{
        _id:course._id.toString().slice(0,6),
        name:course.name,
        price:course.price,
        date:new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),
      }
    }

    const html= ejs.renderFile(path.join(__dirname, '../mails/order-conformation.ejs'),{order:mailData})
    try{
      if(user){
        await sendEmail({
          email: user.email,
          subject: 'Order Confirmation',
          template:'order-conformation.ejs',
          data: mailData
        })
      }
    }
    catch(err:any){
      return next(new ErrorHandler(err.message,500));
    }

    user?.courses.push(course._id);
    await user?.save();
    course.purchased?
      course.purchased+=1:course.purchased;
    
    await course?.save();
    newOrder(data,res,next);

    await notificationModel.create({
      userId:user?._id,
      title:"New Order",
      message:`you are new order from ${course?.name}`
    });

   
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));
  }

})

// get All Orders for only fro admins

export const getAllOrders=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    getAllOrdersService(res)
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));
  }

})