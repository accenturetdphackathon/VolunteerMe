var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RequestSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Code'
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  semester: {
    type: String,
    required: ["Spring", "Fall", "Summer"]
  }
});

module.exports = mongoose.model('Request', RequestSchema);
