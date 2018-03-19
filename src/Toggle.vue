<template>
<div class="chat-toggle"
     :class="{
             'chat-toggle--on': localOpened,
             'chat-toggle--unread': unread
             }"
     v-on:click="toggle"
     >
  <p class="chat-toggle__text">Chat</p>
</div>
</template>

<script>
let Toggle = {
  name: 'toggle',
  props: ['opened', 'unread'],
  data () {
    return {
      localOpened: this.opened
    }
  },
  methods: {
    toggle: function() {
      this.localOpened = !this.localOpened;
      this.$emit('update:opened', this.localOpened);
    }
  }
}
export default Toggle
</script>

<style lang="scss">
.chat-toggle {
  width: 40px;
  height: 80px;
  background: #6c6;
  position: fixed;
  top: 50%;
  right: 0;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  margin-top: -40px;
  cursor: pointer;
  transition: right .15s linear;
}

.chat-toggle--on {
  right: 400px;
}

.chat-toggle--unread {
  &:before {
    content: '';
    display: block;
    position: relative;
    top: 5px;
    left: 5px;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: #f66;
  }

  .chat-toggle__text {
    margin-top: 20px;
  }
}
    
.chat-toggle__text {
  color: #fff;
  transform: rotate(270deg);
  margin-top: 30px;
  letter-spacing: 1.4px;
}
</style>
