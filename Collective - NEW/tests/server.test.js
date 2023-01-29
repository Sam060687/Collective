
const mongodb = require('mongodb').MongoClient;
const express = require('express');
const app = require ('../server.js');
const supertest = require('supertest');


describe('insert', () => {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await mongodb.connect('mongodb://localhost:27017',{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = await connection.db('collective');
  });

  afterAll(async () => {
    await connection.close();
  });

  //Direct database tests

  it('should create a new user in the users collection', async () => {
    const users = db.collection('users');
    const rnd = Math.random(100000) 
    const name = 'Jest Test ' + rnd;

    const mockUser = {name: name};
    await users.insertOne(mockUser);

    const insertedUser = await users.findOne({name: name});
    expect(insertedUser.name).toEqual(mockUser.name);
  });

  it('should create a new message in the messages collection', async () => {
    const messages = db.collection('messages');
    const rnd = Math.random(100000)
    const sender = 'Jest Test ' + rnd;

    const mockMessage = {sender: sender, message: 'Jest Test', roomName: 'test room', date: '01/01/2000', time: '00:00:00'};
    await messages.insertOne(mockMessage);

    const insertedMessage = await messages.findOne({sender: sender});
    expect(insertedMessage.message).toEqual(mockMessage.message);
    
  });

  it('should create a new chat in the chats collection', async () => {
    const chats = db.collection('chats');
    const rnd = Math.random(100000)
    const owner = 'Jest Test ' + rnd;

    const mockChat = {owner: owner, roomName: owner};
    await chats.insertOne(mockChat);

    const insertedChat = await chats.findOne({owner: owner});
    expect(insertedChat.owner).toEqual(mockChat.owner);
    
  });

});

describe('testRoutes', () => {
    let connection;
    let db;
  
    beforeAll(async () => {
      connection = await mongodb.connect('mongodb://localhost:27017',{
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      db = await connection.db('collective');
    });
  
    afterAll(async () => {
      await connection.close();
    });

  //Test routes

    it('should create a new user', async () => {
        const rnd = Math.random(100000) 
        const name = 'Jest Test ' + rnd;

        const res = await supertest(app).post('/register').send({username: name, email: 'test@test.com', password: 'test', password2: 'test'});
        
        const users = db.collection('users');
        const insertedUser = await users.findOne({name: name});
        expect(insertedUser.name).toEqual(name);
    }
    );

    it('should log the user in', async () => {
        const res = await supertest(app).post('/login').send({email: 'sam@sam', password: 'test'})
        expect(res.statusCode).toEqual(302)
      })
});

    //   it('should return the root directory', async () => {
    //     const res = await supertest(app).get('/')
    //     expect(res.statusCode).toEqual(302)

    //   })


