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


    //Connect to socket.io
    
    const socket = io.connect('http://localhost:3001',{
        withCredentials: true
    });
            
    socket.on('connect', async () => {
        //console.log('Connected to server')
        let user = await getUser();
        //console.log(user)
        let chats = await getChats();
        try {
            console.log(chats)
            for(let x = 0; x < chats.length; x++){

                    $('#chatList').append('<div class="chatContainer"><div class="chat" id="' + chats[x].name + '">' + chats[x].name + '</div></div>');
        }
        } catch (error) {
            
        }

    })

    $(document).on('click','.chat',function(){
        console.log('clicked', this.id)
    })
  

    socket.on('receiveMessage', async function(msg) {
        
        let user = await getUser();
        console.log(user)
        //if (msg.length > 0){
            for(let x = 0; x < msg.length; x++){
                //console.log(msg[x].sender)
                if(msg[x].sender == user){
                    $('#chatWindow').append('<div class="messageContainer"><div class="message"><div class="sent">' + msg[x].sender+": " + msg[x].message + '</div></div></div>');
                }
                else{
                    $('#chatWindow').append('<div class="messageContainer"><div class="message"><div class="received">' + msg[x].sender+": " + msg[x].message +  '</div></div></div>');
                }
            }
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

    //Send Message
    $('#send').on('click', async function() {
        let user = await getUser();
        //console.log(user)
        const msg = new Message
        msg.sender = user;
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


    // <div class="messageContainer"><div class="received">received</div></div>
    // <div class="messageContainer"><div class="sent">sent</div></div>


    // //Switch Chat Rooms
    // $('.chat').on('click', function() {
    //     const chatName = $(this).val();
    //     console.log(chatName);
    //     //socket.emit('join', chatName);
    // })


    


    




});