var reg_name, reg_pass;
    var Client = Backbone.Model.extend({
        defaults: {
            name: null,
            pwd: null
        },
        initialize: function () {
            console.log("initialize client");
        }
    });
    var ClientsCollection = Backbone.Collection.extend({
        model: Client,
        initialize: function () {
            console.log("initialize clients collection");
            this.bind("add", function (model) { console.log("Add", model.get('id'), model); });
            this.bind("remove", function (el) { console.log("Remove", el.get('id'), el); });
        }
    });
    //Login and twitter feed display view
    var ClientView = Backbone.View.extend({
        el: $("#divTwitterFeed"), 
        initialize: function () {
            var that = this;
            this.listeClients = new ClientsCollection();
            this.listClients = new ClientsCollection();
            this.listeClients.bind("add", function (model) {
                that.addClientToList(model);
            });
            this.listClients.bind("add", function (model) {
            //supressed for now to skip registration process
            //that.addLoginToList(model);
            });
        },
        events: {
            'click #cmdAddClient': 'cmdAddClient_Click',
            'click #login': 'login',
            'keyup #txtSearch': 'search_click'
        },
        //Add login  uer/pwd to collection object.
        cmdAddClient_Click: function () {
            var tmpClient = new Client({
                name: $("#txtIdClient").val(),
                pwd: $("#txtNomClient").val(),
            });
            this.listeClients.add(tmpClient);
        }, 
        //Get logged user into local varaibels from model       
        addClientToList: function (model) {
            reg_name = model.get('name');
            reg_pass = model.get('pwd');
            $("#listeClient").html("<font size=5 color=green>You are Successfully Registered, Now you can Login</font>");
        },
        //Validate the logged in user with registered user info and verify.
        // We are not using this feature now, its over ridden by webserver authentication mode.
        addLoginToList: function (model) {;
            if (model.get('name') == reg_name && model.get('pwd') == reg_pass) {
                $("#divClientLogin").html("<font size=4 color=blue>Login sucessfull</font>");
            }
            else {
                $("#listeClient").html("<font size=5 color=green>Failed Logged in, Retry</font>");
            }
        },
        //Twitter feed search click functionlity.
        search_click: function(evt)
        {
          var searchText = $('#txtSearch') .val();
          this.fetchTwitterFeed(searchText) 
        },
        //Initial & Filter twitter feed 
        //Ajax call to webserver running on http://localhost:4000/login/
        fetchTwitterFeed: function (searchText) {
            var username = this.listClients.models[0].get("name");
            var password = this.listClients.models[0].get("pwd");
            var compositeKey = username + ":"+password;
            var basic_oauthToken = this.b64EncodeUnicode(compositeKey);
            var url;
            if(typeof searchText !== 'undefined') {
                url =  'http://localhost:4000/FetchTwitterFeed/search?q='+  searchText;   
            }
            else {
                url =  'http://localhost:4000/login/';
                
            }
            //Ajax call to Webserver.
            $.ajax({
                'type': 'GET',
                'headers': {'Authorization': 'Basic ' + basic_oauthToken},
                'url': url,                
                'crossDomain': 'true',
                'dataType': 'jsonp',
                'jsonp': 'false',
                'jsonpCallback': 'myJsonMethod',
                'contentType': 'application/json;charset=utf-8',
                'success': _.bind(function (response, status, xhr) {                    
                    console.log(response);                    
                    var currentTweets = response.statuses;
                    var htmlValue = '<table>' + this.generateTweetsHtml(response) + '</table>';
                    $(".panel-body").html(htmlValue);
                    $("#divClientLogin").addClass('hide');
                    $(".row").removeClass('hide');                
                }, this),
                'error': _.bind(function (response, status, xhr) {                    
                    console.log(response);                    
                    $("#listeClient").html("<font size=5 color=green>Failed Logged in, Retry</font>");
                }, this)
            }, this);
        },
        //convert from plain text to base64 encoded string.
        b64EncodeUnicode(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
        },
        //Login button functionality.
        //Accept user id and pwd and save it to model & add to collection object.
        //Set the time interval timer to 1 min to auto refresh twitter feed.
        login: function () {
            var self = this;
            var tmplogin = new Client({
                name: $("#txtIdClient").val(),
                pwd: $("#txtNomClient").val(),
            });
            this.listClients.reset();
            this.listClients.add(tmplogin);
            this.fetchTwitterFeed();

            //Setting the timer to fetch the twitter feed for every minute.
            setInterval(function() {
                self.fetchTwitterFeed();
            }, 60000);
            
        },
        myJsonMethod: function(jsondata) {
            console.log(jsondata);
        },
        //Building html UI for each feed.
        generateTweetsHtml: function(responseObj) {
            var currentTweets = responseObj.statuses;
            var htmlValue = '<table>';
            currentTweets.forEach(function(tweet) {
                htmlValue = htmlValue + '<tr><td style="background-image:url('+ tweet.user.profile_image_url + ');background-repeat:no-repeat;width: 50px;"</td>';
                htmlValue = htmlValue + '<td><table><tr><td><lable><b>' + tweet.user.name + '</b></lable>&nbsp;&nbsp;<lable>@'+tweet.user.screen_name + '</lable></td></tr>';
                htmlValue = htmlValue + '<tr><td>' + tweet.text + '</td></tr>';
                htmlValue = htmlValue + '<tr><td>' + tweet.created_at+ '</td></tr>';
                htmlValue = htmlValue + '<tr><td><lable>Retweet Count:&nbsp;</lable>' + tweet.retweet_count + '</td></tr></table></td></tr>';
            }, this);
            htmlValue = htmlValue+'</table>';
            return htmlValue;
        },
        //Date formatter to the date time in each feed.
        formatDate: function (date) {
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + " " + strTime;
        }
    });
    var clientView = new ClientView();
    Backbone.history.start();
