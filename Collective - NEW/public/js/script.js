$(function() {


    class Message{
        constructor(sender, message, date, time){
            this.sender = sender;
            this.message = message;
            this.date = date;
            this.time = time;
        }
    }

    class Chat{
        constructor(owner, name, members){
            this.owner = owner;
            this.name = name;
            this.members = members;
        }
    }


    //Connect to socket.io
    const socket = io.connect('http://localhost:3001',{
        withCredentials: true
    });
            
    socket.on('connect', async () => {

        let user = await getUser();
        let sid = socket.id;

        //Get chats from route and apply to chat list
        try {
        let chats = await getChats();

            for(let x = 0; x < chats.length; x++){
                $('#chatList').append('<div class="chatContainer"><div class="chat" id="' + chats[x].name + '">' + chats[x].name + '</div></div>');
            }
        } catch (error) {}

        socket.emit('loggedIn', user, sid)

    //Notify user of result after adding a new friend
    socket.on('friendAdded', async function(result) {

        $('#addFriendNotification').text(result)
    })

    //Add new chat to chat list
    socket.on('receiveChats', async function(chat) {
        
        $('#chatList').prepend('<div class="chatContainer"><div class="chat" id="' + chat[0].name + '">' + chat[0].name + '</div></div>');
    })

    //Notify user of result after adding a new chat
    socket.on('chatAdded', async function(msg) {

        $('#createChatNotification').text(msg)
    })
        
    //Join Room
    $(document).on('click','.chat', function(){

        $('#chatWindow').empty();
        $('#chatroomNameTop').text("Chatting in : " + this.id)       
        socket.emit('joinRoom', this.id)  
    })

    //Receive Messages
    socket.on('receiveMessage', async function(msg) {

        try {
            let user = await getUser();
            for(let x = 0; x < msg.length; x++){
                if(msg[x].sender == user.name){
                    $('#chatWindow').append('<div class="messageContainer"><div class="message"><div class="sent">' + msg[x].sender+": " + msg[x].message + '</div></div></div>');
                }
                else{
                    $('#chatWindow').append('<div class="messageContainer"><div class="message"><div class="received">' + msg[x].sender+": " + msg[x].message +  '</div></div></div>');
                }
            }
        } catch (error) {}
    })
})

    //Get Chats from route
    async function getChats(){

         try {
            let chats;
            await $.get("/chats", function(req, res){
                chats = req                   
              });
              return chats

        } catch (error) {}}

    //Get User from route
    async function getUser(){
        let user = ''

        try {
            await $.get("/users", function(userid, status){
                 user = userid;
              });
              return user;
        } catch (error) {}}

    //Send Message
    $('#send').on('click', async function() {

        if (!$('#message').val() == '') {
            $('#sendMessageNotification').text('')

            try {
                
                let dateTime = new Date();
                let getTime = dateTime.getHours() + ":" + dateTime.getMinutes() + ":" + dateTime.getSeconds();
                let getDate = dateTime.getDate() + "/" + (dateTime.getMonth() + 1) + "/" + dateTime.getFullYear();
        
                let user = await getUser();
        
                const msg = new Message
                msg.sender = user.name;
                msg.message = $('#message').val();
                msg.date = getDate;
                msg.time = getTime;

                $('#message').val('')
                socket.emit('sendMessage', msg);
                $('#chatWindow').scrollTop = $('#chatWindow').scrollHeight
            } catch (error) {}
        }
        else{
            $('#sendMessageNotification').text('Please enter a message')
        }
    })

    //Create Chatroom
    $('#submitCreateChat').on('click', async function() {


        try {
            let user = await getUser();
            let newChat = new Chat
            newChat.user = user
            newChat.name = $('#chatName').val();
    
            if(!newChat.name == ''){
                $('#createChatNotification').text('')
                let chatFriendsList = [];
                chatFriendsList.push(user.name)
                $('input[type=checkbox]').each(function () {
                if (this.checked){
                    chatFriendsList.push($(this).attr('id'))
                }
            });

            newChat.members = chatFriendsList;
            socket.emit('addChat', newChat);
            }
            else{
                $('#createChatNotification').text('Chat name cannot be empty')
            }
        } catch (error) {}
    })

    //Add Friend
    $('#submitAddFriend').on('click', async function() {

        try {
            let user = await getUser();
            let friend = $('#friend').val();
            if (!friend == ''){
                $('#addFriendNotification').text('')
                socket.emit('addFriend', user.name, friend);
            }
            else{
                $('#addFriendNotification').text('Friend name cannot be empty')
            }
        } catch (error) {}
    })


    
    //Modals

    var chatModal = document.getElementById("createChatModal");
    var friendModal = document.getElementById("addFriendModal");
    var friendBtn = document.getElementById("addFriend");
    var chatSpan = document.getElementsByClassName("close")[0];
    var friendSpan = document.getElementsByClassName("close")[1];


    //Open Create Chat Modal
    $('#createChat').on('click',  async function() {

        $('#friendsList').empty();
        chatModal.style.display = "block";

        //Populate friends list
        try {
            let user = await getUser();
            for(let x = 0; x < user.friends.length; x++){
                $('#friendsList').append('<div class="fChecklist"><input type="checkbox" id="' + user.friends[x] + '" name="' + user.friends[x] + '"><label for="' + user.friends[x] + '">' + user.friends[x] + '</label><br></div>')
            } 
        } catch (error) {}  
    })


    friendBtn.onclick = function() {
        $('#addFriendNotification').text('')
        friendModal.style.display = "block";
    }

    // When the user clicks on <span> (x), close the modal
    chatSpan.onclick = function() {
        chatModal.style.display = "none";
    }

    friendSpan.onclick = function() {
        friendModal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
    if (event.target == chatModal) {
        chatModal.style.display = "none";
    }
    if (event.target == friendModal) {

        friendModal.style.display = "none";
    }
    }
})