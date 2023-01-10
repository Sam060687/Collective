
$(function() {
    
    class Message{
        constructor(chat_id, msg, date, time, image){
            this.chat_id = chat_id;
            this.msg = msg;
            this.date = date;
            this.time = time;
            this.image = image;
        }
    }


    const socket = io('http://localhost:3000');
    socket.on('connect', () => {
        console.log('Connected to server')
        
    });

    $('#btnSend').click(function() {

        let chat_id = 1;
        let msg = $('#txtChatBox').val();
        let date = "2021-05-01";
        let time = "12:00:00"
        let image = "ImgTest";
    
    
        newMessage = new Message(chat_id, msg, date, time, image);
        
        let txtMsg = $('#txtChatBox').val()

        newMessage.msg = txtMsg;
        console.log(newMessage);
        socket.emit('message', newMessage)
    })

});


// $("#submit").click(function(){



//     $.ajax({
//         method: 'POST',
//         url:'http://localhost:3000/messages',
//         dataType: 'json',
//         conetentType: 'application/json',
//         async: true,
//         data: newMessage,
//         success: function(response, textStatus, xhr){
//             console.log(newMessage);
//         },
//         error: function(xhr, textStatus, errorThrown){
//             console.log(errorThrown);
//         }

//     })

// })

