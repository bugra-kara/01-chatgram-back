const Chat = require('../models/chats');
const User = require('../models/user');
const { v4: uuidv4 } = require('uuid');

const createOneChat = async (req, res) => {
    const { chatUsers } = req.body
    const { userId } = req.user
    const chatIdExist = await User.findOne({
        _id: userId,
        'friends.userId' : chatUsers[1].userId
    })
    const chatId = uuidv4()
    if(chatIdExist === null) {
        const createChat = await Chat.create({chatId, chatUsers})
        const user1 = await User.findById({_id: chatUsers[0].userId}).select('username')
        const user2 = await User.findById({_id: chatUsers[1].userId}).select('username')
        const user1Short = user1.username.slice(0,1)
        const user2Short = user2.username.slice(0,1)
        await User.findByIdAndUpdate({_id: chatUsers[1].userId}, 
            {$push: {chatIds: {chatId: chatId, receiverId: chatUsers[0].userId, receiverUsername: user1.username, receiverShort: user1Short, lastMessage: {}, unReadedMsg: 0}}}
            )
        await User.findByIdAndUpdate({_id: chatUsers[0].userId},
            {$push: {chatIds: {chatId: chatId, receiverId: chatUsers[1].userId, receiverUsername: user2.username, receiverShort: user2Short, lastMessage: {}, unReadedMsg: 0}}})
        res.json({result: "success", created: createChat})
    }
    else {
        res.json({result: "failed", msg: "chat exist"})
    }
    
}
const updateUserChat = async (req, res) => {
    const { lastMessage } = req.body
    const { id } = req.params
    const { senderId, receiverId } = lastMessage
    const chatIdExist = await Chat.findOne({chatId: id})
    if(lastMessage && chatIdExist) {
        await User.findByIdAndUpdate({_id: senderId},
            {$set: {
                "chatIds.$[element].lastMessage" : lastMessage
            }},
            {
                "multi": true,
                "arrayFilters": [
                    {
                        "element.chatId" : id 
                    }
                ]
            }
            )
        await User.findByIdAndUpdate({_id: receiverId},
            {$set: {
                "chatIds.$[element].lastMessage" : lastMessage
            }},
            {
                "multi": true,
                "arrayFilters": [
                    {
                        "element.chatId" : id 
                    }
                ]
            }
            )
        res.json({result: "success",})
    }
    else {
        res.json({result: "failed", msg: "last msg didnt exist"})
    }
}
const updateOneChatRead = async (req, res)=> {
    const userId = req.params.id
    const userExist = await User.findOne({_id: userId})
    userExist.chatIds.forEach(async (e) => {
        const unReadedMsg = await Chat.aggregate([
            { "$unwind": {path: "$messages", includeArrayIndex: "read"} },
            { $match: {"chatId": e.chatId}},
            {
                $match: {"messages.receiverId": userId}
            },
            {
                $match: {"messages.read": "false"}
            },
            { $group: {
                _id: 0,
                total: {$sum: 1}}
            },
        ])
        if(unReadedMsg[0] !== undefined) {
            const up = await User.findByIdAndUpdate({_id: userId}, { 
                $set: {
                    "chatIds.$[element].unReadedMsg" : unReadedMsg[0].total
                }}, 
                {
                    "multi": true,
                    "arrayFilters": [ {
                        "element.chatId" : e.chatId
                    }]
                }
            )
        }
        else {
            const up = await User.findByIdAndUpdate({_id: userId}, { 
                $set: {
                    "chatIds.$[element].unReadedMsg" : 0
                }}, 
                {
                    "multi": true,
                    "arrayFilters": [ {
                        "element.chatId" : e.chatId
                    }]
                }
            )
        }
    })
}
const getAllChats = async (req, res) => {
    console.log(req)
    const {id} = req.params
    const userExist = await User.findOne({_id: id})
    if(userExist) {
        setTimeout(() => {
            res.json({result: "success", data: [...userExist.chatIds]})
        }, 250);
    }
    else {
        res.json({result: "failed", msg: "you cannot see this user's chat"})
    }
}
const getOneChat = async (req, res) => {
    const chatId = req.params.id
    const {userId} = req.query
    const isOk = await Chat.find({
        $and: [
            {
                chatUsers: {
                    $elemMatch: {
                        userId: userId
                    }
                }
            },
            {
                chatId: chatId
            }
        ]
    })
    if(isOk){
        const chatExist = await Chat.findOne({chatId: chatId})
        const date = new Date()
        await Chat.findOneAndUpdate({chatId: chatId}, {
            $set: {
                "chatUsers.$[element].userLastUpdate": date
            }},
            {
                "multi": true,
                "arrayFilters": [
                    {
                        "element.userId" : userId
                    }
                ]
            }
        )
        await Chat.findOneAndUpdate({chatId: chatId}, {
            $set: {
                "messages.$[element].read": true
            }},
            {
                "multi": true,
                "arrayFilters": [
                    {
                        "element.receiverId": userId
                    }
                ]
            }
        )
        res.json({result: "success", data: chatExist.messages})
    }
    else {
        res.json({result: "failed", msg: "you cannot acccess"})
    }
}
const updateAllChats = async (req, res) => {
    res.json({result: "success"})
}
const updateOneChat = async (req, res) => {
    const {messages } = req.body
    const { id } = req.params
    const chatIdExist = await Chat.findOne({chatId: id})
    if(chatIdExist) {
        const updateChat = await Chat.findOneAndUpdate({chatId: id}, { $push : {messages:  messages} })
        res.json({result: "success", chat: updateChat})
    }
    else {
        res.json({result: "failed", msg: "chat does not exist"})
    }
}
const deleteOneChat = async (req, res) => {
    
    res.json({result: "success"})
}
module.exports = {
    getAllChats,
    getOneChat,
    updateAllChats,
    updateOneChat,
    deleteOneChat,
    createOneChat,
    updateUserChat,
    updateOneChatRead,
}