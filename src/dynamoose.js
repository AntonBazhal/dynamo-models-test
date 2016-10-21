const dynamoose = require('dynamoose');

// If you want to connect to the cloud DynamoDB instance, comment out the next line
dynamoose.local();

const OWNER_ID = 1;
const DOG_NAME = 'Odie';

const dogSchema = new dynamoose.Schema({
  ownerId: {
    type: Number,
    validate: function(v) { return v > 0; },
    hashKey: true
  },
  name: {
    type: String,
    rangeKey: true,
    index: true // name: nameLocalIndex, ProjectionType: ALL
  },
  breed: {
    type: String,
    trim: true,
    required: true,
    index: {
      global: true,
      rangeKey: 'ownerId',
      name: 'BreedIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  color: {
    lowercase: true,
    type: [String],
    default: ['Brown']
  },
  age: Number
}, {
  throughput: {
    read: 1,
    write: 1
  },
  timestamps: true
});

const Dog = dynamoose.model('Dog', dogSchema);

const odie = new Dog({
  ownerId: OWNER_ID,
  name: DOG_NAME,
  breed: 'Beagle',
  color: ['Tan'],
  age: 5
});

odie
  .save()
  .then(doggie => {
    console.log(`${ DOG_NAME } was saved at ${ new Date(doggie.createdAt) }`);

    return Dog
      .update({
        ownerId: OWNER_ID,
        name: DOG_NAME
      }, {
        $ADD: {
          color: [ 'White' ]
        }
      });
  })
  .then(doggie => {
    console.log(`${ DOG_NAME } was updated at ${ new Date(doggie.updatedAt) }`);

    return Dog
      .get({
        ownerId: OWNER_ID,
        name: DOG_NAME
      });
  })
  .then(doggie => {
    console.log(`${ DOG_NAME } was found! Now its color is ${ doggie.color }`);

    return Dog
      .delete({
        ownerId: OWNER_ID,
        name: DOG_NAME
      });
  })
  .then(() => {
    console.log(`Bye bye ${ DOG_NAME }`);
  })
  .catch(console.error);
