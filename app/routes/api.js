require('dotenv').config();

// MODEL FILES
var User = require('../models/user');
var Event = require('../models/code');
var Request = require('../models/request');
var Alumni = require('../models/alumni');
var Company = require('../models/company');
var Org = require('../models/organization');

// NPM PACKAGES
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
var nodeGeocoder = require('node-geocoder');
var Json2csvParser = require('json2csv').Parser;
var moment = require('moment');

var user = "";

// MISCELLANEOUS
var fs = require('fs');
var secret = "tacobell";

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

  // ENDPOINT TO CREATE/REGISTER USERS
  router.post('/users', function(req, res) {
    var user = new User();
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;

    if (req.body.username == null || req.body.password == null || req.body.email == null || req.body.firstName == null || req.body.lastName == null || req.body.username == '' || req.body.password == '' || req.body.email == '' || req.body.firstName == '' || req.body.lastName == '') {
      res.json({
        success: false,
        message: 'Make sure you filled out the entire form!'
      });
    } else {
      user.save(function(err) {
        console.log("=== LINE 53 ===");
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

  router.post('/createorg', function(req, res) {
    var org = new Org();
    org.name = req.body.name;
    org.email = req.body.email;
    org.website = req.body.website;
    org.phone = req.body.phone;
    org.description = req.body.description;
    org.category = req.body.category;
    org.address = req.body.address;
    org.city = req.body.city;
    org.state = req.body.state;
    org.zip = req.body.zip;
    org.username = req.body.username;
    org.password = req.body.password;
    org.logo = req.body.logo;

    org.save(function(err) {
      if (err)
        throw err;

      else {
        res.json({
          success: true,
          message: "Organization successfully created"
        })
      }
    });

  });

  // ENDPOINT TO CREATE EVENT CODES
  router.post('/codes', function(req, res) {
    moment().format();

    console.log(moment(req.body.date, "MM-DD-YY"));
    console.log(moment(req.body.date + " " + req.body.start, "MM-DD-YY h:mm a"));
    console.log(moment(req.body.date + " " + req.body.end, "MM-DD-YY h:mm a"));

    var event = new Event();
    event.name = req.body.name;
    event.description = req.body.description;
    event.date = moment(req.body.date, "MM-DD-YY");
    event.start = moment(req.body.date + " " + req.body.start, "MM-DD-YY h:mm a");
    event.end = moment(req.body.date + " " + req.body.end, "MM-DD-YY h:mm a");
    event.orgId = user;

    console.log(event);

    event.save(function(err) {
      if (err) {
        throw err;
      } else {
        res.json({
          success: true,
          message: event
        });
      }
    });
  });

  // ENDPOINT TO SIGN IN AND AUTHENTICATE USER
  router.post('/authenticate', function(req, res) {
    User.findOne({
      username: req.body.username
    }).select().exec(function(err, user) {
      if (err) throw err;

      if (!user) {

        Org.findOne({
          username: req.body.username
        }).select().exec(function(err, org) {
          if (err) throw err;

          if (!org) {
            res.json({
              success: false,
              message: 'Organization not found'
            });
          } else {
            var validPassword = org.comparePassword(req.body.password);

            if (!validPassword) {
              res.json({
                success: false,
                message: 'Wrong password'
              });
            } else {

              var token = jwt.sign({
                username: org.username,
                email: org.email,
                id: org._id
              }, secret, {
                expiresIn: '1h'
              });

              res.json({
                success: true,
                message: 'Organization authenticated',
                token: token
              });
            }
          }
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
              email: user.email,
              id: user._id
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
          id: org._id
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
    if (req.decoded.username == 'shpeuf') {
      Org.findOne({
        username: req.decoded.username
      }).select().exec(function(err, org) {
        res.send(org);
      });
    } else {
      User.findOne({
        username: req.decoded.username
      }).select().exec(function(err, user) {
        res.send(user);
      });
    }
  });

  // ENDPOINT TO RENEW THE USER TOKEN
  router.get('/renewtoken/:username', function(req, res) {
    User.findOne({
      username: req.params.username
    }).select().exec(function(err, user) {
      if (!user) {

        Org.findOne({
          username: req.decoded.username
        }).select().exec(function(err, user) {
          var newToken = jwt.sign({
            username: user.username,
            email: user.email,
            id: user._id
          }, secret, {
            expiresIn: '1h'
          });
          res.json({
            success: true,
            token: newToken
          });
        });

        res.json({
          success: false,
          message: 'No user was found'
        });
      } else {
        var newToken = jwt.sign({
          username: user.username,
          email: user.email,
          id: user._id
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
        Org.findOne({
          username: req.decoded.username
        }, function(err, org) {
          if (err) throw err;

          if (!org) {
            res.json({
              success: false,
              message: 'User not found'
            });
          } else {
            console.log(org.permission);
            res.json({
              success: true,
              message: org.permission
            })
          }
        })
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
    user = req.decoded.username;

    User.find({
      bookmarks: user
    }, function(err, users) {
      if (err) throw err;
      Org.findOne({
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
    Event.find({
      orgId: user
    }, function(err, events) {
      if (err) throw err;
      Org.findOne({
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
    Org.findOneAndUpdate({
      name: req.body.org
    }, {
      $inc: {
        points: req.body.points
      }
    },function (err, org) {

      if (org) {
        console.log(req.decoded);
        User.findOneAndUpdate({
          username: req.decoded.username
        }, {
          $push: {
            donations: {
              "org": req.body.org,
              "points": req.body.points
            }
          },
          $inc: {
            donated: req.body.points
          }
        }, function(err, user) {

          console.log(user);

          res.json({
            success: true,
            message: "Success! Thank you for your donation!"
          })
        })
      }
    })
  });

  // ENDPOINT TO GRAB EVENT CODE INFORMATION FOR INDIVIDUAL USERS
  router.get('/getcodeinfo/:code', function(req, res) {
    Event.findOne({
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
    console.log(req.body);
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

        var validPassword = user.comparePassword(req.body.member.password);

        console.log(validPassword);

        if (validPassword) {
          User.findOneAndUpdate({
            username: user.username
          }, {
            $push: {
              events: {
                _id: req.body.eventId
              }
            },
            $inc: {
              points: 10
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
                message: "Success! Points added!"
              });
            }
          });
        }
      }
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

  router.get('/getcompanies/', function(req, res) {
    Org.find({

    }, function(err, company) {
      if (err) throw err;

      res.json({
        success: true,
        message: company
      })
    })
  });

  router.get('/getcompanyinfo/:companyId', function(req, res) {
    Org.findOne({
      username: req.params.companyId
    }, function(err, company) {
      if (err) throw err;

      res.json({
        success: true,
        message: company
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
        if (req.body.companyId == user.bookmarks[i]) {
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
    Org.findOne({
      username: req.params.companyId
    }, function(err, company) {
      if (err) throw err;

      res.json({
        success: true,
        message: company
      });
    });
  });

  router.put('/removebookmark/:companyId', function(req, res) {
    console.log("COMPANY ID:");
    console.log(req.params.companyId);
    User.updateOne({
      username: req.decoded.username
    }, {
      $pullAll: {
        bookmarks: [req.params.companyId]
      }
    }, function(err, user) {
      if (err) throw err;

      if (user) {
        User.findOne({
          username: req.decoded.username
        }, function(err, updatedUser) {
          if (err) throw err;

          console.log(updatedUser);

          res.json({
            success: true,
            message: updatedUser.bookmarks
          });
        });
      }
    });
  });

  return router;
};
