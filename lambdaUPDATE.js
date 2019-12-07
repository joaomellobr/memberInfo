'use strict';
const AWS = require('aws-sdk');

exports.handler = async (event, context) => {
    const documentClient = new AWS.DynamoDB.DocumentClient();

    let responseBody = "";
    let statusCode = 0;

    const { id, membername, memberemail } = JSON.parse(event.body);

    const params = {
        TableName: "Members",
        Key: {
            id: id
        },
        UpdateExpression: "set membername = :n, memberemail = :e",
        ExpressionAttributeValues: {
            ":n": membername,
            ":e": memberemail
        },
        ReturnValues: "UPDATED_NEW"
    };

    try {
        const data = await documentClient.update(params).promise();
        responseBody = JSON.stringify(data);
        statusCode = 204;
    } catch (err) {
        responseBody = `Unable to update member: ${err}`;
        statusCode = 403;
    }

    const response = {
        statusCode: statusCode,
        headers: {
            "Content-Type": "application/json",
            "access-control-allow-origin": "*"
        },
        body: responseBody
    };

    return response;
};
