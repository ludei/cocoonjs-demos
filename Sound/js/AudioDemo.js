(function() {
    Cocoon.Audio= function() {
        return this;
    };

    Cocoon.Audio.prototype= {

        audio   : null,

        setAudio : function( audio ) {
            this.audio= audio;
            this.audio.load();
            return this;
        },

        loop : function( loop ) {
            return this;
        },

        play : function() {
            //var volume = Math.random();
            //console.log("volume = " + volume);
            this.audio.volume = 0.5;
            
            this.audio.play();
            return this;
        },

        pause : function() {
            this.audio.pause();
            return this;
        }

    };

})();

(function() {
    Cocoon.Music= function() {
        return this;
    };

    Cocoon.Music.prototype= {

        audio   : null,

        setAudio : function( audio ) {
            this.audio= audio;
            this.audio.load();
            this.audio.addEventListener(
                'ended',
                function(audioEvent) {
                    audioEvent.target.playing= false;
                    console.log("Audio ends playing.");
                },
                false
            );
            return this;
        },

        loop : function( ) {
            if ( !this.audio) {
                console.log("audio not present.");
                return;
            }

            this.audio.loop= !this.audio.loop;
            return this;
        },

        play : function() {

            if ( !this.audio) {
                console.log("audio not present.");
                return;
            }

            if ( this.audio.playing ) {
                return;
            }
            this.audio.playing= true;

            //var volume = Math.random();
            //console.log("volume = " + volume);
            //this.audio.volume = volume;

            this.audio.play();


            return this;
        },

        pause : function() {
            if ( !this.audio) {
                console.log("audio not present.");
                return;
            }
            this.audio.pause();
            this.audio.playing= false;
            return this;
        }

    };

})();

(function() {
    Cocoon.AudioButton= function() {
        return this;
    };

    Cocoon.AudioButton.prototype= {

        audio   : null,
        actions : null,

        /**
         * Audio element.
         * @param audio
         */
        init : function( audio ) {
            this.audio= audio;
            return this;
        },

        createUI : function( ctx, name, x, y, w, h, isMusic ) {

            this.actions= [];

            var textW= 200;
            var Pad= 8;

            ctx.textAlign = "center";
            ctx.textBaseline= "middle";
            ctx.font= "20px Arial";

            this.makeButton( ctx, name, x,y,textW,h, null );

            this.makeButton(
                ctx,
                "Play",
                x+textW+Pad,
                y,
                textW,
                h,
                this.audio.play.bind(this.audio)
            );

            var bW= 100;
            x+= textW;

            if ( isMusic ) {
                this.makeButton(
                    ctx,
                    "Loop",
                    x+2*(bW+Pad),
                    y,
                    bW,
                    h,
                    (function(audio) {
                        return function() {
                            audio.loop();
                        };
                    })(this.audio)
                );
                this.makeButton(
                    ctx,
                    "Pause",
                    x+3*(bW+Pad),
                    y,
                    bW,
                    h,
                    (function(audio) {
                        return function() {
                            audio.pause();
                        };
                    })(this.audio)

                );


            }

            return this;
        },

        makeButton : function( ctx, text, x,y,w,h, callback ) {

            ctx.fillStyle= 'rgba(255,255,255,.5)';
            ctx.fillRect( x,y,w,h );
            ctx.fillStyle= '#000';
            ctx.fillText( text, x+w/2, y+h/2 );

            if ( callback ) {
                this.actions.push( {
                    action: text,
                    x:  x,
                    y:  y,
                    w:  w,
                    h:  h,
                    f:  callback
                });
            }
        },

        handle : function( x, y ) {
            for( var i=0; i<this.actions.length; i++ ) {
                var o= this.actions[i];

                if ( x>=o.x && x<=o.x+o.w && y>=o.y && y<=o.y+o.h ) {
                    o.f();
                    return true;
                }
            }
            return false;
        }
    }
})();

(function() {

    Function.prototype.bind= Function.prototype.bind || function() {
        var fn=     this;                                   // the function
        var args=   Array.prototype.slice.call(arguments);  // copy the arguments.
        var obj=    args.shift();                           // first parameter will be context 'this'
        return function() {
            return fn.apply(
                    obj,
                    args.concat(Array.prototype.slice.call(arguments)));
        }
    };

    function start() {
        var NB=5;   // num buttons

        var music= document.createElement('audio'); // same as new Audio()
        music.src="resources/musics/music.ogg";
        music.loop= true;

        var s01= new Audio();
        s01.src= "resources/sounds/01.ogg";

        var s10= new Audio();
        s10.src= "resources/sounds/10.ogg";

        var s11= new Audio();
        s11.src= "resources/sounds/11.ogg";

        var s12= new Audio();
        s12.src= "resources/sounds/12.ogg";

        var canvas= document.createElement("canvas");
        canvas.width=   window.innerWidth;
        canvas.height=  window.innerHeight;
        document.body.appendChild( canvas );
        var ctx= canvas.getContext("2d");
        ctx.fillStyle='#000';
        ctx.fillRect( 0,0,canvas.width, canvas.height );

        var W= canvas.width-60;
        var H= (canvas.height-40)/NB;
        var Pad= 4;
        var WW= canvas.width-20-2*Pad;
        var HH= H-2*Pad;

        var buttons= [];

        var data= [
            ["Music",   new Cocoon.Music().setAudio(music)],
            ["Sound1",  new Cocoon.Audio().setAudio(s01)],
            ["Sound2",  new Cocoon.Audio().setAudio(s10)],
            ["Sound3",  new Cocoon.Audio().setAudio(s11)],
            ["Sound4",  new Cocoon.Audio().setAudio(s12)]
        ];

        var i;

        for( i=0; i<data.length; i++ ) {
            buttons.push(
                new Cocoon.AudioButton().
                    init( data[i][1] ).
                    createUI( ctx, data[i][0], 30 + Pad, 20 + Pad + i*H, WW, HH, i===0 )
            );
        }

        var processTouchAndClickEvents = function(x, y)
        {
            var i;

            for( i=0; i<buttons.length; i++ ) {
                if ( buttons[i].handle( x, y ) ) {
                    break;
                }
            }
        }

        canvas.addEventListener
        (
            "mousedown", 
            function(clickEvent)
            {
                var x = clickEvent.clientX - canvas.offsetLeft;
                var y = clickEvent.clientY - canvas.offsetTop; 
                processTouchAndClickEvents(x, y);               
            }
        );

        canvas.addEventListener(
            "touchstart",
            function(touchEvent) {
                var e= touchEvent.targetTouches[0];
                var x= e.pageX;
                var y= e.pageY;
                processTouchAndClickEvents(x, y);               
            }
        );
    }

    window.addEventListener("load",start,false);

})();
