const express = require('express');
const router = express.Router();
const {
    auth
} = require('../middleware/authentication')
const {
    getUser,
    getAllUsers,
    updateUser,
    deleteUser,
    showCurrentUser,
    updatePassword,
    reqFriendUser,
    resFriendUser,
    getFriendReq,
    resFriendUserReject
} = require('../controllers/userController');

router.get('/', auth, getAllUsers)
router.get('/showcurrent', auth, showCurrentUser)
router.get('/search', auth, getUser)
router.patch('/', auth, updateUser)
router.get('/friend/req', auth, getFriendReq)
router.patch('/friend/req', auth, reqFriendUser)
router.patch('/friend/res', auth, resFriendUser)
router.patch('/friend/resReject', auth, resFriendUserReject)
router.patch('/updatepassword', auth, updatePassword)
router.delete('/', auth, deleteUser);



module.exports = router