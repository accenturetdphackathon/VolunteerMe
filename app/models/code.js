var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validate = require('mongoose-validator');

var nameValidator = [
  validate({
    validator: 'matches',
    arguments: /^[a-zA-Z0-9-/ ]{6,50}$/i,
    message: 'Event name must be at least 6 characters, max 50. No special characters, except for hyphens (-) and dashes (/).'
  })
];

var EventSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    validate: nameValidator
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  },
  orgId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Event', EventSchema);
