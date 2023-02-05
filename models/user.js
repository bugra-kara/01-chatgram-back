const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new Schema({
      name: {
        type: String,
        required: false,
        maxlength: 50,
        minlength: 3,
      },
      username: {
        type: String,
        required: [true, 'Please provide username'],
        maxlength: 50,
        minlength: 3,
      },
      email: {
        type: String,
        required: [true, 'Please provide email'],
        match: [
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          'Please provide a valid email',
        ],
        unique: true,
      },
      password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: 6,
      },
      role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
      },
      verificationToken: {
        type: String
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      verifiedDate: {
        type: Date
      },
      passwordToken: {
        type: String
      },
      passwordTokenExpirationDate: {
        type: Date
      },
      friends: {
        type: [{
          userId: {
            type: String
          },
          username: {
            type: String
          }
        }]
      },
      reqFriends: {
        type: [{
          userId: {
            type: String
          },
          username: {
            type: String
          }
        }]
      },
      sentFriends: {
        type: [{
          userId: {
            type: String
          },
          username: {
            type: String
          }
        }]
      },
      chatIds: {
        type: [{
          chatId: {
            type: String
          },
          receiverId: {
            type: String
          },
          receiverUsername: {
            type: String
          },
          receiverShort: {
            type: String
          },
          lastMessage: {
            type: {
              message: {
                  type: String,
                  default: ""
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
              }
            }
          },
          unReadedMsg: {
            type: String
          }
        }]
      }
},
    {
    virtuals: true,
    timestamps: true
    }
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (canditatePassword) {
    const isMatch = await bcrypt.compare(canditatePassword, this.password)
    return isMatch
  }

const User = mongoose.model('User', userSchema);

module.exports = User;