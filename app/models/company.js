var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validate = require('mongoose-validator');

var CompanySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  logo:{
    type: String,
    required: true
  },
  majors: [{
    type: String,
    required: true
  }],
  overview: {
    type: String
  },
  mission: {
    type: String
  },
  goals: {
    type: String
  },
  model: {
    type: String
  },
  news: {
    type: String,
    required: true
  },
  apply: {
    type: String,
    required: true
  },
  industry: [{
    type: String,
    required: true
  }],
  slogan: {
    type: String
  },
  academia: {
    type: Boolean,
    default: false
  },
  government: {
    type: Boolean,
    default: false
  },
  nonprofit:{
    type: Boolean,
    default: false
  },
  visa: {
    type: Boolean,
    default: false
  },
  bbqFall: {
    type: Boolean,
    default: false
  },
  bbqSpring: {
    type: Boolean,
    default: false
  },
  national: {
    type: Boolean,
    default: false
  },
  sponsor: {
    type: Boolean,
    default: false
  },
  ipc: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Company', CompanySchema);
