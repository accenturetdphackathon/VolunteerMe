angular.module('adminController', ['userServices'])
  .controller('adminCtrl', function($timeout, $route, $window, $scope, $filter, $http, fileReader, User) {

    var app = this;
    app.accessDenied = true;
    app.showCreateEventModal = true;
    app.showEventInfoModal = true;
    app.isClicked = false;
    app.eventName;
    app.companyName;

    app.majors = [
      "Aerospace Engineering",
      "Agricultural & Biological Engineering",
      "Biomedical Engineering",
      "Chemical Engineering",
      "Civil Engineering",
      "Coastal & Oceanographic Engineering",
      "Computer Engineering",
      "Computer Science",
      "Digital Arts & Sciences",
      "Electrical Engineering",
      "Environmental Engineering Sciences",
      "Human-Centered Computing",
      "Industrial & Systems Engineering",
      "Materials Science & Engineering",
      "Mechanical Engineering",
      "Nuclear Engineering",
      "Other"
    ];

    app.industries = [
      "Aeronautical/Aerospace/Aviation",
      "Agriculture",
      "Automotive",
      "Banking",
      "Biomedical",
      "Biotechnology",
      "Capital Goods/Machinery",
      "Chemical",
      "Computer Hardware",
      "Conglomerate",
      "Construction",
      "Consulting",
      "Consumer Goods",
      "Defense",
      "Electronics",
      "Energy",
      "Financial Services",
      "Food Processing",
      "Government",
      "Healthcare",
      "Hydraulics",
      "Hygiene/Sanitation",
      "Information Technology",
      "Insurance",
      "Law/Legal",
      "Manufacturing",
      "Materials",
      "Medical Supplies",
      "Pharmaceuticals",
      "Recruiting/Staffing",
      "Research/Development",
      "Retail",
      "Safety",
      "Security",
      "Semiconductors",
      "Social Media",
      "Software Development",
      "Telecommunications",
      "Transportation",
      "Utilities",
      "Other"
    ];

    var orderBy = $filter('orderBy');

    $scope.imageSrc = "";

    $scope.$on("fileProgress", function(e, progress) {
      $scope.progress = progress.loaded / progress.total;
    });

    this.createEvent = function(eventData) {
      app.successMsg = false;
      app.errorMsg = false;

      User.createCode(app.eventData).then(function(data) {
        if (data.data.success) {
          app.successMsg = "Success! Event created!";
          app.codes.push(data.data.message);
          app.showCreateEventModal = false;
        } else {
          app.errorMsg = data.data.message;
        }
      });
    };

    this.manualInput = function(member) {
      app.successMsg = '';
      app.errorMsg = '';


      var manualInput = {
        member: null,
        eventId: null
      };

      manualInput.member = app.member;
      manualInput.eventId = app.eventName._id;

      User.manualInput(manualInput).then(function(data) {
        if (data.data.success) {
          app.successMsg = data.data.message;
        } else {
          app.errorMsg = data.data.message;
        }
      });
    };

    this.acceptRequest = function(approveData) {
      app.isClicked = true;
      User.approveRequest(approveData).then(function(data) {
        $window.location.reload();
      });
    };

    this.denyRequest = function(denyData) {
      app.isClicked = true;
      User.denyRequest(denyData).then(function(data) {
        $window.location.reload();
      });
    };

    this.excel = function(eventId) {
      console.log(eventId);
      User.getExcelDoc(eventId).then(function(data) {
        var hiddenElement = document.createElement('a');
        hiddenElement.href = "data:attachment/csv," + encodeURI(data.data);
        hiddenElement.target = "_blank";
        hiddenElement.download = eventId + ".csv";
        hiddenElement.click();
      });
    };

    this.openCreateEventModal = function() {
      app.errorMsg = false;
      app.successMsg = false;

      $("#createEventModal").modal({
        backdrop: 'static',
        keyboard: false
      });

      app.showCreateEventModal = true;
    };

    this.closeCreateEventModal = function() {
      $('#createEventModal').modal('hide');
    };

    this.openEventInfoModal = function(eventData) {
      $("#eventInfoModal").modal({
        backdrop: 'static',
        keyboard: false
      });

      app.eventName = eventData.name;
      app.eventId = eventData._id;

      User.getAttendance(eventData._id).then(function(data) {
        app.attendance = data.data.message;
      });

      app.showEventInfoModal = true;
    };

    this.closeEventInfoModal = function() {
      $('#eventInfoModal').modal('hide');
    };

    this.openManualInputModal = function(eventData) {
      app.successMsg = false;
      app.errorMsg = false;
      app.eventName = eventData;

      $("#manualInputModal").modal({
        backdrop: 'static',
        keyboard: false
      });
    }

    this.closeManualInputModal = function(member) {
      $('#manualInputModal').modal('hide');

      if (app.member) {
        app.member.userName = '';
      }

      app.errorMsg = false;
      app.successMsg = false;
    };

    this.openUserInfoModal = function(data) {
      $("#userEventsModal").modal({
        backdrop: 'static',
        keyboard: false
      });

      app.UserName = data;
      app.showEventsModal = true;

      User.getUserInfo(data).then(function(userData) {
        app.eventArray = [];
        if (userData.data.success) {
          app.user = userData.data.message[0];
          if (app.user.events.length > 0) {
            for (var i = 0; i < app.user.events.length; i++) {
              User.getCodeInfo(app.user.events[i]._id).then(function(eventsInfo) {
                if (eventsInfo.data.success) {
                  app.eventArray.push(eventsInfo.data.message);
                }
              });
            };
          }
        }
      });
    };

    this.closeUserInfoModal = function() {
      app.UserName = false;
      app.eventArray = [];
      $('#userEventsModal').modal('hide');
    };

    this.openAddCompanyModal = function() {
      app.addCompanySuccessMsg = false;
      app.addCompanyErrorMsg = false;
      $("#addCompanyModal").modal({
        backdrop: 'static',
        keyboard: false
      });
    }

    this.closeAddCompanyModal = function() {
      $('#addCompanyModal').modal('hide');
      app.addCompanySuccessMsg = false;
      app.addCompanyErrorMsg = false;
    }

    this.addCompany = function(companyData) {
      app.addCompanySuccessMsg = false;
      app.addCompanyErrorMsg = false;

      if (!companyData || companyData == null || companyData == undefined) {
        app.addCompanyErrorMsg = "Make sure you filled out the entire form!";
      } else {
        if (!companyData.logo || companyData.logo == null || companyData.logo == undefined || companyData.logo == "") {
          app.addCompanyErrorMsg = "The logo file you uploaded was empty."
        } else {
          var fileFormat = companyData.logo.substring(11, 15);
          fileFormat[fileFormat.length - 1] == ';' ? fileFormat = companyData.logo.substring(11, 14) : fileFormat;
          console.log("fileFormat: " + fileFormat);

          if (fileFormat == "jpeg" || fileFormat == "png" || fileFormat == "bmp" || fileFormat == "gif") {
            var src = companyData.logo;
            var base64Length = src.length - (src.indexOf(',') + 1);
            var padding = (src.charAt(src.length - 2) === '=') ? 2 : ((src.charAt(src.length - 1) === '=') ? 1 : 0);
            var fileSize = base64Length * 0.75 - padding;

            if (fileSize > 100000) {
              app.addCompanyErrorMsg = "Logo file too large, please upload smaller file."
            } else {
              User.addCompany(companyData).then(function(data) {
                if (data.data.success) {
                  app.addCompanySuccessMsg = data.data.message;
                  app.addCompanyErrorMsg = false;
                  $timeout(function() {
                    $window.location.reload();
                  }, 1000);
                } else {
                  app.addCompanySuccessMsg = false;
                  app.addCompanyErrorMsg = data.data.message;
                }
              });
            }
          } else {
            app.addCompanyErrorMsg = "The logo file you loaded had the wrong file type, please use a .jpg, .jpeg, .png, .gif, or .bmp file."
          }
        }
      }
    }

    this.openEditCompanyModal = function(companyId) {
      User.getCompanyInfo(companyId).then(function(companyData) {
        if (companyData.data.success) {
          app.editCompanySuccessMsg = false;
          app.editCompanyErrorMsg = false;
          app.editCompanyData = companyData.data.message;
          $("#editCompanyModal").modal({
            backdrop: 'static',
            keyboard: false
          });
          $('#nonprofitSwitch').prop('indeterminate', true)
        }
      });
    }

    this.closeEditCompanyModal = function() {
      $('#editCompanyModal').modal('hide');
      app.editCompanySuccessMsg = false;
      app.editCompanyErrorMsg = false;
    }

    this.openRemoveCompanyModal = function(companyName) {
      app.companyName = companyName;

      $("#removeCompanyModal").modal({
        backdrop: 'static',
        keyboard: false
      });
    };

    this.closeRemoveCompanyModal = function() {
      $('#removeCompanyModal').modal('hide');
    };

    this.removeCompany = function(companyName) {
      app.removeCompanySuccessMsg = false;
      app.removeCompanyErrorMsg = false;

      User.removeCompany(companyName).then(function(data) {
        console.log(data.data);
        if (data.data.success) {
          app.removeCompanySuccessMsg = data.data.message;
          app.removeCompanyErrorMsg = false;

          $timeout(function() {
            $window.location.reload();
          }, 1000);
        } else {
          app.removeCompanySuccessMsg = false;
          app.removeCompanyErrorMsg = data.data.message;
        }
      });
    };


    this.openCompanyInfoModal = function(companyId) {
      $("#moreInfoModal").modal({
        backdrop: 'static'
      });

      User.getCompanyInfo(companyId).then(function(data) {
        app.company = data.data.message;
        app.company.majorsList = "";
        app.company.industryList = "";

        for (var i = 0; i < app.company.majors.length; i++) {
          if (i === app.company.majors.length - 1) {
            app.company.majorsList += app.company.majors[i];
          } else {
            app.company.majorsList += (app.company.majors[i] + ", ");
          }
        }

        for (var i = 0; i < app.company.industry.length; i++) {
          if (i === app.company.industry.length - 1) {
            app.company.industryList += app.company.industry[i];
          } else {
            app.company.industryList += (app.company.industry[i] + ", ");
          }
        }
      });
    };

    this.closeCompanyInfoModal = function() {
      $('#moreInfoModal').modal('hide');
    };

    this.changePermission = function(username, permissiontype) {
      var userData = {
        username: username,
        permission: permissiontype
      };
      User.changeUserPermission(userData).then(function(data) {
        if (data.data.success == true)
          app.user.permission = permissiontype;
        User.getUsers().then(function(data) {
          app.users = data.data.message;
        });
      });
    };

    User.getUsers().then(function(data) {
      if (data.data.success) {
        if (data.data.permission === 'admin') {
          app.users = data.data.message;
          app.accessDenied = false;
        } else {
          app.errorMsg = 'Insufficient permission';
        }
      } else {
        app.errorMsg = data.data.message;
      }
    });

    User.getCodes().then(function(data) {
      if (data.data.success) {
        if (data.data.permission === 'admin') {
          app.codes = data.data.message;
          app.accessDenied = false;
        } else {
          app.errorMsg = 'Insufficient permission';
        }
      } else {
        app.errorMsg = 'Insufficient permission';
      }
    });

    User.getRequests().then(function(data) {
      if (data.data.success) {
        app.requests = data.data.message;
      }
    });

    User.getCompanies().then(function(data) {
      if (data.data.success) {
        app.companies = data.data.message;
      }
    });

    this.sortBy = function(propertyName, array) {
      $scope.reverse = (propertyName !== null && $scope.propertyName === propertyName) ?
        !$scope.reverse : false;
      $scope.propertyName = propertyName;
      app.users = orderBy(array, $scope.propertyName, $scope.reverse);
    };
  })

  .directive('ngFileSelect', function(fileReader, $timeout) {
    return {
      scope: {
        ngModel: '='
      },
      link: function($scope, el) {
        function getFile(file) {
          console.log(file);
          if (file == undefined) {
            $scope.ngModel = undefined;
          } else {
            fileReader.readAsDataUrl(file, $scope)
              .then(function(result) {
                console.log(result);
                $timeout(function() {
                  $scope.ngModel = result;
                });
              });
          }
        }

        el.bind("change", function(e) {
          var file = (e.srcElement || e.target).files[0];
          getFile(file);
        });
      }
    };
  })

  .factory('fileReader', function($q, $log) {
    var onLoad = function(reader, deferred, scope) {
      return function() {
        scope.$apply(function() {
          deferred.resolve(reader.result);
        });
      };
    };

    var onError = function(reader, deferred, scope) {
      return function() {
        scope.$apply(function() {
          deferred.reject(reader.result);
        });
      };
    };

    var onProgress = function(reader, scope) {
      return function(event) {
        scope.$broadcast("fileProgress", {
          total: event.total,
          loaded: event.loaded
        });
      };
    };

    var getReader = function(deferred, scope) {
      var reader = new FileReader();
      reader.onload = onLoad(reader, deferred, scope);
      reader.onerror = onError(reader, deferred, scope);
      reader.onprogress = onProgress(reader, scope);
      return reader;
    };

    var readAsDataURL = function(file, scope) {
      var deferred = $q.defer();

      var reader = getReader(deferred, scope);
      reader.readAsDataURL(file);

      return deferred.promise;
    };

    return {
      readAsDataUrl: readAsDataURL
    };
  });
