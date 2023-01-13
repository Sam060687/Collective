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


    //Get elements
    let element = function(id){
        return $('#' + id);
    }

    let status = element.status
    let send = element.send
    let message = element.message
    let chatWindow = element.chatWindow
    let chatList = element.chatList
    let chatName = element.chatName

    let cElement = function(objClass){
        return$('.' + objClass);
    }

    let chat = cElement.chat


    //Connect to socket.io
    
    const socket = io.connect('http://localhost:3001');
            

    socket.on('connect', () => {
        console.log('Connected to server')
        
    })

    //Populate chat list
    // socket.on('chatList', function(chats) {
        
    //     if(chats.length > 0){
    //         chats.forEach(element => {
    //             $('#chatList').append('<div class="chatContainer"><div class="chat">' + element.name + '</div></div>'); // socket not needed?
    //         });
    //     }
    // })

    

    //Receive messages

    socket.on('receiveMessage', function(msg) {
        console.log("testing: ", msg);
        //alert(msg.m);
        // chatW = document.getElementById('chatWindow');
        // if(msg.length){
        //     for(var x = 0;x < msg.length;x++){
        //         // Build out message div
        //         var message = document.createElement('div');
        //         message.setAttribute('class', 'chat-message');
        //         message.textContent = msg[x].sender+": "+msg[x].message;
        //         chatW.appendChild(message);
        //         chatW.insertBefore(message, chatW.firstChild);
        //     }}


        //if (msg.length > 0){
            for(let x = 0; x < msg.length; x++){
                //if(msg[x].sender == 'test'){
                    $('#chatWindow').append('<div class="messageContainer"><div class="message"><div class="sent">' + msg[x].sender+": " + msg[x].message + '</div></div></div>');
                //}
                //else{
                    //$('#chatWindow').append('<div class="messageContainer"><div class="message"><div class="received">' + msg[x].sender+": " + msg[x].message +  '</div></div></div>');
                //}
            }
            
        //}
    
        
    })

    //Send Message
    $('#send').on('click', function() {
        const msg = new Message
        msg.sender = 'test';
        msg.chat_id = 3;
        msg.message = $('#message').val();
        msg.date = 'test';
        msg.time = 'test';
        
        $('#message').val();
        console.log(msg);
        $('#message').val('')
        socket.emit('sendMessage', msg);
        $('#chatWindow').scrollTop = $('#chatWindow').scrollHeight - $('#chatWindow').clientHeight
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