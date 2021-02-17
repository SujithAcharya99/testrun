const express = require('express');
const Admin = require('../models/admin');
const Student = require('../models/student');
const Teacher = require('../models/teacher');
const Course = require('../models/course');
const User = require('../models/users');
const Test = require('../models/test');
const { Chat } = require('../models/chat_database');
const auth = require('../middleware/auth');
const browserify = require('browserify')
const path = require('path');
const bodyparser = require('body-parser');
const Room = require('../models/room');
const router = new express.Router();

global.value = 'hello';
router.use(bodyparser.urlencoded({
  extended: true
}));

router.get('/', async (req, res) => {
  
  res.render('index', {
    title: 'Login Page',
  });
})

router.get('/createGroup/:useremail', auth, async (req, res) => {

  const roomData = await Room.find({ type: 2 });
  res.render('groupChat', {
    roomData
  })
});


router.get('/createNewGroup', auth, async (req, res) => {

  const username = req.user.name;
  const userData = await User.find({});
  let users_data = []

  for (const i in userData) {
    if (userData[i].name !== username) {
      users_data.push(userData[i]);
    }
  }
  res.render('newGroup', {
    users_data
  })
});

router.post('/newGroupData', auth, async (req, res) => {

  const username = req.user.name;
  const id = req.user._id;
  const groupName = req.body.groupName;
  const email = req.user.email;
  const roll = req.user.roll;
  const users = await User.find({});
  let users_data = []
  let userNames = [];
  let userIDs = [];


  for (const i in users) {
    if (users[i].name !== username) {
      users_data.push(users[i]);
    }
  }
  const emailData = req.body.name;
  for (let i = 0; i < emailData.length; i++) {
    const userInfo = await User.findOne({ email: emailData[i] });
    userIDs.push(userInfo._id);
    userNames.push(userInfo.name);
  }
  userIDs.push(id);
  userNames.push(username);
  if (roll == 'student') {
    const userData = await Student.findOne({ email });
    const roomGroup = new Room({ mainUser: groupName, type: 2, userNames: userNames, userIds: userIDs });
    roomGroup.save();
    res.redirect(`/chat/${userData._id}&${userData.roll}`)
  } else if (roll == 'teacher') {
    const userData = await Teacher.find({ email })
    const roomGroup = new Room({ mainUser: groupName, type: 2, userNames: userNames, userIds: userIDs });
    roomGroup.save();
    res.redirect(`/chat/${userData._id}&${userData.roll}`)
  }

});

router.get('/group/delete/:id', auth, async (req, res) => {

  const email = req.user.email;
  const roll = req.user.roll;
  if (roll === 'student') {
    const userData = await Student.findOne({ email });
    console.log(req.params.id);
    const roomData = await Room.findOneAndDelete({ type: 2 });
    res.redirect(`/chat/${userData._id}&${userData.roll}`)
  } else if (roll === 'teacher') {
    const userData = await Teacher.findOne({ email });
    const roomData = await Room.findOneAndDelete({ type: 2 });
    res.redirect(`/chat/${userData._id}&${userData.roll}`)
  }
});


router.get('/group/addmember/:id', auth, async (req, res) => {
  const id = req.params.id;
  const roomData = await Room.findById({ _id: id });
  const roomUsers = roomData.userNames;
  let pushData = []

  let users = await User.find({});
  let popData = users
  for (let i = 0; i < roomUsers.length; i++) {
    const roomE = roomUsers[i];
    users.forEach(element => {
      if (element.name === roomE) {
        popData.splice(users.indexOf(element), 1)
      }
    });

  }
  res.render('addMember', {
    roomData,
    popData
  })
});

router.post('/addmember/:id', auth, async (req, res) => {

  let userIds = [];
  let usernames = [];
  const id = req.params.id;
  let newIds = [];
  if ((req.body.name).length === 24) {
    newIds.push(req.body.name);
  } else {
    newIds = req.body.name
  }

  const groupdata = await Room.findById({ _id: req.params.id })
  userIds = groupdata.userIds;
  usernames = groupdata.userNames;
  for (let i = 0; i < newIds.length; i++) {
    const newUserName = await User.findById({ _id: newIds[i] })
    usernames.push(newUserName.name)
  }
  newIds.forEach(element => {
    userIds.push(element)
  });

  await Room.findByIdAndUpdate({ _id: id }, { userNames: usernames })
  const result = await Room.findByIdAndUpdate({ _id: id }, { userIds: userIds })
  const email = req.user.email;
  res.redirect(`/createGroup/${email}`)
});

router.get('/groupChatList/:id', auth, async (req, res) => {
  let i = 0;
  let index = []
  const id = req.user._id.toString();
  const userdata = req.user
  const groupData = await Room.find({ type: 2 })
  groupData.forEach(element => {
    element.userIds.forEach(data => {
      if (data === id) {
        index.push(element)
      }
    });
    i++

  });
  res.render('groupChatList', {
    userdata,
    index
  })
});

router.get('/groupChatList/:id', auth, async (req, res) => {

  let i = 0;
  let index = []
  const id = req.user._id.toString();
  const userdata = req.user
  const groupData = await Room.find({ type: 2 })
  groupData.forEach(element => {
    element.userIds.forEach(data => {
      if (data === id) {
        index.push(element)
      }
    });
    i++
  });
  res.render('groupChatList', {
    userdata,
    index
  })
});

router.get('/groupChat/:id', auth, async (req, res) => {
  const userId = req.user._id;
  const roomId = req.params.id;
  res.redirect(`/chat.html?username=${userId}&room=${roomId}`);
});


router.get('/chat_list/:user1&:user2&:roll&:type', auth, async (req, res) => {
  // console.log(req.params);
  const roll = req.params.roll;
  const reqData = req.params;
  const type = req.params.type;
  var user1Data;
  if (roll === 'student') {
    const mainUserData = await Student.findById(req.params.user1);
    user1Data = await User.findOne({ email: mainUserData.email });
    // console.log('user1data::',user1Data)
  } else if (roll === 'teacher') {
    const mainUserData = await Teacher.findById(req.params.user1);
    user1Data = await User.findOne({ email: mainUserData.email });
    // console.log('user1data::', mainUserData.name)
  }
  // console.log('user1data::', user1Data._id);
  // console.log('user1data::', user1Data.name)


  const userdata = await User.findById(req.params.user2);

  let userNames = [];
  const username1 = user1Data.name;
  userNames.push(username1);
  const username2 = userdata.name;
  userNames.push(username2);
  const room = userdata.roll;
  const userIdData = [];
  for (const i in reqData) {
    if (i === 'user1') {
      userIdData.push(user1Data._id.toString())
    } else {
      userIdData.push(reqData[i])
    }
  }

  const userId = userIdData[0];
  const roomExist = await Room.find({ type: type });


  let roomIds;
  let existIndex = -1
  let indexCount = 0;
  roomExist.forEach(element => {
    roomIds = element.userIds;
    for (let i = 0; i < roomIds.length - 2; i++) {
      if (userIdData[0] === roomIds[i]) {
        if (userIdData[1] === roomIds[i + 1]) {
          existIndex = indexCount;
        }
      } else if (userIdData[1] === roomIds[i]) {
        if (userIdData[0] === roomIds[i + 1]) {
          existIndex = indexCount;
        }
      }
    }
    indexCount++;
  });
  if (existIndex === -1) {
    const roomData = new Room({ mainUser: userId, type: 1, userNames: userNames, userIds: userIdData });
    roomData.save();
    res.redirect(`/chat.html?username=${userId}&room=${roomData._id}`);
  } else {
    const exist = roomExist[existIndex];
    if (exist) {
      res.redirect(`/chat.html?username=${userId}&room=${exist._id}`);
    }
  }
});

router.get('/chat/:id&:roll', auth, async (req, res) => {
  const roll = req.params.roll;
  if (req.params.roll === 'student') {
    const userdata = await Student.findById(req.params.id);
    const users = await User.find({});
    let users_data = []
    for (const i in users) {
      if (users[i].name !== userdata.name) {
        users_data.push(users[i]);
      }
    }
    const useremail = userdata.email;
    const userid = userdata.id;
    res.render('index_chat', {
      users_data,
      userdata,
      useremail,
      userid,
      roll
    })
  } else if (req.params.roll === 'teacher') {
    const userdata = await Teacher.findById(req.params.id);
    const users = await User.find({});
    let users_data = []
    for (const i in users) {
      if (users[i].name !== userdata.name) {
        users_data.push(users[i]);
      }
    }
    const useremail = userdata.email;
    const userid = userdata.id;
    res.render('index_chat', {
      users_data,
      userdata,
      useremail,
      userid,
      roll
    })
  }
})

router.get('/test', async (req, res) => {

  res.render('test', {
    title: 'Login Page',
  });
})

router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Me',
  });
});

router.get('/login/admin', async (req, res) => {
  res.render('loginAdmin');
})

router.post('/login/admin', async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email, password: req.body.password });
    if (admin) {
      return res.redirect('/admin/dashboard');
    }
  } catch (e) {
    res.status(400).send(e)
  }
});

router.get('/login/teacher', auth, async (req, res) => {
  res.render('loginTeacher');
})

router.get('/teacher/dashboard/:id', auth, async (req, res) => {

  const student = await Student.find({});
  const teacher = await Teacher.findById(req.params.id);
  res.render('teacherDashboard', {
    title: 'Teacher Page',
    body: teacher.name,
    teacher,
    student
  });
});

router.get('/student/dashboard', auth, async (req, res) => {
  const student = await Student.findOne({ email: req.user.email });

  res.render('studentDashboard', {
    title: 'Student Page',
    student
  });
});

router.get('/student/score/:id', auth, async (req, res) => {
  _id = req.params.id;
  const student = await Student.findById(req.params.id)
  const course = await Course.findOne({ studentName: student.name, subject: student.subject });
  const test = await Test.findOne({ studentName: student.name, subject: student.subject });
  marks = test.score;
  totalQuestions = test.answer.length
  score = (marks / totalQuestions) * 10;
  res.render('testing', {
    score,
    course,
    _id
  })
});

router.post('/login', async (req, res) => {

  try {
    const admin = await Admin.findOne({ email: req.body.email, password: req.body.password });
    if (admin) {
      return res.redirect('/admin/dashboard');
    } else {
      const user = await User.findByCredentials(req.body.email, req.body.password);
      const token = await user.generateAuToken();
      res.cookie("jwt", token, { httpOnly: true });

      if (!user) {
        return res.status(404).send();
      }
      if (user.roll === 'not assigned') {
        res.render('notAssigned', {
          title: 'Home Page',
          user,
          message: ' Pls wait for Admin to assigned',
        });
      } else if (user.roll === 'student') {
        try {
          const student = await Student.findByCredentials(req.body.email, req.body.password);
          const token = await student.generateAuToken();
          const student_id = student._id;
          if (!student) {
            return res.status(404).send();
          }
          res.redirect('/student/dashboard');
        } catch (e) {
          res.status(400).send(e)
        }
      } else if (user.roll === 'teacher') {
        try {
          const teacher = await Teacher.findByCredentials(req.body.email, req.body.password);
          const token = await teacher.generateAuToken();
          const student = await Student.find({});
          if (!teacher) {
            return res.status(404).send();
          }
          teacher_id = teacher._id
          res.redirect(`/teacher/dashboard/${teacher_id}`);
        } catch (e) {
          res.status(400).send(e)
        }
      }
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/signup', (req, res) => {
  const user = new User(req.body)
  user.save().then(() => {
    res.redirect('/');
  }).catch((e) => {
    res.status(400).send(e);
  });
})

router.get('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save();
    res.redirect('/');
  } catch (e) {
    res.status(500).send();
  }
});

router.get('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    // res.send();
    res.redirect('/');
  } catch (e) {
    res.status(500).send();
  }
})

router.get('/user/me', auth, async (req, res) => {
  console.log('inside /users')
  res.send(req.user);
});

router.get('/admin/dashboard', async (req, res) => {

  const student = await Student.find({});
  const teacher = await Teacher.find({});
  const user = await User.find({});
  res.render('adminDashboard', {
    admin: 'Admin',
    user,
    student,
    teacher
  })
});

router.post('/admin', (req, res) => {
  const admin = new Admin(req.body)
  admin.save().then(() => {
    res.status(201).send(admin)
  }).catch((e) => {
    res.status(400).send(e);
  })
});

router.get('/admin', (req, res) => {
  Admin.find({}).then((admin) => {
    res.send(admin);
  }).catch((e) => {
    res.status(500).send();
  })
});

router.get('/newStudent', (req, res) => {
  res.render('newStudent')
});

router.post('/student', (req, res) => {
  const student = new Student(req.body)
  student.save().then(() => {
    res.redirect('/admin/dashboard');
  }).catch((e) => {
    res.status(400).send(e);
  })
});

router.get('/students', (req, res) => {
  Student.find({}).then((student) => {
    res.send(student);
  }).catch((e) => {
    res.status(500).send();
  })
});

router.get('/student/exam/:id', auth, async (req, res) => {

  const _id = req.params.id;
  Student.findById({ _id }).then(async (student) => {
    const testdata = await Test.findOne({ studentName: student.name, subject: student.subject });
    if (!testdata) {
      res.status(400).send()
    }
    const question = testdata.questions[0].mcq_question;
    const mcq = testdata.questions;
    res.render('Exam1', {
      student,
      testdata,
    })
  }).catch((e) => {
    res.status(500).send(e);
  })
});

router.get('/students/:id', (req, res) => {
  const _id = req.params.id;
  Student.findById(_id).then((student) => {
    if (!student) {
      return res.status(404).send();
    }
    res.send(student);
  }).catch((e) => {
    res.status(500).send();
  })
});

router.get('/student/edit/:id', async (req, res) => {
  const _id = req.params.id;
  const student = await Student.findById(_id);
  res.render('editStudent', {
    title: 'Student Page',
    student
  });
});

router.post('/student/edit/:id', async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'roll', 'age', 'subject'];
  const isValidUpdate = updates.every((update) => allowedUpdates.includes(update));
  if (!isValidUpdate) {
    return res.status(404).send({ error: 'Invalid Update...!' })
  }
  try {
    const student = await Student.findOneAndUpdate({ _id }, req.body, { new: true })
    updates.forEach((update) => student[update] = req.body[update])
    if (!student) {
      return res.status(404).send();
    }
    res.redirect('/admin/dashboard');
  } catch (e) {
    res.status(400).send();
  }
})

router.get('/student/delete/:id', async (req, res) => {
  const _id = req.params.id;
  const student = await Student.findById(_id);
  const user = await User.findOne({ email: student.email });
  if (!student) {
    res.status(400).send();
  }
  try {
    await user.remove();
    await student.remove();
  } catch (e) {
    res.status(400).send();
  }
  res.redirect('/admin/dashboard');
})

router.get('/newTeacher', (req, res) => {
  res.render('newTeacher')
})

router.post('/teacher', (req, res) => {
  const teacher = new Teacher(req.body)
  teacher.save().then(() => {
    res.redirect('/admin/dashboard');
  }).catch((e) => {
    res.status(400).send(e);
  })
});

router.get('/teachers', (req, res) => {
  Teacher.find({}).then((teacher) => {
    res.send(teacher);
  }).catch((e) => {
    res.status(500).send();
  })
});

router.get('/teacherUserList/:id', async (req, res) => {

  const teacher = await Teacher.findById(req.params.id)
  await User.find({ roll: 'not assigned' }).then((user) => {
    if (!user) {
      return res.student(400).send()
    } else if (user.length === 0) {

      return res.status(404).send({ error: 'no data found' })
    }
    else {

      res.render('teacherUserList', {
        user,
        teacher
      })
    }
  }).catch((e) => {
    res.status(400).send()
  })
})

router.get('/teacher/userEdit/:id', async (req, res) => {
  const _id = req.params.id;
  const user = await User.findById(_id);
  res.render('teacherEdit', {
    title: 'Teacher Page',
    user
  })
});

router.post('/teacher/userEdit/:id', async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'roll', 'age'];
  const isValidUpdate = updates.every((update) => allowedUpdates.includes(update));
  if (!isValidUpdate) {
    return res.status(404).send({ error: 'Invalid Update...!' })
  }
  try {
    const user = await User.findOneAndUpdate({ _id }, req.body, { new: true })
    updates.forEach((update) => user[update] = req.body[update])
    if (!user) {
      return res.status(404).send();
    }
    res.redirect(`/teacherUserList/${_id}`);
  } catch (e) {
    res.status(400).send();
  }
})

router.get('/teacher/edit/:id', async (req, res) => {
  const _id = req.params.id;
  const teacher = await Teacher.findById(_id);
  res.render('editTeacher', {
    title: 'Teacher Page',
    teacher
  })
})

router.post('/teacher/edit/:id', async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'roll', 'age', 'subjects_taught'];
  const isValidUpdate = updates.every((update) => allowedUpdates.includes(update));
  if (!isValidUpdate) {
    return res.status(404).send({ error: 'Invalid Update...!' })
  }
  try {
    const teacher = await Teacher.findOneAndUpdate({ _id }, req.body, { new: true })
    updates.forEach((update) => teacher[update] = req.body[update])
    if (!teacher) {
      return res.status(404).send();
    }
    res.redirect('/admin/dashboard');
  } catch (e) {
    res.status(400).send();
  }
});

router.get('/teacher/delete/:id', async (req, res) => {
  const _id = req.params.id;
  const teacher = await Teacher.findById(_id);
  const user = await User.findOne({ email: teacher.email });
  if (!teacher) {
    res.status(400).send();
  }
  try {
    await user.remove();
    await teacher.remove();
  } catch (e) {
    res.status(400).send();
  }
  res.redirect('/admin/dashboard');
})

router.get('/newUser', (req, res) => {
  res.render('newUser')
});

router.post('/users', (req, res) => {
  const user = new User(req.body)
  user.save().then(() => {
    res.redirect('/admin/dashboard')
  }).catch((e) => {
    res.status(400).send(e);
  });
});


router.get('/user/delete/:id', async (req, res) => {

  const _id = req.params.id;
  try {
    const user = await User.findById(_id);
    const student = await Student.findOne({ email: user.email });
    const teacher = await Teacher.findOne({ email: user.email });
    const roll = user.roll;
    if (!user) {
      return res.status(404).send();
    }
    if (roll === 'student') {
      await user.remove();
      await student.remove();

    } else if (roll === 'teacher') {
      await user.remove();
      await teacher.remove();
    }
    res.redirect('/admin/dashboard');
  } catch (e) {
    res.status(500).send();
  }
});

router.get('/user/edit/:id', async (req, res) => {
  const _id = req.params.id;
  const user = await User.findById(_id);
  res.render('editUser', {
    user
  });
});

router.post('/user/edit/:id', async (req, res) => {
  const _id = req.params.id;
  const student = req.body;
  const teacher = req.body;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'roll', 'age'];
  const isValidUpdate = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidUpdate) {
    return res.status(404).send({ error: 'Invalid Update...!' })
  }
  try {
    const user = await User.findOneAndUpdate({ _id }, req.body, { new: true })
    updates.forEach((update) => user[update] = req.body[update])
    if (!user) {
      return res.status(404).send();
    }
    if (req.body.roll === 'student') {
      res.render('newStudentAdmin', {
        student
      })
    } else if (req.body.roll === 'teacher') {
      res.render('newTeacherAdmin', {
        teacher
      })
    }

  } catch (e) {
    res.status(400).send();
  }
})

router.get('/course', async (req, res) => {
  const course = await Course.find({});
  res.render('course', {
    helptetx: 'Course Offered',
    title: 'Course',
    course,
  });
});

router.get('/newCourse', (req, res) => {
  res.render('newCourseAdmin', {
    helptetx: 'Course Offered',
    title: 'Course',
  });
});
router.post('/course', (req, res) => {

  console.log(req.body);
  const course = new Course(req.body);
  course.save().then(() => {
    res.redirect('/course');
  }).catch((e) => {
    res.status(400).send(e);
  });
});

router.get('/teacherMcq/:id', auth, async (req, res) => {

  try {
    const teacher_id = req.params.id;
    const teacher = await Teacher.findById(req.params.id);
    const course = await Course.findOne({ teacherName: teacher.name })

    res.render('tag', {
      course,
      teacher_id
    })
  }
  catch (e) {
    res.status(400).send(e)
  }
})

router.post('/mcq/:id', auth, async (req, res) => {

  const teacher_id = req.params.id;
  const ar = req.body.mcq_question;
  const arr = req.body.options;
  var start = 0, end = 4;
  var arr_length = arr.length / 4
  var question = [];
  for (let i = 0; i < ar.length; i++) {
    if (end <= arr.length + 1) {
      question.push({ mcq_question: ar[i], options: arr.slice(start, end) })
    }
    start += 4;
    end += 4;   
  }
  await Test.mcqData(req.body, question);
  res.redirect(`/teacher/dashboard/${teacher_id}`);
})

router.post('/test/data/:id', auth, async (req, res) => {
  _id = req.params.id;
  testAnswer = req.body;
  const student = await Student.findById(req.params.id)
  const course = await Course.findOne({ studentName: student.name, subject: student.subject });
  const test = await Test.findOne({ studentName: student.name, subject: student.subject });
  var score = 0;
  const ansValue = test.answer
  const ans = JSON.stringify(testAnswer);
  const objAns = JSON.parse(ans)
  var studentAnswer = []
  for (var i in objAns) {
    studentAnswer.push(objAns[i]);
  }
  for (let i = 0; i < ansValue.length; i++) {
    if (ansValue[i] === studentAnswer[i]) {
      score += 10
    }
  }
  const updates = {
    score
  };
  try {
    const test = await Test.findOneAndUpdate({ studentName: student.name }, updates, { new: true })
    if (!test) {
      return res.status(404).send();
    }
    await test.save();
  }
  catch (e) {
    res.status(400).send()
  }
  res.render('scorecard', {
    score,
    course,
    _id
  })
})

router.get('/help', (req, res) => {
  res.render('help', {
    helptetx: 'Help Page',
    title: 'help',
  });
});


router.get('*', (req, res) => {
  res.render('404', {
    title: '404',
    errorMessage: 'Page Not Found'
  });
});

module.exports = router;
