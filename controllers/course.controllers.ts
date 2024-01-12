import { Response,Request,NextFunction} from "express";
import cloudinary from "cloudinary"
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { createCourse, getAllCoursesService } from "../services/course.service";
import courseModel from "../models/course.models";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs"
import path from "path";
import sendEmail from "../utils/sendMail";
import notificationModel from "../models/notificationModels";


export const uploadCourse=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const data=await req.body;
    const thumbnail= data.thumbnail;
    if(thumbnail){
      const myCloud= await cloudinary.v2.uploader.upload(thumbnail,{
        folder:"courses"
      });
      data.thumbnail={
        public_id:myCloud.public_id,
        url:myCloud.secure_url
      }
    }
    createCourse(data,res,next) 
  }
  catch(err:any){
    next(new ErrorHandler(err.message,500));
  };
})
// edit course  
export const editCourse =CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
const data=req.body;
const thumbnail=data.thumbnail;
if(thumbnail){
  await cloudinary.v2.uploader.destroy(data.thumbnail.public_id);
  const myCloudnary=await cloudinary.v2.uploader.upload(thumbnail,{
    folder:"courses"
  });

  data.thumbnail={
    public_id:myCloudnary.public_id,
    url:myCloudnary.secure_url
  }
}
const courseId=req.params.id;
const course=await courseModel.findByIdAndUpdate(courseId,{
  $set:data
},
{new:true})

res.status(201).json({
  success:true,
  course
})
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));
    
  }
})

// get single course without purchasing
export const getSingelCourse=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{

  try{
    const courseId=req.params.id; 
    const isCacheExists = await redis.get(courseId)
    if(isCacheExists){
      const course = JSON.parse(isCacheExists);
      res.status(200).json({
        success:true,
        course
      })
    }
    else{
      const course = await courseModel.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
await redis.set(courseId,JSON.stringify(course),"EX",604800); // 7 days
    res.status(200).json({
      success:true,
      course
    })
    }
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));
  }

})

// get all courses
export const getAllCourses=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const isCacheExists = await redis.get("allCourses");
    if(isCacheExists){
      const courses=JSON.parse(isCacheExists);
      res.status(200).json({
        success:true,
        courses
      });
    }
    else{
    const courses = await courseModel.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
    await redis.set('allcourses',JSON.stringify(courses));
    res.status(200).json({
      success:true,
      courses
    });}
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));
  }

})


// get  course content by valid user
export const getCourseByUser=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const userCourseList=req.user?.courses;
    const courseId=req.params.id;
    const IsCourseExists=userCourseList?.find((course:any)=>course._id===courseId);
    console.log("Courses",userCourseList);
    console.log("Course Id:",courseId);
    if(!IsCourseExists){
      return next(new ErrorHandler('User not eligible for access this course',400));
    }
    const course=await courseModel.findById(courseId);
    const content=course?.courseData;
    res.status(200).json({
      success:true,
      content
    })
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));

  }
});

// Add Question
interface AddQuestionData{
  question:string;
  courseId:string;
  contentId:string;
}

export const addQestion=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const {question,courseId,contentId}=req.body as AddQuestionData;
    const course=await courseModel.findById(courseId);
    if(!mongoose.Types.ObjectId.isValid(contentId)){
      return next(new ErrorHandler('invalid contentId',400));
    }
    const content=course?.courseData.find((item:any)=>item._id.equals(contentId));
    if(!content){
      return next(new ErrorHandler('invalid content',400));}


    // add new question object
    const newQuestion:any={
      user:req.user,
      question:question,
      questionReplies:[]

    }
    // add question object to course content

    content.questions.push(newQuestion);

    // create notification

    await notificationModel.create({
      userId:req.user?._id,
      title: "New Question Received",
      message:`you have a new question in ${content.title} `
    });


    await course?.save();
    res.status(200).json({
      success: true,
      course
    })


  }
  catch(err:any){
    return next(new ErrorHandler(err.message, 500));
  }
});

// Add Answer to Question
interface IAddAnswerData{
  answer:string;
  courseId:string;
  contentId:string;
  questionId:string;
}

export const addAnswer=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const {answer,courseId,contentId,questionId}=req.body as IAddAnswerData;

    const course=await courseModel.findById(courseId);
    if(!mongoose.Types.ObjectId.isValid(contentId)){
      return next(new ErrorHandler('invalid contentId',400));
    }
    const content=course?.courseData.find((item:any)=>item._id.equals(contentId));
    if(!content){
      return next(new ErrorHandler('invalid content',400));}

      const question=content?.questions.find((item:any)=>item._id.equals(questionId));
      if (!question){
        return next(new ErrorHandler('invalid question',400))
      }
      const newAnswer:any={
        user:req.user,
        answer
      }
      question.questionReplies?.push(newAnswer)

      await course?.save();

      if(req.user?._id===question.user._id){
       // create notification 
       await notificationModel.create({
        userId:req.user?._id,
        title: "New Question reply Received",
        message:`you have a new question reply in ${content.title} `
      });
      }
      else{
        const data={
          name:question.user.name,
          title:content.title
        }

        const html=await ejs.renderFile(path.join(__dirname,'../mails/question-reply.ejs'),data);
        try {
          await sendEmail(
            {
              email:question.user.email,
              subject:"Question Reply",
              template:'question-reply.ejs',
              data
            }
          );
        }
        catch(err:any){
   return next(new ErrorHandler(err.message,500));
        }
      }


      res.status(200).json({
        success:true,
        course});





  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));

  }

});

//add review to the course

interface IAddReviewData{
 
  
  rating:number;
  comment:string;
}

export const addReview=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const courseId=req.params.id
    const userCourseList=req.user?.courses;
    const isCourseExists=userCourseList?.some((course:any)=>course._id.toString()===courseId.toString());
    const {rating,comment}=req.body as IAddReviewData;
    if(!isCourseExists){
      return next(new ErrorHandler('you are not eligible to access this course',400));
    }

    const course = await courseModel.findById(courseId);

    // add review data
    const newReviewData:any={
      user:req.user,
      rating:rating,
      comment:comment
    }

    await course?.reviews.push(newReviewData);
    let avg=0;
    course?.reviews.forEach((review:any)=>{
      avg+=review.rating;
    });

    if(course){
      course.rating=avg/course.reviews.length
    }

    await course?.save();

   
// create a notification

await notificationModel.create({
  userId:req.user?._id,
  title: "New Review Received",
  message:`${req.user?.name} has given a review on ${course?.name}`
});





    res.status(200).json({
      success:true,
      course
    })


  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));}

});


interface IReviewReply{
  comment:string;
  courseId:string;
  reviewId:string;
}

export const addReviewReply=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
try{

  const {courseId,reviewId,comment} = req.body as IReviewReply;

  const course =await courseModel.findById(courseId);
  if(!course){
    return next(new ErrorHandler('Course not found',400));
  }
  const review =  course.reviews.find((review:any)=>review._id.toString() === reviewId.toString());

  if(!review){
    next(new ErrorHandler('review not found',400));
  }

  //add the review reply

  const newReviewReply:any = {
    user:req.user,
    comment

  }
if(!review?.commentReplies){
  return next(new ErrorHandler('review not found',400));
}
  review?.commentReplies.push(newReviewReply);

  await course.save();
  res.status(200).json({
    success: true,
    course
  })

}
catch(err:any){
  return next(new ErrorHandler(err.message,500));}
});


// get All Courses for only admins

export const getAllCourse=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    getAllCoursesService(res)
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500));
  }

})

//delete  Course for only admins

export const deleteCourse=CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const {id}=req.params;
    const course=await courseModel.findById(id);
    if(!course){
      return next(new ErrorHandler('course not found',400));
    }
    await course.deleteOne({id})
    await redis.del(id);
    res.status(200).json(
     { success:true,
      message:"Course deleted successfully"});
  }
  catch(err:any){
    return next(new ErrorHandler(err.message,500))
  }
});
