import express from 'express'
import { registrationUser ,ActivateUser, LoginUser, LogoutUser, updateAccessToken, getUserInfo, socialAuth, UpdateUserInfo, updatePassword, updateUserProfilePicture, getAllUsers, updateUserRole, deleteUser} from '../controllers/user.controllers';
import { IsAuthenticated, authorizeRoles } from '../middleware/auth';

const userRouter= express.Router();
userRouter.post('/registration',registrationUser);
userRouter.post('/activate-user',ActivateUser);
userRouter.post('/login',LoginUser);
userRouter.get('/logout',IsAuthenticated,LogoutUser);
userRouter.get('/refresh',updateAccessToken);
userRouter.get('/me',IsAuthenticated,getUserInfo);
userRouter.post('/social-auth',socialAuth);
userRouter.put('/update-user-info',IsAuthenticated,UpdateUserInfo);
userRouter.put('/update-password',IsAuthenticated,updatePassword);
userRouter.put('/update-avatar',IsAuthenticated,updateUserProfilePicture);
userRouter.put('/update-user-role',IsAuthenticated,authorizeRoles("admin"),updateUserRole);
userRouter.get('/get-users',IsAuthenticated,authorizeRoles("admin"),getAllUsers);
userRouter.delete('/delete-user/:id',IsAuthenticated,authorizeRoles("admin"),deleteUser);
export default userRouter;