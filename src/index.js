const serverless = require('serverless-http');
const express = require('express');
require('./db/mongoose');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const hbs = require('hbs');
const bodyparser = require('body-parser');
const router = require('./routers/studentroutes');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../views/views');
const partialsPath = path.join(__dirname, '../views/partials')

app.set('view engine', 'hbs');
app.set('views', viewsPath);

hbs.registerPartials(partialsPath);
app.use(express.static(publicDirectoryPath));
app.use(router);
// app.use(Server_chat)
app.use(express.json());
app.use(bodyparser.urlencoded({
  extended: true
}));

const Filter = require('bad-words');
const { addUser, removeUser, getUser, getusersInRoom, generateHistoryMessage, generateMessage, generateLocationMessage } = require('./models/chat_database');
const Room = require('./models/room');
const User = require('./models/users')
let room;

io.on('connection', (socket) => {
  console.log('New webSocket Connection');
  socket.on('join', async (options, callback) => {
    const mainId = await User.findById({ _id: options.username });
    room = await Room.findById({ _id: options.room });
    const { error, user } = await addUser({ id: socket.id, ...options })
    if (error) {
      return callback(error)
    }

    socket.join(user.room);
    const roomMainUser = await Room.findById({ _id: room._id });
    const count = roomMainUser.message.length;
    const limit = 8;
    let i = limit;
    if (count <= limit) {
      i = count;
      while (i > 0) {
        socket.emit('message', await generateHistoryMessage(room._id, count, i));
        i--;
      }
    } else {
      while (i > 0) {
        socket.emit('message', await generateHistoryMessage(room._id, count, i));
        i--;
      }
    }
    socket.broadcast.to(user.room).emit('message', await generateMessage(room._id, 'Admin', `${mainId.name} has joined!`));
    getusersInRoom(user.room).then((user_value) => {
      let usersOnline = [];
      let usersOffline = [];
      user_value.forEach(element => {
        if (element.online) {
          usersOnline.push({ online: element.online })
        } else if (element.offline) {
          usersOffline.push({ offline: element.offline })
        }
      });
      io.to(user.room).emit('roomData', {
        room: user.room,
        online: usersOnline,
        offline: usersOffline
      });
    }).catch((e) => {
      console.log(e)
    })
    callback();
  })

  socket.on('SendMessage', async (msg, callback) => {
    const id = room._id;
    const user = await getUser(socket.id);
    const filter = new Filter()
    if (filter.isProfane(msg)) {
      return callback('Profanity is not allowed...!');
    }
    io.to(user.room).emit('message', await generateMessage(id, user.username, msg));
    callback();
  });

  socket.on('sendLocation', async (sendloc, callback) => {
    const id = room._id;
    const user = await getUser(socket.id);
    io.to(user.room).emit('locationMessage',await generateLocationMessage(id, user.username, `https://google.com/maps?q=${sendloc.latitude},${sendloc.longitude}`));
    callback();
  })

  socket.on('disconnect', async () => {
    const id = room._id;
    const user = await removeUser(socket.id);
    if (user) {
      getusersInRoom(user.room).then((user_value) => {
        let usersOnline = [];
        let usersOffline = [];
        user_value.forEach(element => {
          if (element.online) {
            usersOnline.push({ online: element.online })
          } else if (element.offline) {
            usersOffline.push({ offline: element.offline })
          }
        });
        io.to(user.room).emit('roomData', {
          room: user.room,
          online: usersOnline,
          offline: usersOffline
        });
      }).catch((e) => {
        console.log(e)
      })
    }
  })
})

//************************************************************* */

module.exports.handler = serverless(app);


/*************************************************************** */
// server.listen(port, () => {
//   console.log('server is up on port:' + port);
// });
