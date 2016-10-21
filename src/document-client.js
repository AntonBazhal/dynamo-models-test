const AWS = require('aws-sdk');
const Promise = require('bluebird');

// You may need to change config to reflect your environment
AWS.config.update({
  endpoint: 'http://localhost:8000'
});
AWS.config.setPromisesDependency(Promise);

const dynamodb = new AWS.DynamoDB();
const documentClient = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'Accounts';
const EMAIL = 'john@doe.com';
const NAME = 'John Doe';

function checkTableExists() {
  return dynamodb
    .listTables().promise()
    .then(tableList => {
      return tableList.TableNames.indexOf(TABLE_NAME) > -1;
    });
}

// This function does not wait for table's status change from CREATING to ACTIVE,
// thus, when running in cloud, all the subsequent calls may fail
function provisionTable() {

  return checkTableExists()
    .then( tableExists => {

      if (tableExists) {
        return console.log('Table already exists');
      }

      console.log('Table does not exist. Creating...')

      const params = {
        TableName : TABLE_NAME,
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' },
          { AttributeName: 'name', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'email', AttributeType: 'S' },
          { AttributeName: 'name', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      };

      return dynamodb
        .createTable(params).promise()
        .then(() => {
          console.log('Table was created');
        });
    });
}

function createItem() {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      email: EMAIL,
      name: NAME,
      age: 25
    }
  };

  return documentClient
    .put(params).promise()
    .then(() => {
      console.log('Item was created');
    });
}

function updateItem() {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      email: EMAIL,
      name: NAME
    },
    UpdateExpression: 'set age = :a',
    ExpressionAttributeValues: {
      ':a': 30
    },
    ReturnValues: 'UPDATED_NEW'
  };

  return documentClient
    .update(params).promise()
    .then(item => {
      console.log(`Updated item: ${ JSON.stringify(item, null, 2) }`);
    });
}

function getItem() {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      email: EMAIL,
      name: NAME
    }
  };

  return documentClient
    .get(params).promise()
    .then(item => {
      console.log(`Got item: ${ JSON.stringify(item, null, 2)}`);
    });
}

function deleteItem() {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      email: EMAIL,
      name: NAME
    }
  };

  return documentClient
    .delete(params).promise()
    .then(() => {
      console.log('Item was deleted');
    });
}

provisionTable()
  .then(createItem)
  .then(updateItem)
  .then(getItem)
  .then(deleteItem)
  .catch(console.error);
