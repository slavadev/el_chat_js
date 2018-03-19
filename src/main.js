import Vue from 'vue';
import App from './App.vue';


window.startElChat = () => {
  new Vue({
    el: '#app',
    render: h => h(App)
  })
};

// window.ElChatUsers = [
//   {
//     user_id: 2,
//     user_name: 'markus',
//     user_img: 'http://placekitten.com/24/24'
//   }, {
//     user_id: 3,
//     user_name: 'anton',
//     user_img: 'http://placekitten.com/24/24'
//   }
// ];
// window.ElChatUrl = "ws://localhost:4000/socket";
// window.ElChatCredentials = {
//   user_id: 1,
//   user_name: 'slava',
//   token: '2pUi8275EgJYFlv2o5vfjc8rFipbaknwK3knQ0hUPVU='
// };
// window.startElChat();
