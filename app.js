require('dotenv').config()

const express = require('express')
const app = express();
const socket = require("socket.io");
const connectDB = require('./db/connect')
const morgan = require('morgan');
const cookieParser = require('cookie-parser')
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
//routes
const userRoute = require('./routes/userRoute')
const authRoute = require('./routes/authRoute')
const chatRoute = require('./routes/chatRoute')
const notFoundMiddleware = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')

app.set('trust proxy', 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 500000,
  })
)
app.use(helmet());
app.use(cors({
  origin: process.env.ORIGIN,
  credentials: true
}));
app.use(xss());
app.use(mongoSanitize());

app.use(morgan('tiny'))
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.json());
app.use(function(req, res, next) {
  res.header('Content-Type', 'application/json;charset=UTF-8')
  res.header('Access-Control-Allow-Credentials', true)
  res.header(
    'Access-Control-Allow-Headers', 'Access-Control-Allow-Origin',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  res.setHeader('Access-Control-Allow-Origin', process.env.ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next()
})
// Route linking
app.use('/api/v1/auth', authRoute)
app.use('/api/v1/users', userRoute)
app.use('/api/v1/chats', chatRoute)

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

const port = process.env.PORT || 3000
const start = async () => {
    try {
      await connectDB(process.env.MONGO_URI)
      const server = app.listen(port, () =>
        console.log(`Server is listening on port ${port}...`)
      );
      const io = socket(server, {
        cors: {
          origin: process.env.ORIGIN,
          credentials: true,
        },
      });
      let activeUsers = []
      io.on("connection", (socket) => {
        socket.on('new-user-add', (newUserId)=> {
          if(!activeUsers.some((user)=> user.userId === newUserId) && newUserId !== null){
            activeUsers.push({
              userId: newUserId,
              socketId: socket.id
            })
          }
          io.emit('get-users', activeUsers) 
        })
        socket.on('send-msg', (data)=> {
          const user = activeUsers.find((user)=> {
            return ( user.userId === data[0].receiverId )
          })
          if(user) {
            io.to(user.socketId).emit('receive-message', [data])
          }
        })
        socket.on('accep-friend', (data)=> {
          const user = activeUsers.find((user)=> {
            return ( user.userId === data )
          })
          if(user) {
            io.to(user.socketId).emit('receive-friend', user.userId)
          }
        })
        socket.on('disconnect', ()=>{
          activeUsers = activeUsers.filter((user)=> user.socketId !== socket.id )
          io.emit('get-users', activeUsers)
          console.log("connected Users", activeUsers);
        })
      });
    } catch (error) {
      console.log(error)
    }
  }; 
start()