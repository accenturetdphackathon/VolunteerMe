require('dotenv').config();

// MODEL FILES
var User = require('../models/user');
var Code = require('../models/code');
var Request = require('../models/request');
var Alumni = require('../models/alumni');
var Company = require('../models/company');

// NPM PACKAGES
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
var nodeGeocoder = require('node-geocoder');
var Json2csvParser = require('json2csv').Parser;

// MISCELLANEOUS
var fs = require('fs');
var secret = process.env.SECRET;

module.exports = function(router) {

  var transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    }
  });

  var ngcOptions = {
    provider: 'mapquest',
    httpAdapter: 'https',
    apiKey: process.env.MQ_KEY,
    formatter: null
  };

  // ENDPOINT TO ADD ALUMNI COORDINATES
  router.get('/alumnicoordinates', function(req, res) {
    Alumni.find({

    }).select('id city state country').exec(function(err, alumni) {
      if (err) throw err;

      var locations = [];
      var coordinates = [];

      for (var i = 0; i < alumni.length; i++) {
        locations.push(alumni[i].city + ", " + alumni[i].state + ", " + alumni[i].country);
      }

      var geocoder = nodeGeocoder(ngcOptions);

      geocoder.batchGeocode(locations, function(err, results) {
        if (err) throw err;

        if (results) {
          for (var i = 0; i < results.length; i++) {
            var temp = [];
            var north = Math.random() * 0.007;
            var south = -1 * Math.random() * 0.007;
            var east = Math.random() * 0.007;
            var west = -1 * Math.random() * 0.007;
            temp.push(results[i].value[0].latitude + east + west);
            temp.push(results[i].value[0].longitude + north + south);
            coordinates.push(temp);
          }

          for (var i = 0; i < coordinates.length; i++) {
            Alumni.updateOne({
              _id: alumni[i].id
            }, {
              coordinates: {
                latitude: coordinates[i][0],
                longitude: coordinates[i][1]
              },
            }, {
              multi: true
            }, function(err, updatedAlumni) {
              if (err) throw err;
            });
          }
        }
      });
    });
  });

  // ENDPOINT TO GET LISTSERV
  router.get('/listServ', function(req, res) {
    User.find({
      listServ: true
    }).select('firstName lastName email').exec(function(err, members) {
      if (err) throw err;

      res.json({
        message: members,
        success: true
      })
    });
  });

  // ENDPOINT TO ADD SEMESTER FIELD TO CODES MODEL
  router.put('/addsemester', function(req, res) {
    Code.find({

    }, function(err, events) {
      if (err) throw err;

      for (var i = 0; i < events.length; i++) {
        Code.find({
          code: events[i].code
        }, function(err, event) {
          var eventSemester = "";

          if (event[0].expiration.getMonth() >= 0 && event[0].expiration.getMonth() <= 3) {
            eventSemester = "Spring";
          } else if (event[0].expiration.getMonth() >= 4 && event[0].expiration.getMonth() <= 6) {
            eventSemester = "Summer";
          } else {
            eventSemester = "Fall";
          }

          Code.findOneAndUpdate({
            code: event[0].code
          }, {
            $set: {
              semester: eventSemester
            }
          }, function(err, newEvent) {
            if (err) throw err;
          });
        });
      };

      res.send("Events updated!");
    });
  });

  // ENDPOINT TO RETROACTIVELY SPLIT FALL AND SPRING SEMESTER POINTS
  router.put('/split', async function(req, res) {
    User.find({

    }, function(err, users) {
      if (err) throw err;

      var userNum = req.body.number;

      if (users[userNum].events.length == 0) {
        User.findOneAndUpdate({
          username: users[userNum].username
        }, {
          $set: {
            fallPoints: 0,
            springPoints: 0,
            summerPoints: 0
          }
        }, function(err, newUser) {
          if (err) throw err;
        });
      } else {
        var fall = 0;
        var spring = 0;
        var summer = 0;

        for (var j = 0; j < users[userNum].events.length; j++) {
          Code.findOne({
            _id: users[userNum].events[j]._id
          }, function(err, code) {
            if (err) throw err;

            if (code.semester == "Fall") {
              fall += code.points;
            } else if (code.semester == "Spring") {
              spring += code.points;
            } else if (code.semester == "Summer") {
              summer += code.points;
            }
          });
        }

        setTimeout(function() {
          User.findOneAndUpdate({
            username: users[userNum].username
          }, {
            $set: {
              fallPoints: fall,
              springPoints: spring,
              summerPoints: summer
            }
          }, function(err, newUser) {
            if (err) throw err;

            res.send(newUser);
          });
        }, 1500);
      }
    });
  });

  // ENDPOINT TO CREATE/REGISTER USERS
  router.post('/users', function(req, res) {
    var user = new User();
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.major = req.body.major;
    user.year = req.body.year;
    user.nationality = req.body.nationality;
    user.ethnicity = req.body.ethnicity;
    user.sex = req.body.sex;
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;
    user.listServ = req.body.listServ;

    if (req.body.username == null || req.body.password == null || req.body.email == null || req.body.firstName == null || req.body.lastName == null || req.body.major == null || req.body.year == null || req.body.nationality == null || req.body.ethnicity == null || req.body.sex == null || req.body.username == '' || req.body.password == '' || req.body.email == '' || req.body.firstName == '' || req.body.lastName == '' || req.body.major == '' || req.body.year == '' || req.body.nationality == '' || req.body.ethnicity == '' || req.body.sex == '') {
      res.json({
        success: false,
        message: 'Make sure you filled out the entire form!'
      });
    } else {
      user.save(function(err) {
        if (err) {
          if (err.errors != null) {
            if (err.errors.firstName) {
              res.json({
                success: false,
                message: err.errors.firstName.properties.message
              });
            } else if (err.errors.lastName) {
              res.json({
                success: false,
                message: err.errors.lastName.properties.message
              });
            } else if (err.errors.email) {
              res.json({
                success: false,
                message: err.errors.email.properties.message
              });
            } else if (err.errors.username) {
              res.json({
                success: false,
                message: err.errors.username.properties.message
              });
            } else if (err.errors.password) {
              res.json({
                success: false,
                message: err.errors.password.properties.message
              });
            } else {
              res.json({
                success: false,
                message: err
              });
            }
          } else if (err) {
            if (err.code == 11000) {
              res.json({
                success: false,
                message: 'Username and/or email already taken.'
              });
            } else {
              res.json({
                success: false,
                message: err
              });
            }
          }
        } else {
          res.json({
            success: true,
            message: 'Congratulations! Welcome!'
          });
        }
      });
    }
  });

  // ENDPOINT TO CREATE EVENT CODES
  router.post('/codes', function(req, res) {
    if (req.body.name == null || req.body.code == null || req.body.type == null || req.body.expiration == null || req.body.name == '' || req.body.code == '' || req.body.type == '' || req.body.expiration == '') {
      res.json({
        success: false,
        message: 'Make sure you filled out the entire form!'
      });
    } else {
      var code = new Code();
      code.name = req.body.name;
      code.code = req.body.code.toLowerCase();
      code.type = req.body.type;

      if (code.type == 'General Body Meeting' || code.type == 'Cabinet Meeting' || code.type == 'Workshop' || code.type == 'Social' || code.type == 'Form/Survey') {
        code.points = 1;
      } else if (code.type == 'Corporate Event') {
        code.points = 2;
      } else if (code.type == 'Fundraiser') {
        code.points = 3;
      } else if (code.type == 'Volunteering') {
        code.points = 4;
      } else if (code.type == 'Miscellaneous') {
        code.points = 5;
      } else {
        code.points = 0;
      }

      code.expiration = Date.now() + (req.body.expiration * 60 * 60 * 1000);

      if (code.expiration.getMonth() >= 0 && code.expiration.getMonth() <= 3) {
        code.semester = "Spring";
      } else if (code.expiration.getMonth() >= 4 && code.expiration.getMonth() <= 6) {
        code.semester = "Summer";
      } else {
        code.semester = "Fall";
      }

      code.save(function(err) {
        if (err) {
          if (err.errors != null) {
            if (err.errors.name) {
              res.json({
                success: false,
                message: err.errors.name.properties.message
              });
            } else if (err.errors.code) {
              res.json({
                success: false,
                message: err.errors.code.properties.message
              });
            } else if (err.errors.type) {
              res.json({
                success: false,
                message: err.errors.type.properties.message
              });
            } else if (err.errors.points) {
              res.json({
                success: false,
                message: err.errors.points.properties.message
              });
            } else if (err.errors.expiration) {
              res.json({
                success: false,
                message: err.errors.expiration.properties.message
              });
            } else {
              res.json({
                success: false,
                message: err
              });
            }
          } else if (err) {
            if (err.code == 11000) {
              res.json({
                success: false,
                message: 'Event name and/or code already taken.'
              });
            } else {
              res.json({
                success: false,
                message: err
              });
            }
          }
        } else {
          res.json({
            success: true,
            message: code
          });
        }
      });
    }
  });

  // ENDPOINT TO SIGN IN AND AUTHENTICATE USER
  router.post('/authenticate', function(req, res) {
    User.findOne({
      username: req.body.username
    }).select().exec(function(err, user) {
      if (err) throw err;

      if (!user) {
        res.json({
          success: false,
          message: 'User not found'
        });
      } else if (user) {
        if (!req.body.password) {
          res.json({
            success: false,
            message: 'Enter a password'
          });
        } else {
          var validPassword = user.comparePassword(req.body.password);

          if (!validPassword) {
            res.json({
              success: false,
              message: 'Wrong password'
            });
          } else {

            var token = jwt.sign({
              username: user.username,
              email: user.email
            }, secret, {
              expiresIn: '1h'
            });

            res.json({
              success: true,
              message: 'User authenticated',
              token: token
            });
          }
        }
      }
    });
  });

  // ENDPOINT TO SEND THE USER A FORGOT USERNAME EMAIL
  router.get('/forgetusername/:email', function(req, res) {
    User.findOne({
      email: req.params.email
    }).select('email firstName username').exec(function(err, user) {
      if (err) {
        res.json({
          success: false,
          message: err
        });
      } else {
        if (!req.params.email) {
          res.json({
            success: false,
            message: 'No email was provided'
          });
        } else {
          if (!user) {
            res.json({
              success: false,
              message: 'Email not found'
            });
          } else {
            var email = {
              from: process.env.USER,
              to: user.email,
              subject: 'MemberSHPE UF Username Request',
              text: 'Hello ' + user.firstName + ', \n\nYou have requested the username for your MemberSHPE UF account.\n\n Your username is: ' + user.username + '\n\nIf you think it was sent incorrectly, please contact an officer.\n\nMemberSHPE Team',
              html: 'Hello<strong> ' + user.firstName + '</strong>,<br><br>You have requested the username for your MemberSHPE UF account.<br><br> Your username is: <strong>' + user.username + '</strong><br><br>If you think it was sent incorrectly, please contact a SHPE UF officer.<br><br><strong>MemberSHPE Team</strong>'
            };

            transporter.sendMail(email, function(err, info) {
              if (err) {
                console.log(err);
                throw err;
              } else {
                res.json({
                  success: true,
                  message: 'Username has been sent to email.'
                });
              }
            });
          }
        }
      }
    });
  });

  // ENDPOINT TO SEND THE USER A RESET PASSWORD EMAIL
  router.put('/resetpassword/', function(req, res) {
    User.findOne({
      username: req.body.username
    }).select('username email resettoken firstName').exec(function(err, user) {

      if (err) throw err;

      if (!user) {
        res.json({
          success: false,
          message: 'User not found'
        });
      } else {
        user.resettoken = jwt.sign({
          username: user.username,
          email: user.email,
        }, secret, {
          expiresIn: '24h'
        });

        user.save(function(err) {
          if (err) {
            res.json({
              success: false,
              message: err
            });
          } else {
            var email = {
              from: process.env.USER,
              to: user.email,
              subject: 'MemberSHPE UF Password Reset Link Request',
              text: 'Hello ' + user.firstName + ', You recently requested a password reset link. Please click on the link below to reset your password: https://membershpeuf.herokuapp.com/reset/' + user.resettoken,
              html: 'Hello<strong> ' + user.firstName + '</strong>,<br><br>You recently requested a password reset link. Please click on the link below to reset your password:<br><br><a href="http://membershpeuf.herokuapp.com/reset/' + user.resettoken + '">Password Reset Link</a>'
            };

            transporter.sendMail(email, function(err, info) {
              if (err) {
                console.log(err);
                throw err;
              } else {
                res.json({
                  success: true,
                  message: 'Reset link has been sent to your email.'
                });
              }
            });
          }
        });
      }
    });
  });

  // ENDPOINT TO RESET THE PASSWORD
  router.get('/resetpassword/:token', function(req, res) {
    User.findOne({
      resettoken: req.params.token
    }).select().exec(function(err, user) {
      if (err) throw err;

      var token = req.params.token;

      jwt.verify(token, secret, function(err, decoded) {
        if (err) {
          res.json({
            success: false,
            message: 'Password reset link has expired'
          });
        } else {
          if (!user) {
            res.json({
              success: false,
              message: 'Password reset link has expired'
            });
          } else {
            res.json({
              success: true,
              user: user
            });
          }
        }
      });

    });
  });

  // ENDPOINT TO SAVE PASSWORD
  router.put('/savepassword', function(req, res) {
    User.findOne({
      username: req.body.username
    }).select('firstName username email password resettoken').exec(function(err, user) {
      if (err) throw err;

      if (req.body.password == null || req.body.password == '') {
        res.json({
          success: false,
          message: 'Password not provided.'
        });
      } else {
        user.password = req.body.password;
        user.resettoken = false;

        user.save(function(err) {
          if (err) {
            res.json({
              success: false,
              message: err
            });
          } else {

            var email = {
              from: process.env.USER,
              to: user.email,
              subject: 'MemberSHPE UF Password Reset Notification',
              text: 'Hello ' + user.firstName + ', This email is to notify you that your password was reset at MemberSHPE UF',
              html: 'Hello<strong> ' + user.firstName + '</strong>,<br><br>This email is to notify you that your password was reset at MemberSHPE UF'
            };

            transporter.sendMail(email, function(err, info) {
              if (err) {
                console.log(err);
                throw err;
              } else {
                res.json({
                  success: true,
                  message: 'Password has been reset.'
                });
              }
            });
          }
        });
      }
    });
  });

  // MIDDLEWARE TO LOG USER IN
  router.use(function(req, res, next) {
    var token = req.body.token || req.body.query || req.headers['x-access-token'];

    if (token) {
      jwt.verify(token, secret, function(err, decoded) {
        if (err) {
          res.json({
            success: false,
            message: 'Token invalid'
          });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      res.json({
        success: false,
        message: 'No token provided'
      });
    }
  });

  // ENDPOINT TO SEND USER PROFILE INFORMATION
  router.post('/me', function(req, res) {
    User.findOne({
      username: req.decoded.username
    }).select().exec(function(err, user) {
      res.send(user);
    });
  });

  // ENDPOINT TO RENEW THE USER TOKEN
  router.get('/renewtoken/:username', function(req, res) {
    User.findOne({
      username: req.params.username
    }).select().exec(function(err, user) {
      if (!user) {
        res.json({
          success: false,
          message: 'No user was found'
        });
      } else {
        var newToken = jwt.sign({
          username: user.username,
          email: user.email
        }, secret, {
          expiresIn: '1h'
        });
        res.json({
          success: true,
          token: newToken
        });
      }
    });
  });

  // ENDPOINT TO DETERMINE USER PERMISSION
  router.get('/permission', function(req, res) {
    User.findOne({
      username: req.decoded.username
    }, function(err, user) {
      if (err) throw err;

      if (!user) {
        res.json({
          success: false,
          message: 'User not found'
        });
      } else {
        res.json({
          success: true,
          message: user.permission
        });
      }
    });
  });

  // ENDPOINT TO RETRIEVE ALL USERS
  router.get('/admin', function(req, res) {
    User.find({

    }, function(err, users) {
      if (err) throw err;
      User.findOne({
        username: req.decoded.username
      }, function(err, mainUser) {
        if (err) throw err;

        if (!mainUser) {
          res.json({
            success: false,
            message: 'No user found'
          });
        } else {
          if (mainUser.permission === 'admin') {
            if (!users) {
              res.json({
                success: false,
                message: 'Users not found'
              });
            } else {
              res.json({
                success: true,
                message: users,
                permission: mainUser.permission
              });
            }
          } else {
            res.json({
              success: false,
              message: 'Insufficient permission'
            });
          }
        }
      });
    });
  });

  // ENDPOINT TO RETRIEVE EVENT CODES
  router.get('/getcodes', function(req, res) {
    Code.find({

    }, function(err, events) {
      if (err) throw err;
      User.findOne({
        username: req.decoded.username
      }, function(err, mainUser) {
        if (err) throw err;

        if (!mainUser) {
          res.json({
            success: false,
            message: 'No event found'
          });
        } else {
          if (mainUser.permission === 'admin') {
            if (!events) {
              res.json({
                success: false,
                message: 'Events not found'
              });
            } else {
              res.json({
                success: true,
                message: events,
                permission: mainUser.permission
              });
            }
          } else {
            res.json({
              success: false,
              message: 'Insufficient permission'
            });
          }
        }
      });
    });
  });

  // ENDPOINT TO ADD A REQUEST (*)
  router.put('/addrequest', function(req, res) {

    if (req.body.code == null || req.body.code == '') {
      res.json({
        success: false,
        message: 'No code was provided'
      });
    } else {
      Code.findOne({
        code: req.body.code.toLowerCase()
      }).select().exec(function(err, code) {

        if (err) throw err;

        if (code == null || code == '') {
          res.json({
            success: false,
            message: 'Event not found'
          });
        } else if (code.expiration < Date.now()) {
          res.json({
            success: false,
            message: 'Event code expired'
          });
        } else {
          User.findOne({
            username: req.decoded.username
          }, function(err, user) {
            if (err) throw err;

            var isDuplicate = false;

            for (var i = 0; i < user.events.length; i++) {
              if (user.events[i]._id.equals(code._id)) {
                isDuplicate = true;
                break;
              }
            }

            if (isDuplicate) {
              res.json({
                success: false,
                message: 'Event code already redeemed'
              });
            } else {
              if (!user) {
                res.json({
                  success: false,
                  message: 'Unable to add code to profile'
                });
              } else {
                if (code.points == 1 && code.type == 'General Body Meeting') {
                  if (code.semester == "Fall") {
                    User.findOneAndUpdate({
                      username: req.decoded.username,
                    }, {
                      $push: {
                        events: {
                          _id: code
                        }
                      },
                      $inc: {
                        points: code.points,
                        fallPoints: code.points
                      }
                    }, function(err, user) {
                      if (err) throw (err);

                      if (!user) {
                        res.json({
                          success: false,
                          message: 'Unable to add code to profile'
                        });
                      } else {
                        res.json({
                          success: true,
                          message: "Points redeemed!"
                        });
                      }
                    });
                  } else if (code.semester == "Spring") {
                    User.findOneAndUpdate({
                      username: req.decoded.username,
                    }, {
                      $push: {
                        events: {
                          _id: code
                        }
                      },
                      $inc: {
                        points: code.points,
                        springPoints: code.points
                      }
                    }, function(err, user) {
                      if (err) throw (err);

                      if (!user) {
                        res.json({
                          success: false,
                          message: 'Unable to add code to profile'
                        });
                      } else {
                        res.json({
                          success: true,
                          message: "Points redeemed!"
                        });
                      }
                    });
                  } else if (code.semester == "Summer") {
                    User.findOneAndUpdate({
                      username: req.decoded.username,
                    }, {
                      $push: {
                        events: {
                          _id: code
                        }
                      },
                      $inc: {
                        points: code.points,
                        summer: code.points
                      }
                    }, function(err, user) {
                      if (err) throw (err);

                      if (!user) {
                        res.json({
                          success: false,
                          message: 'Unable to add code to profile'
                        });
                      } else {
                        res.json({
                          success: true,
                          message: "Points redeemed!"
                        });
                      }
                    });
                  }
                } else {

                  var newRequest = new Request();
                  newRequest.userId = user._id;
                  newRequest.eventId = code._id;
                  newRequest.firstName = user.firstName;
                  newRequest.lastName = user.lastName;
                  newRequest.username = user.username;
                  newRequest.eventName = code.name;
                  newRequest.type = code.type;
                  newRequest.points = code.points;
                  newRequest.status = 0;
                  newRequest.semester = code.semester;

                  Request.findOne({
                    userId: user._id,
                    eventId: code._id
                  }).select().exec(function(err, request) {
                    if (err) throw err;

                    if (request) {
                      res.json({
                        success: false,
                        message: 'Request has already been submitted.'
                      });
                    } else {
                      newRequest.save(function(err) {
                        if (err) {
                          res.json({
                            success: false,
                            message: err
                          });
                        } else {
                          res.json({
                            success: true,
                            message: 'Your request has been sent for approval.'
                          });
                        }
                      });
                    }
                  });
                }
              }
            }
          });
        }
      });
    }
  });

  // ENDPOINT TO GRAB EVENT CODE INFORMATION FOR INDIVIDUAL USERS
  router.get('/getcodeinfo/:code', function(req, res) {
    Code.findOne({
      _id: req.params.code
    }).populate().exec(function(err, event) {
      if (err) throw err;

      res.json({
        success: true,
        message: event
      });
    });
  });

  // ENDPOINT TO GRAB ALL OF THE REQUESTS (*)
  router.get('/getrequests', function(req, res) {
    Request.find({

    }, function(err, requests) {
      if (err) throw err;
      User.findOne({
        username: req.decoded.username
      }, function(err, mainUser) {
        if (err) throw err;

        if (!mainUser) {
          res.json({
            success: false,
            message: 'No user found'
          });
        } else {
          if (mainUser.permission === 'admin') {
            if (!requests) {
              res.json({
                success: false,
                message: 'Requests not found'
              });
            } else {
              res.json({
                success: true,
                message: requests,
                permission: mainUser.permission
              });
            }
          } else {
            res.json({
              success: false,
              message: 'Insufficient permission'
            });
          }
        }
      });
    });
  });

  // ENDPOINT TO APPROVE REQUESTS
  router.put('/approverequest', function(req, res) {
    if (req.body.semester == "Fall") {
      User.findOneAndUpdate({
        username: req.body.username,
      }, {
        $push: {
          events: {
            _id: req.body.eventId
          }
        },
        $inc: {
          points: req.body.points,
          fallPoints: req.body.points
        }
      }, function(err, user) {
        if (err) throw (err);

        if (!user) {
          res.json({
            success: false,
            message: 'Unable to accept request'
          });
        } else {
          Request.deleteOne({
            _id: req.body._id
          }, function(err, deletedRequest) {
            if (err) throw (err);

            res.json({
              success: true,
              message: "Request accepted!"
            });
          });
        }
      });
    } else if (req.body.semester == "Spring") {
      User.findOneAndUpdate({
        username: req.body.username,
      }, {
        $push: {
          events: {
            _id: req.body.eventId
          }
        },
        $inc: {
          points: req.body.points,
          springPoints: req.body.points
        }
      }, function(err, user) {
        if (err) throw (err);

        if (!user) {
          res.json({
            success: false,
            message: 'Unable to accept request'
          });
        } else {
          Request.deleteOne({
            _id: req.body._id
          }, function(err, deletedRequest) {
            if (err) throw (err);

            res.json({
              success: true,
              message: "Request accepted!"
            });
          });
        }
      });
    } else if (req.body.semester == "Summer") {
      User.findOneAndUpdate({
        username: req.body.username,
      }, {
        $push: {
          events: {
            _id: req.body.eventId
          }
        },
        $inc: {
          points: req.body.points,
          summerPoints: req.body.points
        }
      }, function(err, user) {
        if (err) throw (err);

        if (!user) {
          res.json({
            success: false,
            message: 'Unable to accept request'
          });
        } else {
          Request.deleteOne({
            _id: req.body._id
          }, function(err, deletedRequest) {
            if (err) throw (err);

            res.json({
              success: true,
              message: "Request accepted!"
            });
          });
        }
      });
    }
  });

  // ENDPOINT TO DENY REQUESTS
  router.put('/denyrequest', function(req, res) {
    Request.deleteOne({
      _id: req.body._id
    }, function(err, deletedRequest) {
      if (err) throw (err);

      res.json({
        success: true,
        message: "Request denied"
      });
    });
  });

  // ENDPOINT TO CALCULATE USER POINT PERCENTILE
  router.get('/getpercentile/:username', function(req, res) {
    var fallPercentile = 0;
    var springPercentile = 0;
    var summerPercentile = 0;
    var fallBelow = 0;
    var springBelow = 0;
    var summerBelow = 0;

    User.findOne({
      username: req.decoded.username
    }, function(err, user) {
      if (err) throw err;

      User.find({

      }).select('fallPoints springPoints summerPoints ').exec(function(err, userArray) {
        if (err) throw err;

        for (var i = 0; i < userArray.length; i++) {
          if (user.fallPoints > userArray[i].fallPoints) {
            fallBelow++;
          }
          if (user.springPoints > userArray[i].springPoints) {
            springBelow++;
          }
          if (user.summerPoints > userArray[i].summerPoints) {
            summerBelow++;
          }
        }

        fallPercentile = Math.trunc((fallBelow / userArray.length) * 100);
        springPercentile = Math.trunc((springBelow / userArray.length) * 100);
        summerPercentile = Math.trunc((summerBelow / userArray.length) * 100);

        var percentile = {
          fall: fallPercentile,
          spring: springPercentile,
          summer: summerPercentile
        }

        res.json({
          success: true,
          message: percentile
        });
      });
    });
  });

  // ENDPOINT TO GRAB EVENT ATTENDANCE
  router.get('/getattendance/:eventid', function(req, res) {
    User.find({
      events: {
        _id: req.params.eventid
      }
    }).populate().exec(function(err, users) {
      if (err) throw err;

      res.json({
        success: true,
        message: users
      });
    });
  });

  // ENDPOINT TO MANUALLY INPUT POINTS FOR MEMBERS
  router.put('/manualinput', function(req, res) {
    if (req.body.member == null || req.body.member == "" || req.body.member == undefined || req.body.member.userName == null || req.body.member.userName == '' || req.body.member.userName == undefined) {
      res.json({
        success: false,
        message: 'No username was provided.'
      });
    } else {
      User.findOne({
        username: req.body.member.userName
      }).select().exec(function(err, user) {
        if (err) throw err;

        if (!user) {
          res.json({
            success: false,
            message: 'User not found'
          });
        } else {

          var isDuplicate = false;

          for (var i = 0; i < user.events.length; i++) {
            if (user.events[i]._id.equals(req.body.eventId)) {
              isDuplicate = true;
              break;
            }
          }

          if (isDuplicate) {
            res.json({
              success: false,
              message: 'Event code already redeemed by the user.'
            });
          } else {
            Code.findOne({
              _id: req.body.eventId
            }).select().exec(function(err, code) {
              if (code.semester == "Fall") {
                User.findOneAndUpdate({
                  username: user.username
                }, {
                  $push: {
                    events: {
                      _id: code._id
                    }
                  },
                  $inc: {
                    points: code.points,
                    fallPoints: code.points
                  }
                }, function(err, newUser) {
                  if (err) throw err;

                  if (!newUser) {
                    res.json({
                      success: false,
                      message: "Unable to add event to user"
                    });
                  } else {
                    res.json({
                      success: true,
                      message: "Points added to user"
                    });
                  }
                });
              } else if (code.semester == "Spring") {
                User.findOneAndUpdate({
                  username: user.username
                }, {
                  $push: {
                    events: {
                      _id: code._id
                    }
                  },
                  $inc: {
                    points: code.points,
                    springPoints: code.points
                  }
                }, function(err, newUser) {
                  if (err) throw err;

                  if (!newUser) {
                    res.json({
                      success: false,
                      message: "Unable to add event to user"
                    });
                  } else {
                    res.json({
                      success: true,
                      message: "Points added to user"
                    });
                  }
                });
              } else if (code.semester == "Summer") {
                User.findOneAndUpdate({
                  username: user.username
                }, {
                  $push: {
                    events: {
                      _id: code._id
                    }
                  },
                  $inc: {
                    points: code.points,
                    summerPoints: code.points
                  }
                }, function(err, newUser) {
                  if (err) throw err;

                  if (!newUser) {
                    res.json({
                      success: false,
                      message: "Unable to add event to user"
                    });
                  } else {
                    res.json({
                      success: true,
                      message: "Points added to user"
                    });
                  }
                });
              }
            });
          }
        }
      });
    }
  });

  // ENDPOINT TO RETRIEVE TABLE WITH COUNT OF MEMBER MAJORS
  router.get('/getmembermajorstat', function(req, res) {
    User.aggregate([{
        $group: {
          _id: '$major',
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          count: -1
        }
      }
    ], function(err, result) {
      if (err) throw err;

      res.json({
        success: true,
        message: result
      });
    });
  });

  // ENDPOINT TO RETRIEVE TABLE WITH COUNT OF MEMBER YEARS
  router.get('/getmemberyearstat', function(req, res) {
    User.aggregate([{
        $group: {
          _id: '$year',
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          count: -1
        }
      }
    ], function(err, result) {
      if (err) throw err;

      res.json({
        success: true,
        message: result
      });
    });
  });

  // ENDPOINT TO RETRIEVE TABLE WITH COUNT OF MEMBER NATIONALITIES
  router.get('/getmembernationalitystat', function(req, res) {
    User.aggregate([{
        $group: {
          _id: '$nationality',
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          count: -1
        }
      }
    ], function(err, result) {
      if (err) throw err;

      res.json({
        success: true,
        message: result
      });
    });
  });

  // ENDPOINT TO RETRIEVE TABLE WITH COUNT OF MEMBER SEXES
  router.get('/getmembersexstat', function(req, res) {
    User.aggregate([{
        $group: {
          _id: '$sex',
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          count: -1
        }
      }
    ], function(err, result) {
      if (err) throw err;

      res.json({
        success: true,
        message: result
      });
    });
  });

  // ENDPOINT TO RETRIEVE TABLE WITH COUNT OF MEMBER ETHNICITIES
  router.get('/getmemberethnicitystat', function(req, res) {
    User.aggregate([{
        $group: {
          _id: '$ethnicity',
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          count: -1
        }
      }
    ], function(err, result) {
      if (err) throw err;

      res.json({
        success: true,
        message: result
      });
    });
  });

  // ENDPOINT TO RETRIVE TOTAL POINT DISTRIBUTION
  router.get('/gettotalpointdistribution', function(req, res) {
    User.aggregate([{
      $group: {
        _id: '$points',
        count: {
          $sum: 1
        }
      }
    }, {
      $sort: {
        _id: 1
      }
    }], function(err, result) {
      if (err) throw err;

      res.json({
        success: true,
        message: result
      });
    });
  });

  // ENDPOINT TO RETRIVE FALL POINT DISTRIBUTION
  router.get('/getfallpointdistribution', function(req, res) {
    User.aggregate([{
      $group: {
        _id: '$fallPoints',
        count: {
          $sum: 1
        }
      }
    }, {
      $sort: {
        _id: 1
      }
    }], function(err, result) {
      if (err) throw err;

      res.json({
        success: true,
        message: result
      });
    });
  });

  // ENDPOINT TO RETRIVE SPRING POINT DISTRIBUTION
  router.get('/getspringpointdistribution', function(req, res) {
    User.aggregate([{
      $group: {
        _id: '$springPoints',
        count: {
          $sum: 1
        }
      }
    }, {
      $sort: {
        _id: 1
      }
    }], function(err, result) {
      if (err) throw err;

      res.json({
        success: true,
        message: result
      });
    });
  });

  // ENDPOINT TO RETRIVE SPRING POINT DISTRIBUTION
  router.get('/getsummerpointdistribution', function(req, res) {
    User.aggregate([{
      $group: {
        _id: '$summerPoints',
        count: {
          $sum: 1
        }
      }
    }, {
      $sort: {
        _id: 1
      }
    }], function(err, result) {
      if (err) throw err;

      res.json({
        success: true,
        message: result
      });
    });
  });

  // ENDPOINT TO RETRIEVE ALUMNI COLLECTION
  router.get('/getalumni', function(req, res) {
    Alumni.find({

    }, function(err, alumni) {
      if (err) throw err;

      res.json({
        success: true,
        message: alumni
      });
    });
  });

  // ENDPOINT TO GENERATE ALUMNI COORDINATES
  router.get('/getcoordinates', function(req, res) {
    Alumni.find({

    }).select('coordinates').exec(function(err, alumni) {
      if (err) throw err;

      var coordinatesArray = [];

      for (var i = 0; i < alumni.length; i++) {
        var temp = [];
        temp.push(alumni[i].coordinates.latitude);
        temp.push(alumni[i].coordinates.longitude);
        coordinatesArray.push(temp);
      }

      res.json({
        success: true,
        message: coordinatesArray
      });
    });
  });

  // ENDPOINT TO CREATE EXCEL FILES FOR EVENT ATTENDANCE
  router.get('/getexceldoc/:eventId', function(req, res) {
    User.find({
      events: {
        _id: req.params.eventId
      }
    }).select('firstName lastName major year email').exec(function(err, users) {
      if (err) throw err;

      console.log(users);

      var fields = ['firstName', 'lastName', 'major', 'year', 'email'];

      var json2csvParser = new Json2csvParser({
        fields
      });

      var csv = json2csvParser.parse(users);

      fs.writeFile('app/routes/excel/EventAttendance.csv', csv, function(err) {
        if (err) throw err;
      });

      setTimeout(function() {
        res.sendFile(__dirname + "/excel/EventAttendance.csv");
      }, 2000);
    });
  });

  //ENDPOINT TO GENERATE INDIVIDUAL USER INFO
  router.get('/getuserinfo/:username', function(req, res) {
    User.find({
      username: req.params.username
    }, function(err, user) {
      if (err) throw err;

      res.json({
        success: true,
        message: user
      });
    });
  });

  router.put('/edituserinfo/', function(req, res) {
    User.findOne({
      username: req.body.username
    }, function(err, user) {
      if (err) throw err;

      if ((req.body.firstName == "" || req.body.firstName == null) && (req.body.lastName == "" || req.body.lastName == null) && (req.body.major == "" || req.body.major == null) && (req.body.major == "" || req.body.major == null) && (req.body.sex == "" || req.body.sex == null) && (req.body.year == "" || req.body.year == null) && (req.body.nationality == "" || req.body.nationality == null) && (req.body.ethnicity == "" || req.body.ethnicity == null)) {

        res.json({
          empty: true,
          message: "No changes were made."
        });

      } else {
        if (req.body.firstName == "" || req.body.firstName == null) {
          req.body.firstName = user.firstName;
        }

        if (req.body.lastName == "" || req.body.lastName == null) {
          req.body.lastName = user.lastName;
        }

        if (req.body.major == "" || req.body.major == null) {
          req.body.major = user.major;
        }

        if (req.body.sex == "" || req.body.sex == null) {
          req.body.sex = user.sex;
        }

        if (req.body.year == "" || req.body.year == null) {
          req.body.year = user.year;
        }

        if (req.body.nationality == "" || req.body.nationality == null) {
          req.body.nationality = user.nationality;
        }

        if (req.body.ethnicity == "" || req.body.ethnicity == null) {
          req.body.ethnicity = user.ethnicity;
        }

        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.major = req.body.major;
        user.sex = req.body.sex;
        user.year = req.body.year;
        user.nationality = req.body.nationality;
        user.ethnicity = req.body.ethnicity;

        user.save(function(err) {
          if (err) {
            res.json({
              success: false,
              empty: false,
              message: "First and last name must each be at least 3 character, max 20. No special characters or numbers."
            });
          } else {
            res.json({
              success: true,
              empty: false,
              message: "User profile successfully updated"
            });
          }
        });
      }
    });
  });

  router.put('/changeuserpermission/', function(req, res) {
    User.findOneAndUpdate({
      username: req.body.username
    }, {
      permission: req.body.permission
    }, function(err, user) {
      if (err) throw err;
      res.json({
        success: true
      });
    });
  });

  router.post('/addcompany/', function(req, res) {
    if (req.body.name == "" || req.body.name == null || req.body.logo == "" || req.body.logo == null || req.body.majors == "" || req.body.majors == null || req.body.news == "" || req.body.news == null || req.body.apply == "" || req.body.apply == null || req.body.industry == "" || req.body.industry == null) {
      res.json({
        success: false,
        message: "Name, logo, majors, industry, news link, and apply link are required."
      })
    } else {
      if (req.body.academia == null || req.body.academia == "") {
        req.body.academia = false;
      }

      if (req.body.government == null || req.body.government == "") {
        req.body.government = false;
      }

      if (req.body.nonprofit == null || req.body.nonprofit == "") {
        req.body.nonprofit = false;
      }

      if (req.body.visa == null || req.body.visa == "") {
        req.body.visa = false;
      }

      if (req.body.bbqFall == null || req.body.bbqFall == "") {
        req.body.bbqFall = false;
      }

      if (req.body.bbqSpring == null || req.body.bbqSpring == "") {
        req.body.bbqSpring = false;
      }

      if (req.body.national == null || req.body.national == "") {
        req.body.national = false;
      }

      if (req.body.sponsor == null || req.body.sponsor == "") {
        req.body.sponsor = false;
      }

      if (req.body.ipc == null || req.body.ipc == "") {
        req.body.ipc = false;
      }

      var company = new Company();
      company.name = req.body.name;
      company.logo = req.body.logo;
      company.majors = req.body.majors;
      company.overview = req.body.overview;
      company.mission = req.body.mission;
      company.goals = req.body.goals;
      company.model = req.body.model;
      company.news = req.body.news;
      company.apply = req.body.apply;
      company.industry = req.body.industry;
      company.slogan = req.body.slogan;
      company.academia = req.body.academia;
      company.government = req.body.government;
      company.nonprofit = req.body.nonprofit;
      company.visa = req.body.visa;
      company.bbqFall = req.body.bbqFall;
      company.bbqSpring = req.body.bbqSpring;
      company.national = req.body.national;
      company.sponsor = req.body.sponsor;
      company.ipc = req.body.ipc;

      company.save(function(err) {
        if (err) {
          if (err.code == 11000) {
            res.json({
              success: false,
              message: "Company is already in the Corporate Database."
            });
          } else {
            res.json({
              success: false,
              message: err
            });
          }
        } else {
          res.json({
            success: true,
            message: "Company successfully added to Corporate Database."
          });
        }
      });
    }

  });

  router.get('/getcompanies/', function(req, res) {
    Company.find({

    }, function(err, company) {
      if (err) throw err;

      res.json({
        success: true,
        message: company
      })
    })
  });

  router.get('/getcompanyinfo/:companyId', function(req, res) {
    Company.findOne({
      _id: req.params.companyId
    }, function(err, company) {
      if (err) throw err;

      res.json({
        success: true,
        message: company
      });
    });
  });

  router.delete('/removecompany/:companyName', function(req, res) {
    Company.findOne({
      name: req.params.companyName
    }, function(err, company) {
      if (err) throw err;

      Company.deleteOne({
        name: req.params.companyName
      }, function(err, deletedCompany) {
        if (err) throw err;

        User.updateMany({
          bookmarks: {
            _id: company._id
          }
        }, {
          $pull: {
            bookmarks: {
              _id: company._id
            }
          }
        }, function(err, users) {
          if (err) throw err;

          res.json({
            success: true,
            message: req.params.companyName + " has been removed."
          });
        });
      });
    });
  });

  router.put('/addbookmark/:companyId', function(req, res) {
    User.findOne({
      username: req.decoded.username
    }, function(err, user) {
      if (err) throw err;

      var isDuplicate = false;

      for (var i = 0; i < user.bookmarks.length; i++) {
        if (req.body.companyId == user.bookmarks[i]._id) {
          isDuplicate = true;
          break;
        }
      }

      if (isDuplicate) {
        res.json({
          success: false
        });
      } else {
        User.findOneAndUpdate({
          username: req.decoded.username
        }, {
          $push: {
            bookmarks: {
              _id: req.params.companyId
            }
          }
        }, function(err, newUser) {
          if (err) throw err;

          console.log(newUser);

          if (!newUser) {
            res.json({
              success: false
            });
          } else {
            res.json({
              success: true,
              message: "Hello"
            });
          }
        });
      }
    });
  });

  router.get('/getbookmarkinfo/:companyId', function(req, res) {
    Company.findOne({
      _id: req.params.companyId
    }, function(err, company) {
      if (err) throw err;

      res.json({
        success: true,
        message: company
      });
    });
  });

  router.put('/removebookmark/:companyId', function(req, res) {
    User.updateOne({
      username: req.decoded.username
    }, {
      $pull: {
        bookmarks: {
          _id: req.params.companyId
        }
      }
    }, function(err, user) {
      if (err) throw err;

      User.findOne({
        username: req.decoded.username
      }, function(err, updatedUser) {
        if (err) throw err;

        console.log("UPDATED USER BOOKMARKS");
        console.log(updatedUser.bookmarks);

        res.json({
          success: true,
          message: updatedUser.bookmarks
        });
      });
    });
  });

  return router;
};
