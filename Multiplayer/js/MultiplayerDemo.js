(function(){
    //INITIALIZE CANVAS
    var assets = null;
    var canvas = document.createElement(navigator.isCocoonJS ? 'screencanvas' : 'canvas');
    var dpr = window.devicePixelRatio;
    var w = window.innerWidth;
    var h = window.innerHeight;

    canvas.width= w;
    canvas.height= h;

    var scale = Math.min(window.innerHeight/h,window.innerWidth/w);

    canvas.style.position = "absolute";
    canvas.style.width = (w * scale) + "px";
    canvas.style.height = (h * scale) + "px";
    canvas.style.left = (window.innerWidth * 0.5 - w * scale * 0.5) + "px";
    canvas.style.top = (window.innerHeight * 0.5 - h * scale * 0.5) + "px";

    document.body.appendChild(canvas);

    var canvas_width = parseInt(w);
    var canvas_height = parseInt(h);

    ctx = canvas.getContext("2d");

    //GAME MODEL

    var boardSize = 0.85 * 500;

    var GAMESTATES = {
        STATE_IDLE:0,
        STATE_CREATING_MATCH:1,
        STATE_WAITING_FOR_PLAYERS:2,
        STATE_PLAYING:3,
        STATE_SCORES:4
    };

    function TicTacToeGameModel()
    {
        this.oTokens = [[0,0,0],[0,0,0],[0,0,0]];
        this.xTokens = [[0,0,0],[0,0,0],[0,0,0]];
        this.boardRect = {x: canvas_width/2 - boardSize/2, y: canvas_height/2-boardSize/2, w:boardSize, h:boardSize };
        this.players = [];
        this.playerTurn = 0;
        this.state = GAMESTATES.STATE_IDLE;
        this.isMultiplayerGame = false;
        this.localUserScore = 0;

        return this;
    }

    TicTacToeGameModel.prototype =
    {
        initGame: function(playersInfo, services) {
            this.oTokens = [[0,0,0],[0,0,0],[0,0,0]];
            this.xTokens = [[0,0,0],[0,0,0],[0,0,0]];
            this.players = playersInfo.slice();
            this.playerTurn = 0;
            this.playerTokenSelector= 0;

            //order players by ID to sync multiplayer turn order
            this.players.sort(function(a,b) {return a.userID  < b.userID ? -1 : 1;} );


            //get the references to each multiplayer match instance
            for (var i = 0; i < this.players.length; ++i) {
                this.players[i].match = null;
                for (var j = 0; j < services.length; ++j) {
                    if (services[j] && services[j].getMatch().getLocalPlayerID() === this.players[i].userID ) {
                        this.players[i].match = services[j].getMatch();
                    }
                }
            }

            //Only the first players sends a random value to determine the turn and tokens for each player
            if (this.players[0].match != null) {
                var firstTurn = Math.random() < 0.5 ? 0 : 1;
                var firstPlayerTokens = Math.random() < 0.5 ? 0 : 1;
                this.players[0].match.sendDataToAllPlayers(JSON.stringify(["turn",firstTurn, firstPlayerTokens]));
            }
        },

        nextTurn: function() {
            this.playerTurn = (this.playerTurn+1) %2;
        },

        isLocalPlayerTurn: function() {
            return !!this.players[this.playerTurn].match;
        },

        isPlayerTurn: function(index){
            return this.playerTurn === index;
        },

        getPlayerAlias: function(index) {
            return this.players[index].userName;
        },

        getPlayerTokens: function(index) {
            if (this.playerTokenSelector == 0) return index == 0 ? this.xTokens : this.oTokens;
            if (this.playerTokenSelector == 1) return index == 1 ? this.xTokens : this.oTokens;
        },
        getPlayerTokensSymbol: function(index) {
            return this.getPlayerTokens(index) === this.xTokens ? "X" : "O";
        },
        putToken: function(row, col) {
            console.log("putToken " + row + " " + col);
            if (this.isLocalPlayerTurn() && this.oTokens[row][col] ===0 && this.xTokens[row][col] ===0 &&  this.state === GAMESTATES.STATE_PLAYING) {
                var message = JSON.stringify(["token",row,col]);
                console.log("sent message: " + message);
                this.players[this.playerTurn].match.sendDataToAllPlayers(message);
            }
        },

        tokenMessageReceived: function(row,col,playerID) {
            var tokens = this.getPlayerTokens(this.playerTurn);
            console.log("tokenMessageReceived: " + row + " " + col);
            tokens[row][col] = 1;
            if (this.checkWinnerTokens()) {

                this.state = GAMESTATES.STATE_SCORES;
                var me = this;
                setTimeout(function(){me.showWinAnimation()},100);

                //send scores only if it is a multiplayer match and the local player is the winner
                if (this.isMultiplayerGame && this.isLocalPlayerTurn() && socialService) {
                    this.localUserScore+=100;
                    console.log("submitScore " + this.localUserScore);
                    socialService.submitScore(this.localUserScore, function(error) {
                        if (error) {
                            console.error("Error submitting score: " + error);
                        }
                        else {
                            console.log("Score submitted!");
                        }
                    });
                }
            }
            else if (this.checkTieGame()) {
                this.state = GAMESTATES.STATE_SCORES;
                var me = this;
                setTimeout(function(){me.showTieAnimation()},100);
                if (this.isMultiplayerGame && socialService) {
                    this.localUserScore+=10;
                    console.log("submitScore " + this.localUserScore);
                    socialService.submitScore(this.localUserScore, function(error) {
                        if (error) {
                            console.error("Error submitting score: " + error);
                        }
                        else {
                            console.log("Score submitted!");
                        }
                    });
                }
            }
            else
            {
                this.nextTurn();
            }

        },

        firstTurnMessageReceived: function(firstTurn, firstPlayertokens) {
            this.playerTurn = firstTurn;
            this.playerTokenSelector = firstPlayertokens;

            this.state = GAMESTATES.STATE_PLAYING;
        },

        checkWinnerTokens: function(tokens) {
            var tokens = this.getPlayerTokens(this.playerTurn);

            //vertical and horizontal lines
            for (var i = 0; i < 3; ++i) {
                if (tokens[i][0] === 1 && tokens[i][1] === 1 && tokens[i][2] === 1) return true;
                if (tokens[0][i] === 1 && tokens[1][i] === 1 && tokens[2][i] === 1) return true;
            }

            //diagonal lines
            if (tokens[0][0] === 1 && tokens[1][1] ===1 && tokens[2][2] === 1) return true;
            if (tokens[0][2] === 1 && tokens[1][1] ===1 && tokens[2][0] === 1) return true;

            return false;
        },

        checkTieGame: function() {

            var n = 0;
            for (var i = 0; i< 3; ++i) {
                for (var j = 0; j < 3; ++j ) {
                    if (this.xTokens[i][j] === 1) n++;
                    if (this.oTokens[i][j] === 1) n++;
                }
            }

            return n >=9;
        },

        showWinAnimation: function() {
            alert(this.players[this.playerTurn].userName + " Wins");
        },
        showTieAnimation: function() {
            alert("Tie game");
        },

        disconnect: function(sendMessage) {
            readyToPlay = false;
            this.state = GAMESTATES.STATE_IDLE;
            for (var i = 0; i < this.players.length; ++i) {
                if (this.players[i].match != null){
                    if (sendMessage){
                        this.players[i].match.sendDataToAllPlayers(JSON.stringify(["exit"]));
                        this.players[i].match.disconnect();
                    }
                }
            }
        }
    };

    var model = new TicTacToeGameModel();

    //var socialService = Cocoon.Social.GameCenter.getSocialInterface();
    //var multiplayerService = socialService ? Cocoon.Multiplayer.GameCenter : null;

    var socialService = null;
    var multiplayerService = null;
    var usingGameCenter = false; //hint used to show Game cetner Disabled errors;

    if (Cocoon.Social.GameCenter.nativeAvailable) {
        var gc = Cocoon.Social.GameCenter;
        socialService = gc.getSocialInterface();
        multiplayerService = gc.getMultiplayerInterface();
        usingGameCenter = true;
    }
    else if (Cocoon.Social.GooglePlayGames.nativeAvailable) {
        var gp = Cocoon.Social.GooglePlayGames;
        //clientId parameter is not required in android
        gp.init({defaultLeaderboard:"CgkIjMC3tPoHEAIQAg"});
        socialService = gp.getSocialInterface();
        multiplayerService = gp.getMultiplayerInterface();
    }

    var loopbackServices = [new Cocoon.Multiplayer.LoopbackService(),new Cocoon.Multiplayer.LoopbackService()];


    if (multiplayerService) {

        multiplayerService.on("invitation",{
            received : function(){
                console.log("Invitation received");
                if (model.state !== GAMESTATES.STATE_IDLE) {
                    //simulate exit click
                    processGameTouch(0,canvas_height);
                }
                model.state = GAMESTATES.STATE_CREATING_MATCH;
            },
            loaded : function(match, error){
                console.log("Invitation ready: (Error: + " + JSON.stringify(error) + ")");
                model.isMultiplayerGame = true;
                handleMatch(match,error);
            }
        });
    }

    function handleMatch(match, error) {

        if (!match) {
            model.state = GAMESTATES.STATE_IDLE;
            console.log(error ? error.message : "match canceled");
            return;
        }

        console.log("match found");
        model.state = GAMESTATES.STATE_WAITING_FOR_PLAYERS;


        var requestPlayersCallback = function(players, error) {
            if (error) {
                alert("requestPlayersInfo:" + error.message);
                model.state = GAMESTATES.STATE_IDLE;
                return;
            }
            console.log("Received players info: " + JSON.stringify(players));
            model.initGame(players, model.isMultiplayerGame ? [multiplayerService] : loopbackServices);
            match.start();
        };

        match.on("match",{
            dataReceived : function(match, data, playerID){

                console.log("received Data: " + data  + " from Player: " + playerID);
                var messsage = JSON.parse(data);

                if (messsage[0] === "token") {
                    model.tokenMessageReceived(messsage[1], messsage[2], playerID);
                }
                else if (messsage[0] === "exit" && model.state === GAMESTATES.STATE_PLAYING && model.isMultiplayerGame) {
                    alert("Opponent disconnected");
                    model.disconnect(false);
                }
                else if (messsage[0] === "turn") {
                    model.firstTurnMessageReceived(messsage[1],messsage[2]);
                }
            },
            stateChanged : function(match, player, state){
                console.log("onMatchStateChanged: " + player + " " + state);

                if (model.state == GAMESTATES.STATE_WAITING_FOR_PLAYERS && match.getExpectedPlayerCount() == 0) {
                    match.requestPlayersInfo(requestPlayersCallback);
                }
            },
            connectionWithPlayerFailed : function(match, player, error){
                alert("onMatchConnectionWithPlayerFailed: " + player + " " + error);
                model.disconnect(false);
            },
            failed : function(match, error){
                console.error("onMatchFailed " +  error);
                model.disconnect(false);
            }
        });

        // The match might be returned before connections have been established between players. At this stage, all the players are in the process of connecting to each other.
        // Always check the getExpectedPlayerCount value before starting a match. When its value reaches zero, all expected players are connected, and your game can begin the match.
        // If expectedPlayerCount > 0 waint until onMatchStateChanged events
        if (match.getExpectedPlayerCount() == 0) {
            match.requestPlayersInfo(requestPlayersCallback);
        }
    }

    var waitingLogin = false;
    function loginSocialService(autoLogin) {
        if (!socialService)
            return;

        if (!waitingLogin) {
            waitingLogin = true;
            socialService.login(function(loggedIn, error){
                if (!loggedIn || error) {
                    console.error("Login failed: " + JSON.stringify(error));
                    //Tell the user that Game Center is Disabled
                    if (!autoLogin && error.code == 2 && usingGameCenter) {
                        Cocoon.Dialog.confirm({
                            title : "Game Center Disabled",
                            message : "Sign in with the Game Center application to enable it",
                            confirmText : "Ok",
                            cancelText : "Cancel"
                        }, function(accepted){
                            if(accepted) Cocoon.App.openURL("gamecenter:");
                        });
                    }
                }

                waitingLogin = false;
            });

        }
    }

//Social Service Login and Score Listeners
    if (socialService) {
        socialService.on("loginStatusChanged",function(loggedIn, error){
            if (loggedIn) {
                console.log("Logged into social service");
                socialService.requestScore(function(score, error){
                    if (error) {
                        console.error("Error getting user score: " + error.message);
                    }
                    else if (score) {
                        console.log("score: " + score.score);
                        model.localUserScore = score.score;
                    }
                });
            }
        });

        loginSocialService(true);
    }

//RENDER


    function renderCreateMatch()
    {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas_width, canvas_height);
        ctx.fillStyle="black";
        ctx.strokeStyle = "black";
        var fontSize = (canvas_width * 0.3) << 0 ;
        if (fontSize > 30) fontSize = 30;
        ctx.font = fontSize + "px Helvetica";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("Multiplayer", canvas_width * 0.25, canvas_height * 0.49);
        ctx.textBaseline = "top";
        ctx.fillText("Match", canvas_width * 0.25, canvas_height * 0.51);
        ctx.textBaseline = "bottom";
        ctx.fillText("Local", canvas_width * 0.75, canvas_height * 0.49);
        ctx.textBaseline = "top";
        ctx.fillText("Match", canvas_width * 0.75, canvas_height * 0.51);
        ctx.beginPath();
        ctx.arc(canvas_width * 0.25, canvas_height/2, canvas_width * 0.15, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(canvas_width * 0.75, canvas_height/2, canvas_width * 0.15, 0, Math.PI * 2, true);
        ctx.stroke();

        ctx.textBaseline = "bottom";
        ctx.textAlign = "left";
        if (waitingLogin) {
            ctx.fillText("Logging in...", canvas_width * 0.01, canvas_height * 0.99);
        }
        else if (socialService && socialService.isLoggedIn()) {
            ctx.fillText("Logged In", canvas_width * 0.01, canvas_height * 0.99);
        }
    }

    function renderCreatingMatch()
    {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas_width, canvas_height);
        ctx.fillStyle="black";
        ctx.font = "20pt Helvetica";
        ctx.textAlign = "center";
        ctx.fillText("Searching players for the match...", canvas_width/2, canvas_height/2);
        renderExitButton();
    }

    function renderWaitingForPlayers()
    {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas_width, canvas_height);
        ctx.fillStyle="black";
        ctx.font = "20pt Helvetica";
        ctx.textAlign = "center";
        ctx.fillText("Waiting for all players to be connected...", canvas_width/2, canvas_height/2);
        renderExitButton();
    }


    function renderTokenX(x, y) {
        ctx.drawImage(
            assets["xbuena.png"],
            x,
            y,
            assets["xbuena.png"].width / 2,
            assets["xbuena.png"].height / 2);
    }

    function renderTokenO(x, y) {
        ctx.drawImage(
            assets["Obuena.png"],
            x,
            y,
            assets["Obuena.png"].width / 2,
            assets["Obuena.png"].height / 2);
    }

    function renderPlayersInfo()
    {

        ctx.font = "35px Helvetica";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#bbbbbb";

        var first_player_info = {
            symbol : model.getPlayerTokensSymbol(0).toUpperCase(),
            text : model.getPlayerAlias(0).toUpperCase(),
            metrics : {
                data : null,
                textWidth : null,
                x : null
            }
        };

        var second_player_info = {
            symbol : model.getPlayerTokensSymbol(1).toUpperCase(),
            text : model.getPlayerAlias(1).toUpperCase(),
            metrics : {
                data : null,
                textWidth : null,
                x : null
            }
        };

        first_player_info.metrics.x = (first_player_info.symbol == "X" ? canvas_width/2 + assets["X.png"].width : canvas_width/2 + assets["O.png"].width);
        first_player_info.metrics.data = ctx.measureText(first_player_info.text);
        first_player_info.metrics.textWidth = first_player_info.metrics.data.width;

        second_player_info.metrics.x = (second_player_info.symbol == "X" ? canvas_width/2 + assets["X.png"].width : canvas_width/2 + assets["O.png"].width);
        second_player_info.metrics.data = ctx.measureText(second_player_info.text);
        second_player_info.metrics.textWidth = second_player_info.metrics.data.width;

        ctx.fillText(first_player_info.text, canvas_width/2 - first_player_info.metrics.textWidth + assets[first_player_info.symbol+".png"].width, canvas_height * 0.01);

        ctx.drawImage(assets[first_player_info.symbol+".png"],
            canvas_width/2 - first_player_info.metrics.textWidth - assets[first_player_info.symbol+".png"].width - 10,
            canvas_height * 0.017,
            assets[first_player_info.symbol+".png"].width/2 ,
            assets[first_player_info.symbol+".png"].height/2
        );

        ctx.fillText(second_player_info.text, canvas_width/2 + second_player_info.metrics.textWidth / 2 + assets[second_player_info.symbol+".png"].width, canvas_height * 0.01);

        ctx.drawImage(assets[second_player_info.symbol+".png"],
            canvas_width/2 + second_player_info.metrics.textWidth / 2 - assets[second_player_info.symbol+".png"].width - 10,
            canvas_height * 0.017,
            assets[second_player_info.symbol+".png"].width/2 ,
            assets[second_player_info.symbol+".png"].height/2
        );

        ctx.textBaseline = "bottom";
        ctx.fillText("TURN: " + model.getPlayerTokensSymbol(model.playerTurn), canvas_width * 0.5, canvas_height * 0.99);

    }

    function renderExitButton() {

        ctx.font = "35px Helvetica";
        ctx.fillStyle = "#bbbbbb";
        var offset = 10;
        var text = "Exit";
        var metrics = ctx.measureText(text);
        var text_width = metrics.width;
        var text_height = metrics.height;

        ctx.fillText("EXIT", offset + text_width + assets["exit.png"].width * 0.7, canvas_height - offset * 1.4);
        ctx.drawImage(assets["exit.png"],offset, canvas_height - offset - assets["exit.png"].height);
    }

    function renderScoresButton() {
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
        var offset = 5;
        var width = canvas_width * 0.15;
        var height = width * 0.3;
        ctx.strokeRect(canvas_width - offset - width, canvas_height -offset - height, width, height);
        var fontSize = (width * 0.1) << 0 ;
        ctx.font = fontSize + "pt Helvetica";
        ctx.textBaseline = "middle";
        ctx.fillText("SCORES", canvas_width - offset - width * 0.5 ,canvas_height - height/2 - offset);
    }

    function renderBoard()
    {
        ctx.fillStyle = "white";
        ctx.fillRect(0,0,canvas_width,canvas_height);

        var boardRect = model.boardRect;

        ctx.drawImage(assets["cuadricula.png"],
            (canvas_width - (assets["cuadricula.png"].width / 2))  / 2,
            (canvas_height - (assets["cuadricula.png"].height / 2)) / 2,
            assets["cuadricula.png"].width/2 ,
            assets["cuadricula.png"].height/2
        );

        var row = 0;
        var col = 0;
        for (row = 0; row < 3; ++row) {
            for (col = 0; col < 3; ++col)
            {
                var x = boardRect.x + boardRect.w * (col == 1 ? 0.315 : (col == 0 ? -0.1 : 0.73));
                var y = boardRect.y + boardRect.h * (row == 1 ? 0.315 : (row == 0 ? -0.1 : 0.73));

                if (model.xTokens[row][col] ===1) {
                    renderTokenX(x,y+20);
                }
                else if (model.oTokens[row][col] ===1) {
                    renderTokenO(x,y+20);
                }

            }
        }

        renderPlayersInfo();
        renderExitButton();

        if (model.state == GAMESTATES.STATE_SCORES && socialService && socialService.isLoggedIn()) {
            renderScoresButton();
        }
    }

    function getImages(sources, callback) {
        var images = {};
        var imagesTotal = 1;
        var numImages = sources.length;

        sources.forEach(function (src) {
            images[src] = new Image();
            images[src].onload = function () {
                console.log("Asset loaded: ",src);
                if (imagesTotal++ >= numImages) {
                    console.log("Starting the game :)");
                    assets = images;
                    callback();
                }
            };
            images[src].src = "images/"+src;
        });
    }

    getImages(["cuadricula.png", "O.png", "exit.png", "scores.png", "X.png","xbuena.png","Obuena.png"], function () {
        setInterval(function () {
            if (model.state === GAMESTATES.STATE_IDLE) {
                renderCreateMatch();
            } else if (model.state === GAMESTATES.STATE_CREATING_MATCH) {
                renderCreatingMatch();
            } else if (model.state === GAMESTATES.STATE_WAITING_FOR_PLAYERS) {
                renderWaitingForPlayers();
            } else {
                renderBoard();
            }
        }, 16);
    });


//TOUCH EVENTS

    function processGameTouch(x,y)
    {
        
        var rect = canvas.getBoundingClientRect();
        x = x - rect.left;
        y = y - rect.top;
        
        var clickedExit = x < canvas_width * 0.15 && y > canvas_height * 0.9;

        if (model.state === GAMESTATES.STATE_IDLE) {

            if (clickedExit) {
                return;
            }

            var request = new Cocoon.Multiplayer.MatchRequest(2,2);
            if (x < canvas_width / 2) {

                if (multiplayerService == null) {
                    alert("Multiplayer is not supported on this device");
                    return;
                }

                if (!socialService.isLoggedIn()) {
                    
                    loginSocialService(false);
                }
                else
                {
                    model.isMultiplayerGame = true;
                    multiplayerService.findMatch(request, handleMatch);
                    model.state = GAMESTATES.STATE_CREATING_MATCH;
                }


            } else {

                model.isMultiplayerGame = false;
                loopbackServices[0].findAutoMatch(request, handleMatch);
                loopbackServices[1].findAutoMatch(request, function(){}); //only listen to the first loopback service delegate
                model.state = GAMESTATES.STATE_CREATING_MATCH;
            }
        }
        else if (model.state === GAMESTATES.STATE_CREATING_MATCH) {
            if (clickedExit) {

                if (model.isMultiplayerGame) {
                    multiplayerService.cancelAutoMatch();
                }
                else {
                    loopbackServices[0].cancelAutomatch();
                    loopbackServices[1].cancelAutomatch();
                }

                model.state = GAMESTATES.STATE_IDLE;
            }
        }
        else if (model.state === GAMESTATES.STATE_WAITING_FOR_PLAYERS  ) {
            if (clickedExit) {
                model.disconnect(true);
            }
        }
        else if (model.state === GAMESTATES.STATE_PLAYING) {

            if (clickedExit) {
                model.disconnect(true);
                return;
            }

            var px= x - model.boardRect.x;
            var py= y - model.boardRect.y;
            if (px >= 0 && py>=0 && px<=model.boardRect.w && py <= model.boardRect.h) {
                col = Math.floor(px / (model.boardRect.w / 3));
                row = Math.floor(py / (model.boardRect.h / 3));
                model.putToken(row,col);
            }
        }
        else if (model.state === GAMESTATES.STATE_SCORES) {
            if (clickedExit) {
                model.disconnect(true);
                return;
            }

            var clickedScores = (x > canvas_width * 0.15 && y > canvas_height * 0.9);
            if(clickedScores){
                if(socialService && socialService.isLoggedIn()){
                    model.disconnect(true);
                    socialService.showLeaderboard();
                }else{
                    alert("You must be logged into the Social Service.");
                }
            }
        }

    }

    //Check the environment to see if we're executing from CocoonJS or from navigator
    
    var isCocoon = (navigator.appVersion.indexOf("CocoonJS") !== -1);

    if (isCocoon){
        canvas.addEventListener( "touchstart",
            function(touchEvent)
            {
                processGameTouch(touchEvent.targetTouches[0].clientX, touchEvent.targetTouches[0].clientY);
            }
        );
    }else{
        canvas.addEventListener( "click",
            function(ev)
            {
                processGameTouch(ev.clientX, ev.clientY);
            }
        );
    }
})();

