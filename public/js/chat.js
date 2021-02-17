const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//templetes
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locatioMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

//autoscroll
const autoscroll = () => {
  //new message element
  const $newMessage = $messages.lastElementChild;

  //hight of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = $messages.offsetHeight;

  //height of messages container
  const containerHeight = $messages.scrollHeight;

  //how far have i scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
}

socket.on('message', (msg) => {
  console.log(msg);
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    msg: msg.text,
    createdAt: moment(msg.createdAt).format('hh:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
})

socket.on('locationMessage', (message) => {
  console.log(message);
  const html = Mustache.render(locatioMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('hh:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
})

socket.on('roomData', ({ room, online, offline }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    online,
    offline
  })
  document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');

  const sendmsg = e.target.elements.message.value;

  socket.emit('SendMessage', sendmsg, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus()
    if (error) {
      return console.log(error);
    }
    console.log('message delivered');
  });
})

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geo location is not supported by your browser. Pls update your browser...');
  }
  $sendLocationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => {
      $sendLocationButton.removeAttribute('disabled')
      console.log('Loction Shared');
    });
  })

})
socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
})
