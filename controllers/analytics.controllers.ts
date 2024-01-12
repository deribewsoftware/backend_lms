import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { generateLast12Monthsdata } from "../utils/analytics.generator";
import userModel from "../models/user.model";
import courseModel from "../models/course.models";
import orderModel from "../models/order.models";


// get user analytics for only admins
export const getUserAnalytics=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const users=await generateLast12Monthsdata(userModel)
    res.status(200).json({
      success:true,
      users
    });
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));
  }
  });





  // get courses analytics for only admins

  export const getCoursesAnalytics=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
      const courses=await generateLast12Monthsdata(courseModel)
      res.status(200).json({
        success:true,
        courses
      });
    }
    catch(err:any){
      return next(new ErrorHandler(err.message,500));
    }
    });




  //get orders analytics for only admins
  export const getOrdersAnalytics=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try{
      const orders=await generateLast12Monthsdata(orderModel)
      res.status(200).json({
        success:true,
        orders
      });
    }
    catch(err:any){
      return next(new ErrorHandler(err.message,500));
    }

});