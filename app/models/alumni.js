var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AlumniSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    required: true,
    unique: true
  },
  country: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true,
  },
  nationality: {
    type: String,
    required: true
  },
  undergrad: {
    type: String,
    required: true
  },
  undergradYear: {
    type: Number,
    required: true
  },
  grad: {
    type: String
  },
  gradYear: {
    type: Number
  },
  employer: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  linkedIn: {
    type: String,
    required: true
  },
  coordinates: {
    longitude: {
      type: Number
    },
    latitude: {
      type: Number
    }
  }
});

module.exports = mongoose.model('Alumni', AlumniSchema);
