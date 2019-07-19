var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var validate = require('mongoose-validator');

var firstNameValidator = [
  validate({
    validator: 'matches',
    arguments: /^[a-zA-Z ]{3,20}$/i,
    message: 'First name must be at least 3 character, max 20. No special characters or numbers.'
  })
];

var lastNameValidator = [
  validate({
    validator: 'matches',
    arguments: /^[a-zA-Z ]{3,20}$/i,
    message: 'Last name must be at least 3 character, max 20. No special characters or numbers.'
  })
];

var emailValidator = [
  validate({
    validator: 'matches',
    arguments: /^(([\w-\.]{6,30})+@([\w-]+\.)+[\w-]{2,4})?$/i,
    message: 'Invalid email.'
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


var UserSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    validate: firstNameValidator
  },
  lastName: {
    type: String,
    required: true,
    validate: lastNameValidator
  },
  major: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  ethnicity: {
    type: String,
    required: true
  },
  sex: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    required: true,
    unique: true,
    validate: emailValidator
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
  points: {
    type: Number,
    default: 0
  },
  fallPoints: {
    type: Number,
    default: 0
  },
  springPoints: {
    type: Number,
    default: 0
  },
  summerPoints: {
    type: Number,
    default: 0
  },
  resettoken: {
    type: String,
    required: false
  },
  permission: {
    type: String,
    require: ["user", "admin", "national"],
    default: 'user'
  },
  listServ: {
    type: Boolean,
    default: false
  },
  events: [{
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Code'
    }
  }],
  bookmarks: [{
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      unique: true
    }
  }]
});

UserSchema.pre('save', function(next) {
  var user = this;

  if (!user.isModified('password')) return next();

  bcrypt.hash(user.password, null, null, function(err, hash) {
    if (err) return next(err);
    user.password = hash;
    next();
  });
});

UserSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
