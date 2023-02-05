const mongoose = require("mongoose");
const Schema = mongoose.Schema
const bcrypt = require('bcryptjs')

const date = () => {
    const dateNow = new Date()
    return dateNow
}

const chatSchema = new Schema({
    chatId: {
        type: String
    },
    chatUsers: {
        type: [{
            userId: {
                type: String
            },
            userLastUpdate: {
                type: Date,
                default: date()
            }
        }],
        required: [true, 'Please provide senderId'],
    },
    messages: {
        type: [{
            message: {
                type: String,
            },
            senderId: {
                type: String,
            },
            receiverId: {
                type: String,
            },
            messageDate: {
                type: String
            },
            messageHour: {
                type: String
            },
            messageMin: {
                type: String
            },
            date: {
                type: Date
            },
            read: {
                type: String,
                default: false
            }
        }],
        default: []
    }
},
    {
    virtuals: true,
    timestamps: true
    }
)
/*
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});*/

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;