import {Socket} from 'phoenix';

let elixir_engine_instance;

class Engine {
  static get() {
    return elixir_engine_instance;
  }

  constructor(credentials, url){
    if (elixir_engine_instance) {
      return elixir_engine_instance;
    }
    elixir_engine_instance = this;

    this.socket = new Socket(url, {
      params: credentials
    });

    this.socket.connect();

    this.user_id = credentials.user_id;

    this.socket.onError( ev => console.log("ERROR", ev) );
    this.socket.onClose( e => console.log("CLOSE", e));
  }

  connectToMain(handlers){
    var chan = this.socket.channel(`user:${this.user_id}`, {});
    chan.join().receive("error", () => console.log("auth error"))
      .receive("ok", () => {
        this.addLobbyHandlers(chan, handlers);
      });
    chan.onError(e => console.log("something went wrong", e));
  }

  connectToChat(opponent_id, handlers){
    const users_string = [this.user_id, opponent_id].sort().join(':');
    var chan = this.socket.channel(`chat:${users_string}`, {});
    chan.join().receive("error", () => console.log("auth error"))
      .receive("ok", (messages) => {
        this.addMsgHandlers(chan, handlers);
      });
    chan.onError(e => console.log("something went wrong", e));
    return chan;
  }

  addLobbyHandlers(chan, handlers) {
    chan.on("init:usr", ({users}) => {
      handlers.init_users(users);
    });
    chan.on("new:msg", msg => {
      handlers.new_msg(msg);
    });
  }


  addMsgHandlers(chan, handlers) {
    chan.on("init:msg", ({messages}) => {
      handlers.init_messages(messages);
      if(messages.length > 0) {
        const msg = messages[messages.length - 1];
        chan.push("read:msg", msg.id);
      }
    });
    chan.on("new:msg", msg => {
      handlers.new_msg(msg);
      chan.push("read:msg", msg.id);
    });
  }

  sendMessage(chan, msg, handler) {
    chan.push("new:msg", msg)
      .receive("ok", handler);
  }

  closeChat(chan) {
    chan.leave();
  }
}

export default Engine;

