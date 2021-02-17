const mongoose = require('mongoose');
const validator = require('validator');
const Room = require('./room');
const User = require('./users')

const chatSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  room: {
    type: String,
    required: true,
    trim: true
  }
});

const Chat = mongoose.model('Chat', chatSchema);
const users = [];
const addUser = async ({ id, username, room }) => {
  username = username.trim().toLowerCase(),
    room = room.trim().toLowerCase()

  if (!username || !room) {
    return {
      error: 'username and room are required'
    }
  }

  async () => {
    const exist = await Chat.findone({ userId: username });
    if (exist) {
      return {
        error: 'Username is in use..!'
      }
    }
  }

  const user = { id, username, room }
  users.push(user)
  const mainUserName = await User.findById({ _id: username });

  const user_data = new Chat({
    id: user.id,
    userId: user.username,
    username: mainUserName.name,
    room: user.room
  });

  await user_data.save().then((data) => {
  }).catch((e) => {
    console.log(e)
  });
  return { user }
}

const removeUser = async (id) => {
  const data = await Chat.findOneAndRemove({ id });
  const index = users.findIndex((user) => user.id === id)
  if (index !== -1) {
    const removedChatData = await users.splice(index, 1)[0];
    return data;
  }
}

const getUser = async (id) => {
  const users = await Chat.findOne({ id: id });
  return users;
}

const getusersInRoom = async (room) => {
  let usersOnline = [];
  let usersOffline = [];
  const users = await Chat.find({ room: room });
  users.forEach(name => {
    usersOnline.push({ online: name.username })
  });
  let size = usersOnline.length;
  const roomData = await Room.findOne({ _id: room })
  usersOffline = roomData.userNames;
  let j = 0
  for (const i in usersOnline) {
    j = 0;
    usersOffline.forEach(element => {
      // console.log('?',element,j)
      if (usersOnline[i].online === element) {
        usersOffline.splice(j, 1)
      }
      j++
    });
  }
  usersOffline.forEach(element => {
    usersOnline.push({ offline: element })
  });
  return usersOnline;
}

const generateHistoryMessage = async (id, count ,chatIndex) => {
  const roomHistoryMessage = await Room.findById({ _id: id });
  const messageData = roomHistoryMessage.message[(count-1) - chatIndex];
  return {
    username: messageData.username,
    text: messageData.text,
    createdAt: messageData.createdAt
  }

}

const generateMessage = async (id, username, text) => {
  const msg = [];
  msg.push({
    id,
    username,
    text,
    createdAt: new Date().getTime()
  });

  const roomMessage = await Room.findById({ _id: id })

  if (roomMessage) {
    let roomHistoryData = [];
    roomMessage.message.forEach(element => {
      roomHistoryData.push(element)
    });
    msg.forEach(element => {
      roomHistoryData.push(element)
    });
    const message = await Room.findByIdAndUpdate({ _id: id }, { message: roomHistoryData })
    return {
      username,
      text,
      createdAt: new Date().getTime()
    }
  } else {
    console.log('error....!');
  }
}

const generateLocationMessage = async (id, username, text) => {
  const msg = [];
  msg.push({
    id,
    username,
    text,
    createdAt: new Date().getTime()
  });
  
  const roomMessage = await Room.findById({ _id: id })
  if (roomMessage) {
    let roomHistoryData = [];
    roomMessage.message.forEach(element => {
      roomHistoryData.push(element)
    });
    msg.forEach(element => {
      roomHistoryData.push(element)
    });
    const message = await Room.findByIdAndUpdate({ _id: id }, { message: roomHistoryData })

    return {
      username,
      text,
      createdAt: new Date().getTime()
    }
  } else {
    console.log('error....!');
  }

}

module.exports = {
  Chat,
  addUser,
  removeUser,
  getUser,
  getusersInRoom,
  generateHistoryMessage,
  generateMessage,
  generateLocationMessage
}
