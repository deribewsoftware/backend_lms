import express from 'express';
import { addAnswer, addQestion, addReview, addReviewReply, deleteCourse, editCourse, getAllCourse, getAllCourses, getCourseByUser, getSingelCourse, uploadCourse } from '../controllers/course.controllers';
import { IsAuthenticated, authorizeRoles } from '../middleware/auth';
const courseRouter= express.Router();

courseRouter.post('/create-course',IsAuthenticated,authorizeRoles("admin"),uploadCourse);
courseRouter.put('/edit-course/:id',IsAuthenticated,authorizeRoles("admin"),editCourse);
courseRouter.get('/get-course/:id',IsAuthenticated,getSingelCourse);
courseRouter.get('/get-all-courses',IsAuthenticated,getAllCourses);
courseRouter.get('/get-courses',IsAuthenticated,authorizeRoles("admin"),getAllCourse);
courseRouter.get('/get-course-content/:id',IsAuthenticated,getCourseByUser);
courseRouter.put('/add-question',IsAuthenticated,addQestion);
courseRouter.put('/add-answer',IsAuthenticated,addAnswer);
courseRouter.put('/add-review/:id',IsAuthenticated,addReview);
courseRouter.put('/add-review-reply',IsAuthenticated,addReviewReply);
courseRouter.delete('/delete-course/:id',IsAuthenticated,authorizeRoles("admin"),deleteCourse);

export default courseRouter;