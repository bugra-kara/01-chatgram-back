const User = require('../models/user');
const { StatusCodes } = require('http-status-codes')
const {
    createTokenUser,
    attachCookiesToResponse
  } = require('../utils');

const getUser = async (req, res) => {
    const {search, userId} = await req.query
    const q = search.toString()
    let user
    let reqUser 
    let reqControl
    
    console.log(search, userId);
    if(q !== "") {
        reqUser = await User.findById({_id: userId}).select('sentFriends').select('_id').select('username')
        
        user = await User.find({ $and: [
            {username: {$regex: `.*${q}` , $options: "i"}},
            {username: {$not: {$regex: reqUser.username}}}
        ]}).select('_id').select('username')
        reqControl = await User.find({
            _id: userId
        }).select('friends')
        let inside = [...user]
        const isUser = reqControl[0].friends.forEach((item, index)=> {
            inside = inside.filter((item2)=>{
                if(item.username === item2.username) {
                    reqControl[0].friends.splice(index,1, {})
                }
                else {
                    return item2
                }
            })
            
        })
        if(inside.length > 0){
            const newResp = inside.map((item)=> {
                const response = reqUser.sentFriends.find(({userId}) => userId === item._id.toString())
                if(response){
                    return {_id: item._id, username: item.username, isSent: true}
                }
                else {
                    return {_id: item._id, username: item.username, isSent: false}
                }
            })
            res.status(200).json({result: "success", data: newResp})
        }
        else {
            res.status(200).json({result: "failed", msg: "didnt found user"})    
        }
    }
    else {
        res.status(200).json({result: "failed", msg: "didnt found user"})
    }
}
const reqFriendUser = async (req, res) => {
    const {userId} = req.body
    const user = req.user.userId
    const friendControl = await User.find({
        _id: userId,
        'reqFriends.userId': user
    }).select('username')
    const reqControl = await User.find({
        _id: userId,
        'friends.userId': user
    })
    if(friendControl.length > 0 || reqControl.length > 0){
        res.status(200).json({result: "failed", msg: "already sent"})
    }
    else {
        const reqUser = await User.findById({_id: userId}).select('username')
        if((userId && user) && reqUser) {
            await User.findOneAndUpdate({_id: userId}, {
                $push: {
                    reqFriends: {userId: req.user.userId , username: req.user.username}
                }
            })
            await User.findOneAndUpdate({_id: user}, {
                $push: {
                    sentFriends: {userId: reqUser._id , username: reqUser.username}
                }
            })
            res.status(200).json({result: "success"})
        }
        else {
            res.status(200).json({result: "failed"})
        }
    }
}
const showCurrentUser = async (req, res) => {
    const userId = await req.user.userId.toString()
    const user = await User.findById({_id: userId}).select('-password')
    res.status(200).json({result: "success", data: user})
}
const getAllUsers = async (req, res) => {
    const allUsers = await User.find({}).select('-password')
    res.status(200).json({result: "success", data: allUsers})
}
const updatePassword = async (req, res) => {
    const {newpass, oldpass} = req.body
    if (!oldpass || !newpass) {
        res.status(100).json({result: "failed", msg: "Please provide both values"})
      }
    const user = await User.findById({_id: req.user.userId})
    const isPasswordCorrect = await user.comparePassword(oldpass)
    if(!isPasswordCorrect){
        res.status(100).json({result: "failed", msg: "Pass didnt match"})
    }
    user.password = newpass
    user.save();
    res.status(200).json({data: "success"})
}
const updateUser = async (req, res) => {
    const {newName} = req.body
    if (!newName) {
        res.status(100).json({result: "failed", msg: "Please provide all values"})
      }
    const user = await User.findByIdAndUpdate({_id: req.user.userId}, {name: newName})
    const tokenUser = createTokenUser(user);
    attachCookiesToResponse({ res, user: tokenUser });
    res.status(200).json({data: "success",user})
}
const deleteUser = async (req, res) => {
    const {userId} = req.body
    const user = await User.findByIdAndRemove({_id: userId})
    res.status(200).json({status: "done"})
}
const resFriendUser = async (req, res) => {
    const {fId} = req.body
    const {userId} = req.user
    const isOk = await User.find({
        _id: userId,
        'reqFriends.userId' : fId
    }).select('reqFriends').select('username')
    if(isOk){
        const addedUser = await User.findById({_id: fId}).select('username')
        await User.findOneAndUpdate({_id: userId}, {
            $push: {
                friends: {
                    userId: fId, username: addedUser.username
                }
            }
        })
        await User.findOneAndUpdate({_id: fId}, {
            $push: {
                friends: {
                    userId: userId, username: isOk[0].username
                }
            }
        })
        await User.findOneAndUpdate({_id: userId}, {
            $pull: {
                reqFriends: {
                    userId: fId
                }
            },
        })
        await User.findOneAndUpdate({_id: fId}, {
            $pull: {
                sentFriends: {
                    userId: userId
                }
            },
        })
        res.status(200).json({result: "success", })
    }
    else {
        res.status(200).json({result: "failed", msg: "you cannot do that"})
    }
}
const resFriendUserReject = async (req, res) => {
    const {fId} = req.body
    const {userId} = req.user
    const isOk = await User.find({
        _id: userId,
        'reqFriends.userId' : fId
    }).select('reqFriends').select('username')
    if(isOk){
        await User.findOneAndUpdate({_id: userId}, {
            $pull: {
                reqFriends: {
                    userId: fId
                }
            },
        })
        await User.findOneAndUpdate({_id: fId}, {
            $pull: {
                sentFriends: {
                    userId: userId
                }
            },
        })
        res.status(200).json({result: "success", })
    }
    else {
        res.status(200).json({result: "failed", msg: "you cannot do that"})
    }
}
const getFriendReq = async (req, res) => {
    const {user} = req.query
    const isExist = await User.findOne({_id: user}).select('reqFriends')
    res.status(200).json({result: "success", data: isExist.reqFriends})
}
module.exports = {
    getUser,
    getAllUsers,
    updateUser,
    deleteUser,
    showCurrentUser,
    updatePassword,
    resFriendUser,
    reqFriendUser,
    getFriendReq,
    resFriendUserReject
}