(function() {

    //initialize the canvas
    var canvas = document.createElement(navigator.isCocoonJS ? 'screencanvas' : 'canvas');
    var dpr = window.devicePixelRatio;
    var w= 960;
    var h = 640;
    canvas.width= w;
    canvas.height= h;

    var scale = Math.min(window.innerHeight/h,window.innerWidth/w);

    canvas.style.position = "absolute";
    canvas.style.width = (w * scale) + "px";
    canvas.style.height = (h * scale) + "px";
    canvas.style.left = (window.innerWidth * 0.5 - w * scale * 0.5) + "px";
    canvas.style.top = (window.innerHeight * 0.5 - h * scale * 0.5) + "px";

    document.body.appendChild(canvas);
    var ctx= canvas.getContext("2d");

    //some parameters
    var friendImages =  [] ;
    var MAX_FRIEND_IMAGES = 50;
    var menuReady = false;

    var gp = Cocoon.Social.GooglePlayGames;

    //clientId is not required in android
    var iosClientId = "273377255436-omilg308s7ev1jf4t6bspcrhae3odu3m.apps.googleusercontent.com";
    var webClientId = "273377255436-d8vme49kjo6bisprjp3lda82s2b6r097.apps.googleusercontent.com";

    gp.init({clientId: navigator.isCocoonJS ? iosClientId : webClientId,
             defaultLeaderboard:"CgkIjMC3tPoHEAIQAg"});

    //you can use the GP extension with the official API or use it with CocoonJS SocialGaming API
    var socialService = gp.getSocialInterface();

    socialService.setTemplates("js/templates/leaderboards.html", "js/templates/achievements.html");

    socialService.on("loginStatusChanged",function(loggedIn, error){

        console.log("onLoginStatusChanged: " + loggedIn + " " + socialService.isLoggedIn());
        //show or hide the menu depending on the login state
        if (loggedIn) {
            if (menuReady)
                Cocoon.App.showTheWebView();
        }
        else {
            if (menuReady)
                Cocoon.App.hideTheWebView();
        }

    });

    Cocoon.App.loadInTheWebView("WV.html",{
        success : function(){
            menuReady = true;
            if (socialService.isLoggedIn())
                Cocoon.App.showTheWebView();
        },
        error : function(){
            console.error("onLoadInTheWebViewFailed");
            menuReady = true;
        }
    });

//Menu methods
    window.menu = {

        showUserInfo: function() {

        },

        showFriends: function() {
            friendImages.length = 0;
            socialService.requestFriends(function(friends, error) {
                if (error) {
                    console.error("requestFriends error: " + error.message);
                }
                else {
                    for( var i = 0 ; i < friends.length && i < MAX_FRIEND_IMAGES ; ++i ) {
                        if (friends[i].userImage) {
                            var img = new Image() ;
                            img.src = friends[i].userImage;
                            friendImages.push( img ) ;
                        }
                        else {
                            socialService.requestUserImage(function(url, error) {
                                if (!error && url) {
                                    var img = new Image() ;
                                    img.src = url;
                                    friendImages.push( img ) ;
                                }
                            }, friends[i].userID, Cocoon.Social.ImageSize.MEDIUM);
                        }
                    }
                }

            });
        },

        publishAMessage: function() {
            // mediaURL, linkURL, linkText, linkCaption
            var message = new Cocoon.Social.Message(
                "Hello from the CocoonJS Launcher App! Are you a HTML5 game developer? Come and check out CocoonJS!",
                "https://cocoonjsadmin.ludei.com/static/images/cocoon_logo.png",
                "http://ludei.com",
                "Ludei & CocoonJS",
                "We love HTML5 games!");

            socialService.publishMessageWithDialog(message, function(error) {
                if (error) {
                    console.error("Error publishing message: " + error.message);
                }
            });
        },
        showLeaderboard: function() {
            socialService.showLeaderboard(function(error){
                if (error)
                    console.error("showLeaderbord error: " + error.message);
            });

        },
        showAchievements: function() {
            socialService.showAchievements(function(error){
                if (error)
                    console.error("showAchievements error: " + error.message);
            });

        },
        logout: function() {
            socialService.logout(function(error){
                //friendImages = [];
                //if (error)
                    //console.error("logout error: " + error.message);
            });
        }
    }

    /**
     * render code
     */
    var frame = 0;
    function render() {

        var loggedIn = socialService.isLoggedIn();

        if (loggedIn && menuReady)
        {
            frame++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for( var i = 0 ; i < friendImages.length ; ++i)
            {
                var fx = canvas.width  / 2 + 0.5*(i/2+1) * canvas.width  * 0.05 * Math.sin( frame * 0.001 * i/2 + Math.PI * (i%2) ) ;
                var fy = canvas.height / 2 + 0.5*(i/2+1) * canvas.height * 0.05 * Math.cos( frame * 0.001 * i/2 + Math.PI * (i%2) ) ;

                ctx.drawImage(friendImages[i],fx,fy);
            }
        }
        else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle="White";
            ctx.font = "30pt Arial";
            ctx.textAlign = "center";
            if (loggedIn) {
                ctx.fillText("Logged in. Creating menu...", canvas.width/2, canvas.height/2);
            }
            else {
                ctx.fillText("Logged out. Click to log in.", canvas.width/2, canvas.height/2);
            }
        }
    }

    function processTouch() {
        if (!socialService.isLoggedIn()) {
            socialService.login(function(loggedIn, error) {
                if (error) {
                    console.error("login error: " + error.message + " " + error.code);
                }
                else if (loggedIn) {
                    Cocoon.App.showTheWebView();
                }
                else {
                    console.log("login cancelled");
                }
            });
        }
    }

    canvas.addEventListener( "mousedown", processTouch);
    canvas.addEventListener( "touchstart", processTouch);

    setInterval(render, 1000/60);

})();


