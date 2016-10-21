const joi = require('joi');
const Promise = require('bluebird');
const vogels = require('vogels');

// You may need to change config to reflect your environment
vogels.AWS.config.update({
  endpoint: 'http://localhost:8000'
});
Promise.promisifyAll(vogels);

const OWNER_ID = 2;
const CAT_NAME = 'Oliver';

const Cat = Promise.promisifyAll(vogels.define('Cat', {
  hashKey: 'ownerId',
  rangeKey: 'name',
  timestamps: true,
  schema: {
    ownerId: joi.number().min(1).required(),
    name: joi.string().required(),
    breed: joi.string().trim().required(),
    color: vogels.types.stringSet(),
    age: joi.number().min(0)
  },
  indexes: [{
    hashKey: 'ownerId',
    rangeKey: 'breed',
    type: 'local',
    name: 'breedLocalIndex'
  }, {
    hashKey: 'breed',
    rangeKey: 'ownerId',
    type: 'global',
    name: 'breedIndex',
    readCapacity: 5,
    writeCapacity: 5
  }]
}));

vogels
  .createTablesAsync()
  .then(() => {
    console.log('Tables were created');

    return Cat
      .createAsync({
        ownerId: OWNER_ID,
        name: CAT_NAME,
        breed: 'Maine Coon',
        color: ['cream'],
        age: 4
      });
  })
  .then(kitty => {
    console.log(`${ CAT_NAME } was saved at ${ kitty.get('createdAt') }!`);

    return Cat
      .updateAsync({
        ownerId: OWNER_ID,
        name: CAT_NAME,
        color: { $add: [ 'white' ] }
      });
  })
  .then(kitty => {
    console.log(`${ CAT_NAME } was updated at ${ kitty.get('updatedAt') }`);

    return Cat
      .getAsync({
        ownerId: OWNER_ID,
        name: CAT_NAME
      });
  })
  .then(kitty => {
    console.log(`${ CAT_NAME } was found. Now its color is ${ kitty.get('color') }`);

    return Cat
      .destroyAsync({
        ownerId: OWNER_ID,
        name: CAT_NAME
      });
  })
  .then(() => {
    console.log(`Bye bye ${ CAT_NAME }`);
  })
  .catch(console.error);
