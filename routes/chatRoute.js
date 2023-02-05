const express = require('express');
const router = express.Router();
const {
    auth
} = require('../middleware/authentication')
const {
    getAllChats,
    getOneChat,
    updateAllChats,
    updateOneChat,
    deleteOneChat,
    createOneChat,
    updateUserChat,
    updateOneChatRead,
} = require('../controllers/chatController');

router.get('/:id', auth, getAllChats)
router.get('/users/:id', auth, getOneChat)
router.post('/users', auth, createOneChat)
router.patch('/users/:id', auth, updateUserChat)
router.patch('/:id', auth, updateAllChats)
router.patch('/chat/:id', auth, updateOneChat)
router.patch('/chat/read/:id', auth, updateOneChatRead)
router.delete('/users/:id', auth, deleteOneChat);



module.exports = router