var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var validate = require('mongoose-validator');

var emailValidator = [
  validate({
    validator: 'matches',
    arguments: /^(([\w-\.]{6,30})+@([\w-]+\.)+[\w-]{2,4})?$/i,
    message: 'Invalid email format.'
  })
];

var websiteValidator = [
  validate({
    validator: 'matches',
    arguments: /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/g,
    message: 'Invalid website format.'
  })
];

var usernameValidator = [
  validate({
    validator: 'matches',
    arguments: /^[a-zA-Z0-9]{6,20}$/i,
    message: 'Username must be at least 6 characters, max 20. No special characters.'
  })
];

var passwordValidator = [
  validate({
    validator: 'matches',
    arguments: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
    message: 'Password must be at least 8 characters. It must contain at least one lowercase character, one uppercase character, one number, and one special character.'
  })
];


var OrgSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    lowercase: true,
    required: true,
    unique: true,
    validate: emailValidator
  },
  logo: {
    type: String,
    required: true
  },
  website: {
    type: String,
    required: true,
    validate: websiteValidator
  },
  phone: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  address2: {
    type: String
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zip: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    lowercase: true,
    required: true,
    unique: true,
    validate: usernameValidator
  },
  password: {
    type: String,
    required: true,
    validate: passwordValidator
  },
  resettoken: {
    type: String,
    required: false
  },
  events: [{
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Code'
    }
  }]
});

OrgSchema.pre('save', function(next) {
  var user = this;

  if (!user.isModified('password')) return next();

  bcrypt.hash(user.password, null, null, function(err, hash) {
    if (err) return next(err);
    user.password = hash;
    next();
  });
});

OrgSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('Org', OrgSchema);
