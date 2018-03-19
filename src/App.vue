<template>
  <div id="el_chat"
       :class="{'el_chat--on': opened}"
  >
    <div class="overlay"></div>
    <toggle :opened.sync="opened" :unread="unread_chats.length > 0"/>
    <div class="chat_box">
      <div class="title">
        <div class="title__avatar" v-if="mode == 'messages'"></div>
        <div class="title__text">{{ title }}</div>
        <div class="title__back" v-if="mode == 'messages'" v-on:click="back">✕</div>
      </div>
      <div class="chats" v-if="mode == 'users'">
        <div v-for='user in orderedUsers()'
             class="user"
             :class="{'user--unread': hasUserUnreadMessages(user)}"
             v-on:click="selectUser(user.user_id, user.user_name)">
          <div class="user__avatar" :style="{background: 'url('+user.user_img+')'}"></div>
          <span class="user__name">{{ user.user_name }}</span>
        </div>
      </div>
      <div class="messages" v-if="mode == 'messages'">
        <div class="messages_box" ref="messagesBox">
          <div class="message"
               :class="{'message--own': (message.user_id != companion_id),
                       'message--same-user': message.same_user}"
               v-for="message in messages">
            <div class="message__info" v-if="!message.same_user">
              <span class="message__user">{{ message.user_id == companion_id ? companion_name : user_name }}</span>
              <span class="message__sent_at">{{ readableTime(message.sent_at) }}</span>
            </div>
            <div class="message__body">
              <div class="message__text">{{ message.text }}</div>
            </div>
          </div>
        </div>
        <div class="send_box">
          <textarea class="send_box__text" v-model="text_to_send" placeholder="Write your text..." rows="3"></textarea>
          <a class="send_box__button" v-on:click="sendMessage()">{{ sending ? "Sending..." : "Send" }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import Toggle from './Toggle.vue'
import Engine from './enigne.js';

let App = {
  name: 'app',
  data() {
    return {
      users: [],
      user_name: '',
      unread_chats: [],
      chan: null,
      companion_id: null,
      companion_name: null,
      messages: [],
      title: 'Chats',
      mode: 'users',
      text_to_send: '',
      sending: false,
      opened: false
    }
  },
  components: {
    Toggle
  },
  created() {
    this.users = window.ElChatUsers;
    this.user_name = window.ElChatCredentials.user_name;
    const engine = new Engine(window.ElChatCredentials, window.ElChatUrl);
    const new_msg_handler = (msg) => {
      this.unread_chats.push(parseInt(msg.user_id));
      this.unread_chats = [...new Set(this.unread_chats)];
    };
    const init_users_handler = (users) => {
      this.unread_chats = users;
    }
    const handlers = {
      new_msg: new_msg_handler,
      init_users: init_users_handler
    };
    engine.connectToMain(handlers);
  },
  methods: {
    selectUser: function(id, name) {
      this.mode = 'messages';
      this.companion_id = id;
      this.companion_name = name;
      this.title = name;
      this.messages = [];
      this.text_to_send = '';
      this.sending = false;
      this.unread_chats = this.unread_chats.filter(item => item !== id)
      const set_same_user = (msg, i) => {
        if (i > 0) {
          const last_message = this.messages[i - 1];
          if (last_message.user_id == msg.user_id &&
              new Date(msg.sent_at) - new Date(last_message.sent_at) < 300000 // 5 minutes
             ) {
            msg.same_user = true;
          }
        }
      };
      
      const scroll_down = () => {
        Vue.nextTick().then(() => {
          this.$refs.messagesBox.scrollTop = this.$refs.messagesBox.scrollHeight;
        });
      };
      
      const new_msg_handler = (msg) => {
        set_same_user(msg, this.messages.length);
        this.messages.push(msg);
        scroll_down();
      };
      
      const init_messages_handler = (messages) => {
        this.messages = messages;
        this.messages.forEach((msg, i) => {
          set_same_user(msg, i);
        });
        scroll_down();
      }
      
      const handlers = {
        new_msg: new_msg_handler,
        init_messages: init_messages_handler
      };
      
      this.chan = Engine.get().connectToChat(id, handlers);
    },
    back: function() {
      this.mode = 'users';
      this.title = 'Chats';
      Engine.get().closeChat(this.chan);
    },
    sendMessage: function() {
      if(this.text_to_send == '') {
        return;
      };
      this.sending = true;
      const handler = (msg) => {
        this.sending = false;
        this.text_to_send = "";
      };
      Engine.get().sendMessage(this.chan, this.text_to_send, handler);
    },
    readableTime: function(datetime) {
      const date = new Date(datetime + 'Z')
      const time_string = date.toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");;
      const date_string = date.toLocaleDateString();
      if (date_string == (new Date()).toLocaleDateString()) {
        return time_string;
      } else {
        return date_string + " " + time_string;
      }
    },
    hasUserUnreadMessages: function(user) {
      return this.unread_chats.includes(user.user_id);
    },
    orderedUsers: function() {
      return this.users.concat().sort((a, b) => {
        const a_has_unread = this.unread_chats.includes(a.user_id);
        const b_has_unread = this.unread_chats.includes(b.user_id);
        if (a_has_unread != b_has_unread) {
          if (a_has_unread) {
            return -1;
          } else {
            return 1;
          }
        }
        if(a.user_name < b.user_name) return -1;
        if(a.user_name > b.user_name) return 1;
        return 0;
      });
    }
  }
}
export default App
</script>

<style lang="scss">
#el_chat {
  font-family: "Helvetica Neue", "Helvetica, Arial", "Lucida Grande", "sans-serif";
  color: #333;
  
  .overlay {
    position: fixed;
    opacity: 0;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #000;
    visibility: hidden;
    transition: visibility 0s .15s, opacity .15s linear;
  }
  
  .chat_box {
    position: fixed;
    top: 0;
    bottom: 0;
    right: -400px;
    width: 400px;
    background: #f2f2f5;
    transition: right .15s linear;
  }
  
  &.el_chat--on {
    .overlay {
      opacity: 0.5;
      visibility: visible;
      transition: opacity .15s linear;
    }
    
    .chat_box {
      right: 0;
    }
  }
  
  .title {
    background: #E7E8ED;
    height: 50px;
    display: flex;
    align-items: center;
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .title__avatar {
    flex: 0 1 24px;
    height: 24px;
    margin-right: 14px;
    background: url('http://placekitten.com/24/24');
    border-radius: 50%;
  }
  
  .title__text {
    font-size: 18px;
    color: #667;
    flex: 1;
  }
  
  .title__back {
    flex: 0;
    cursor: pointer;
  }
  
  .chats {
    max-height: calc(100% - 50px);
    overflow: scroll;
  }
  
  .user {
    padding: 8px 20px;
    cursor: pointer;
    background: #fff;
    border-bottom: 1px solid #e5e9ec;
    line-height: 24px;
    display: flex;
  }
  
  .user.user--unread {
    .user__avatar:before {
      content: '';
      display: inline-block;
      position: relative;
      top: -8px;
      left: -4px;
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background-color: #f66;
    }
  }
  
  .user__avatar {
    height: 24px;
    width: 24px;
    background: url('http://placekitten.com/24/24');
    border-radius: 50%;
  }
  
  .user__name {
    font-size: 14px;
    margin-left: 14px;
  }
  
  .messages {
    height: calc(100% - 50px);
    max-height: calc(100% - 50px);
    display: flex;
    flex-direction: column;
  }
  
  .messages_box {
    flex: 1;
    overflow: scroll;
    padding-bottom: 20px;
  }
  
  .message {
    padding: 20px;
    padding-bottom: 0;
    margin-right: 40px;
  }
  
  .message__info {
    margin-bottom: 15px;
    display: flex;
  }
  
  .message__user {
    padding-left: 4px;
    padding-right: 4px;
  }
  
  .message__sent_at {
    color: #999;
  }
  
  .message__body {
    display: flex;
  }
  
  .message__text {
    padding: 10px 20px;
    background-color: #6c6;
    color: #fff;
    border-radius: 4px;
    position: relative;
    white-space: pre-wrap; 
    word-wrap: break-word;
    
    &:after {
      bottom: 100%;
      left: 0;
      border: solid transparent;
      content: " ";
      height: 0;
      width: 0;
      position: absolute;
      pointer-events: none;
      border-bottom-color: #6c6;
      border-width: 10px;
      margin-left: 15px;
      margin-right: 15px;
    }
  }
  
  .message--own {
    &.message {
      margin-left: 40px;
      margin-right: 0;
    }
    
    .message__info {
      justify-content: flex-end;
    }
    
    .message__user {
      order: 2;
    }
    
    .message__body {
      justify-content: flex-end;
    }

    .message__text {
      background-color: #fff;
      color: #000;

      &:after {
        left: auto;
        right: 0;
        border-bottom-color: #fff;
      }
    }
  }

  .message--same-user {
    &.message {
      padding-top: 10px;
    }

    .message__text {
      &:after {
        display: none;
      }
    }
  }

  .send_box {
    flex: 0 1 126px;
    background: #E7E8ED;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px;
  }

  .send_box__text {
    font-size: 14px;
    line-height: 20px;
    border: 1px solid #e7e8ed;
    resize: none;
    outline: none;
    padding: 9px;
    border-radius: 4px;
  }

  .send_box__text:focus {
    border: 1px solid #6c6;
  }

  .send_box__button {
    background-color: #6c6;
    border-color: #6c6;
    color: #fff;
    border-radius: 6px;
    padding: 9px 12px;
    cursor: pointer;
    align-self: flex-end;
  }
}
</style>
