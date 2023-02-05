const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
    refreshToken: {
        type: String,
        required: [true, 'Please provide refreshToken']
    },
    ip: {
        type: String,
        required: [true, 'Please provide ip']
    },
    useragent: {
        type: String,
        required: [true, 'Please provide useragent']
    },
    isValid: {
        type: Boolean,
        default: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
      },
},
    {
    virtuals: true,
    timestamps: true
    }
)

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;