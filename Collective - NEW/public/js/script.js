$(function() {


    class Message{
        constructor(sender, chat_id, message, date, time){
            this.sender = sender;
            this.chat_id = chat_id;
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
        //console.log('Connected to server')
        let user = await getUser();
        let sid = socket.id;
        let chats = await getChats();

        console.log("TEST", user, sid)
        try {
            //console.log(chats[0])
            //console.log(chats)
            for(let x = 0; x < chats.length; x++){
                //if(chats[x].members.includes(user.name)){

                    $('#chatList').append('<div class="chatContainer"><div class="chat" id="' + chats[x].name + '">' + chats[x].name + '</div></div>');
                //}
        }
        } catch (error) {
            
        }
        //socket.emit('receiveMessage')
        socket.emit('loggedIn', user, sid)

    

    socket.on('receiveChats', async function(chat) {
       console.log("ZZZZZZZ", chat)
        $('#chatList').append('<div class="chatContainer"><div class="chat" id="' + chat[0].name + '">' + chat[0].name + '</div></div>');
    })


    //Load messages
    $(document).on('click','.chat',function(){
        socket.emit('loadMessages', this.id)
    })
  

    socket.on('receiveMessage', async function(msg) {
        
        let user = await getUser();
        //console.log(user)

            for(let x = 0; x < msg.length; x++){

                if(msg[x].sender == user.name){
                    $('#chatWindow').append('<div class="messageContainer"><div class="message"><div class="sent">' + msg[x].sender+": " + msg[x].message + '</div></div></div>');
                }
                else{
                    $('#chatWindow').append('<div class="messageContainer"><div class="message"><div class="received">' + msg[x].sender+": " + msg[x].message +  '</div></div></div>');
                }
            }
    })
})

    async function getChats(){
         try {
            let chats;
            await $.get("/chats", function(req, res){
                //  chats = req;
                chats = req   
                //console.log(req)
                
              });

              return chats

        } catch (error) { 
            console.log(error);
        }}

    async function getUser(){
        let user = ''

        try {
            await $.get("/users", function(userid, status){
                 user = userid;
              });
              return user;
        } catch (error) { 
            console.log(error);
        }}

        //Load chat
        $(document).on('click','.chat',async function(){
            console.log(this.id)
        })

    //Send Message
    $('#send').on('click', async function() {
        let user = await getUser();
        //console.log(user)
        const msg = new Message
        msg.sender = user.name;
        msg.chat_id = 3;
        msg.message = $('#message').val();
        msg.date = 'test';
        msg.time = 'test';
        
        $('#message').val();
        //console.log(msg);
        $('#message').val('')
        socket.emit('sendMessage', msg);
        $('#chatWindow').scrollTop = $('#chatWindow').scrollHeight//- $('#chatWindow').clientHeight
    })
    
    $('#submitCreateChat').on('click', async function() {

        let user = await getUser();

        let newChat = new Chat
        newChat.user = user
        newChat.name = $('#chatName').val();

        let chatFriendsList = [];
        chatFriendsList.push(user.name)
        $('input[type=checkbox]').each(function () {
            if (this.checked){
                chatFriendsList.push($(this).attr('id'))
            }
            //chatFriendsList += (chatFriendsList=="" ? sThisVal : "," + sThisVal);
        });
        newChat.members = chatFriendsList;
        socket.emit('addChat', newChat);
       

    })

    $('#submitAddFriend').on('click', async function() {
        let user = await getUser();
        let friend = $('#friend').val();
       // console.log(friend)
        socket.emit('addFriend', user.name, friend);
    })


    
    //Modals

// Get the modal
var chatModal = document.getElementById("createChatModal");
var friendModal = document.getElementById("addFriendModal");


// Get the button that opens the modal
var chatBtn = document.getElementById("createChat");
var friendBtn = document.getElementById("addFriend");

// Get the <span> element that closes the modal
var chatSpan = document.getElementsByClassName("close")[0];
var friendSpan = document.getElementsByClassName("close")[1];

// When the user clicks the button, open the modal 

$('#createChat').on('click',  async function() {
    $('#friendsList').empty();
    chatModal.style.display = "block";

    let user = await getUser();
    //console.log(user.friends)
    for(let x = 0; x < user.friends.length; x++){
         $('#friendsList').append('<div class="fChecklist"><input type="checkbox" id="' + user.friends[x] + '" name="' + user.friends[x] + '"><label for="' + user.friends[x] + '">' + user.friends[x] + '</label><br></div>')

    }
})


// }
friendBtn.onclick = async function() {
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
