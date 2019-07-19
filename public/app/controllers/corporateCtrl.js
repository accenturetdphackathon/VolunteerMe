angular.module('corporateController', ['userServices', 'authServices'])
  .controller('corporateCtrl', function($timeout, $window, User, Auth) {

    var app = this;
    app.loading = true;
    app.empty = true;
    app.companies = [];
    app.bookmarks = [];

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

    this.openMoreInfoModal = function(companyId) {
      $("#moreInfoModal").modal({
        backdrop: 'static'
      });

      User.getCompanyInfo(companyId).then(function(data) {
        app.company = data.data.message;
        app.company.majorsList = "";
        app.company.industryList = "";
        app.company.bookmark;

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

        if (app.bookmarks.find(bookmark => bookmark._id === app.company._id) != undefined) {
          app.company.bookmark = true;
        } else {
          app.company.bookmark = false;
        }
      });
    };

    this.closeMoreInfoModal = function() {
      $('#moreInfoModal').modal('hide');
    };

    this.addBookmark = function(companyId) {
      User.addBookmark(companyId).then(function(data) {
        if (data.data.success) {
          app.company.bookmark = true;
          app.bookmarks.push(app.company)
        }
      });
    }

    this.removeBookmark = function(companyId) {
      User.removeBookmark(companyId).then(function(data) {
        if (data.data.success) {
          var bookmarkIds = data.data.message;
          app.company.bookmark = false;

          if (bookmarkIds.length > 0) {
            app.bookmarks = [];
            for (var i = 0; i < bookmarkIds.length; i++) {
              User.getBookmarkInfo(bookmarkIds[i]._id).then(function(data) {
                if (data.data.success) {
                  app.bookmarks.push(data.data.message);
                }
              });
            }
          } else {
            app.bookmarks = [];
          }
        }
      });
    };

    if (Auth.isLoggedIn()) {
      Auth.getUser().then(function(data) {
        var bookmarkIds = data.data.bookmarks;

        if (bookmarkIds.length > 0) {
          app.bookmarks = [];
          for (var i = 0; i < bookmarkIds.length; i++) {
            User.getBookmarkInfo(bookmarkIds[i]._id).then(function(data) {
              if (data.data.success) {
                app.bookmarks.push(data.data.message);
              }
            });
          }
        }
      });
    }

    User.getCompanies().then(function(data) {
      console.log(data.data.success);
      console.log(data.data.message.length);
      if (data.data.success) {
        app.loading = false;
        app.empty = false;

        for (var i = 0; i < data.data.message.length; i++) {
          var company = data.data.message[i];
          company.options = "";

          if (company.academia) {
            company.options += "academia, ";
          }

          if (company.government) {
            company.options += "government, ";
          }

          if (company.nonprofit) {
            company.options += "nonprofit, non-profit, ";
          }

          if (company.visa) {
            company.options += "visa, visa sponsorship, provides visa sponsorship, ";
          }

          if (company.sponsor) {
            company.options += "shpe uf sponsor, sponsor, shpe sponsor, ";
          }

          if (company.ipc) {
            company.options += "ipc, industry partnership council, ";
          }

          if (company.bbqFall) {
            company.options += "fall, bbq, bbq fall, fall bbq, bbq with industry, fall bbq with industry, ";
          }

          if (company.bbqSpring) {
            company.options += "spring, bbq, bbq spring, spring bbq, bbq with industry ,spring bbq with industry, ";
          }

          if (company.national) {
            company.options += "national, national convention, shpe national convention, "
          }

          app.companies.push(company);
        }
      }

      if (data.data.message.length == 0) {
        console.log("LINE 211");
        app.empty = true;
      }
    });
  });
