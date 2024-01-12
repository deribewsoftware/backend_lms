import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import cloudinary from 'cloudinary'
import layoutModel from "../models/layout.model";

export const createLayout=CatchAsyncError(async (req:Request,res:Response,next:NextFunction) => {
  try{
    const {type} = req.body;
    const isExistsLayout = await layoutModel.findOne({type})
    if(isExistsLayout){
      return next(new ErrorHandler("Layout already exists",400))
    }
    if(type === "Banner"){
      const {Image,title,subTitle} = req.body;
const myCloud=await cloudinary.v2.uploader.upload(Image,{
  folder:"layout"
});
const banner={
  Image:{
    public_id:myCloud.public_id,
    url:myCloud.secure_url
  },
  title,
  subTitle
}
await layoutModel.create(banner);
    }
    if(type === "FAQ"){
      const {faq} = req.body;
      const faqItems=await Promise.all(
        faq.map(async(item:any)=>{
          return{
question:item.question,
answer:item.answer
          }
        })
      );


      await layoutModel.create({type:"FAQ",faq:faqItems});
      }


    if(type === "Categories"){
      const {categories} = req.body;
      const categoriesItems=await Promise.all(
        categories.map(async(item:any)=>{
          return{
title:item.title,

          }
        })
      );
      await layoutModel.create({type:"Categories",categories:categoriesItems});
    }

    res.status(200).json({
      success:true,
      message:"Layout created Successfully"
    })
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500) )
  }
})

// update layout

export const updateLayout = CatchAsyncError(async(req:Request, res:Response, next:NextFunction)=>{
  try{
    const {type} = req.body;
    const isExistsLayout = await layoutModel.findOne({type})
    
    if(type === "Banner"){
      const bannerData:any=await layoutModel.findOne({type:"Banner"})
      if(bannerData){
        await cloudinary.v2.uploader.destroy(bannerData.Image.public_id)
      }
      const {Image,title,subTitle} = req.body;
const myCloud=await cloudinary.v2.uploader.upload(Image,{
  folder:"layout"
});
const banner={
  Image:{
    public_id:myCloud.public_id,
    url:myCloud.secure_url
  },
  title,
  subTitle
}
await layoutModel.findByIdAndUpdate(bannerData._id,{banner});
    }



    if(type === "FAQ"){
      const {faq} = req.body;
      const faqItem=await layoutModel.findOne({type:"FAQ"})
      const faqItems=await Promise.all(
        faq.map(async(item:any)=>{
          return{
question:item.question,
answer:item.answer
          }
        })
      );


      await layoutModel.findByIdAndUpdate(faqItem?._id,{type:"FAQ",faq:faqItems});
      }


    if(type === "Categories"){
      const {categories} = req.body;

      const category=await layoutModel.findOne({type:"Categories"})
      const categoriesItems=await Promise.all(
        categories.map(async(item:any)=>{
          return{
title:item.title,

          }
        })
      );
      await layoutModel.findByIdAndUpdate(category?._id,{type:"Categories",category:categoriesItems});
    }

    res.status(200).json({
      success:true,
      message:"Layout updated Successfully"
    })
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500) )
  }

})

// get layout  by type

export const getLayoutByType = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const {type} = req.body;
    const layout= await layoutModel.findOne({type:type});
    res.status(200).json({
      success:true,
      layout
    })
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500) )
  }
})