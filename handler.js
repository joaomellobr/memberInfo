'use strict';
import { DynamoDB } from 'aws-sdk';
const db = new DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
import uuid from 'uuid/v4';

const memberTable = process.env.POSTS_TABLE;
// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}
function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}
// Create a post
export function createPost(event, context, callback) {
  const reqBody = JSON.parse(event.body);

  if (
    !reqBody.name ||
    reqBody.name.trim() === '' ||
    !reqBody.email ||
    reqBody.email.trim() === ''
  ) {
    return callback(
      null,
      response(400, {
        error: 'Post not be empty'
      })
    );
  }

  const post = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    userId: 1,
    name: reqBody.name,
    email: reqBody.email
  };

  return db
    .put({
      TableName: memberTable,
      Item: post
    })
    .promise()
    .then(() => {
      callback(null, response(201, post));
    })
    .catch((err) => response(null, response(err.statusCode, err)));
}
// Get all posts
export function getAllPosts(event, context, callback) {
  return db
    .scan({
      TableName: memberTable
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
}
// Get number of posts
export function getPosts(event, context, callback) {
  const numberOfPosts = event.pathParameters.number;
  const params = {
    TableName: memberTable,
    Limit: numberOfPosts
  };
  return db
    .scan(params)
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
}
// Get a single post
export function getPost(event, context, callback) {
  const id = event.pathParameters.id;

  const params = {
    Key: {
      id: id
    },
    TableName: memberTable
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: 'Post not found' }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
}
// Update a post
export function updatePost(event, context, callback) {
  const id = event.pathParameters.id;
  const reqBody = JSON.parse(event.body);
  const { name, email } = reqBody;

  const params = {
    Key: {
      id: id
    },
    TableName: memberTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'SET name = :name, email = :email',
    ExpressionAttributeValues: {
      ':name': name,
      ':email': email
    },
    ReturnValues: 'ALL_NEW'
  };
  console.log('Updating');

  return db
    .update(params)
    .promise()
    .then((res) => {
      console.log(res);
      callback(null, response(200, res.Attributes));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
}
// Delete a post
export function deletePost(event, context, callback) {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      id: id
    },
    TableName: memberTable
  };
  return db
    .delete(params)
    .promise()
    .then(() =>
      callback(null, response(200, { message: 'Post deleted successfully' }))
    )
    .catch((err) => callback(null, response(err.statusCode, err)));
}