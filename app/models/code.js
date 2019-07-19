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

var codeValidator = [
  validate({
    validator: 'matches',
    arguments: /^[a-zA-Z0-9]{6,50}$/i,
    message: 'Event code must be at least 6 characters, max 50. No special characters.'
  })
];

var CodeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    validate: nameValidator
  },
  code: {
    type: String,
    required: true,
    unique: true,
    validate: codeValidator
  },
  type: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  expiration: {
    type: Date,
    required: true
  },
  semester: {
    type: String,
    required: ["Spring", "Fall", "Summer"]
  }
});

module.exports = mongoose.model('Code', CodeSchema);
