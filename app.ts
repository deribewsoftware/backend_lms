require('dotenv').config()
import express, { NextFunction, Request, Response } from "express";
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.router";
import courseRouter from "./routes/course.router";
import orderRouter from "./routes/order.router";
import notificationRouter from "./routes/notification.router";
import analyticsRouter from "./routes/analytics.router";
import layoutRouter from "./routes/layout.router";

export const app=express();

app.use(express.json({limit:"50mb"}))
app.use(cookieParser())
app.use(cors({
  origin:["http://localhost:3000"],
  credentials:true
}))

app.use('/api/v1',userRouter,courseRouter,orderRouter,notificationRouter,analyticsRouter,layoutRouter);


app.get('/test',(req:Request,res:Response,next:NextFunction)=>{
  console.log("Hello world")
  res.status(200).json({
    success:true,
    message:"api working"
  })
});
app.all('*',(res:Request,req:Response,next:NextFunction)=>{
  const err=new Error(`Route ${req}`)
  // err.statusCode=404
  next(err)

})
app.use(ErrorMiddleware)