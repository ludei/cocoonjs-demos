var CocoonJS= {};
var PTM = 80 ;
var ASTEROID_SCALE = 0.50;
GRAVITY = 600 / PTM ;
console.log("Starting");

(function() {

    CocoonJS.ImagePreloader = function()   {
        this.images = [];
        return this;
    };

    CocoonJS.ImagePreloader.prototype =   {

        images:                 null,   // a list of elements to load
        notificationCallback:   null,   // notification callback invoked for each image loaded.
        imageCounter:           0,      // elements counter.

        loadImages: function( aImages, callback_loaded_one_image ) {

            if (!aImages) {
                if (callback_loaded_one_image ) {
                    callback_loaded_one_image(0,[]);
                }
            }

            var me= this, i;
            this.notificationCallback = callback_loaded_one_image;
            this.images= [];
            for( i=0; i<aImages.length; i++ ) {
                this.images.push( {id:aImages[i].id, image: new Image() } );
            }

            for( i=0; i<aImages.length; i++ ) {
                this.images[i].image.onload = function imageLoaded() {
                    me.imageCounter++;
                    me.notificationCallback(me.imageCounter, me.images);
                };
                this.images[i].image.src= aImages[i].url;
            }

            if ( aImages.length===0 ) {
                callback_loaded_one_image(0,[]);
            }
        }

    };
})();

(function() {
    CocoonJS.Sprite= function() {
        return this;
    };

    CocoonJS.Sprite.prototype= {
        x               : 0,
        y               : 0,
        pixelsSecondX   : 0,
        pixelsSecondY   : 0,
        boundsW         : 0,
        boundsH         : 0,
        image           : null,
        box2DBody       : null,

        init : function(posx,posy,image) {
            this.x = posx ;
            this.y = posy

            this.image= image;

            var bodyDef = new Box2D.Dynamics.b2BodyDef() ;
            bodyDef.position.Set(this.x,this.y);
            bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
        
            this.box2DBody = box2Dworld.CreateBody( bodyDef ) ;

            var fixtureDef   = new Box2D.Dynamics.b2FixtureDef() ;
            fixtureDef.shape = new Box2D.Collision.Shapes.b2CircleShape(0.4 * ASTEROID_SCALE * 100 / PTM);

            fixtureDef.friction    = 0.5;
            fixtureDef.restitution = 0.3;
            fixtureDef.density     = 0.05 + Math.random()*0.01;

            this.box2DBody.CreateFixture(fixtureDef) ;

            return this;
        },

        angle : 0,
        angleVel : Math.random()*2*Math.PI * (Math.random()<.5?1:-1),
        angleOffset : Math.random()*2*Math.PI,

        draw : function( ctx ) {
            var pos = this.box2DBody.GetPosition();
            this.x = pos.x * PTM;
            this.y = pos.y * PTM;
            this.angle = this.box2DBody.GetAngle() ;
            
            ctx.translate( this.x  +  this.image.width/2 , this.y + this.image.height/2 );
            ctx.rotate( this.angle + this.angleOffset );
            ctx.scale(ASTEROID_SCALE,ASTEROID_SCALE);
            ctx.translate( -this.image.width/2, -this.image.height/2 );
            ctx.drawImage( this.image, 0,0 );

            ctx.setTransform(1,0,0,1,0,0);
        }
    };
})();

var box2Dworld = new Box2D.Dynamics.b2World( new Box2D.Common.Math.b2Vec2(0,9.8),false);
box2Dworld.SetContinuousPhysics(true);


(function() {

    var sprites=    [];
    var time=       0;
    var ctx=        null;
    var images=     null;
    var W=          960;
    var H=          640;
    var canvas=     null;

    var buttonT=    null;

    function start() {
        new CocoonJS.ImagePreloader().loadImages(
            [
                {id:"+",        url:"n_sprites/+.png"},
                {id:"-",        url:"n_sprites/-.png"},
                {id:"asteroide",url:"n_sprites/asteroide.png"},
                {id:"fondo",    url:"n_sprites/fondo.png"},
                {id:"marco",    url:"n_sprites/marco.png"},
                {id:"marcon",   url:"n_sprites/marcoFPS.png"}
            ],
            function( count, images ) {
                if ( count===images.length ) {
                    demo( images );
                }
            }
        );
    }

    function is_touch_device() { 
        return 'ontouchstart' in document;
    }

    function demo(img) {
        images= img;

        console.log("Creating stuff");
        var i;
        canvas = document.createElement(navigator.isCocoonJS ? "screencanvas" : "canvas");
        canvas.width  = window.innerWidth*window.devicePixelRatio;
        canvas.height = window.innerHeight*window.devicePixelRatio;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        ctx = canvas.getContext("2d");
        document.body.appendChild(canvas);

        W = canvas.width;
        H = canvas.height;
        console.log("image width: " + images[3].image.width);
        console.log("image height: " + images[3].image.height);
        ctx.drawImage( images[3].image,0,0,canvas.width, canvas.height );
        
        // if( is_touch_device() )
        //     window.addEventListener('devicemotion', function (event) {
        //                 box2Dworld.SetGravity( new Box2D.Common.Math.b2Vec2(event.acceleration.y * GRAVITY, event.acceleration.x * GRAVITY)) ;
        //     }, true);
        // else
        window.addEventListener('deviceorientation', function (event) {
            var alpha = event.alpha;
            var beta = event.beta;
            var gamma = event.gamma;
            switch(window.orientation) {
            case -90:
                beta = event.gamma;
                gamma = -event.beta;
                break;
            case 90:
                beta = -event.gamma;
                gamma = event.beta;
                break;
            case 180:
                beta = -event.beta;
                gamma = event.gamma;
                break;
            }
            box2Dworld.SetGravity( new Box2D.Common.Math.b2Vec2((0.5 + gamma) * GRAVITY * 0.03 , beta * GRAVITY * 0.03)) ;
        }, true);     
        
        var WORLD_WIDTH  = canvas.width/PTM; 
        var WORLD_HEIGHT = canvas.height/PTM;
        var BLOCK_THICK  = 100/PTM ;

        // Floor
        var bodyDef = new Box2D.Dynamics.b2BodyDef ;
        bodyDef.position.Set( WORLD_WIDTH / 2 , WORLD_HEIGHT + BLOCK_THICK / 2 );

        var fixtureDef = new Box2D.Dynamics.b2FixtureDef ;
        fixtureDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
        fixtureDef.shape.SetAsBox(WORLD_WIDTH,BLOCK_THICK);
        fixtureDef.friction = 0.5;
        fixtureDef.restitution =0.5;
        fixtureDef.density = 0.0;

        var worldBody = box2Dworld.CreateBody( bodyDef ) ;
        worldBody.CreateFixture(fixtureDef) ;

        // Ceiling
        bodyDef.position.Set( WORLD_WIDTH/2 , 0 - BLOCK_THICK / 2 - 100 / PTM );
        worldBody = box2Dworld.CreateBody( bodyDef ) ;
        worldBody.CreateFixture(fixtureDef) ;

        // Left wall
        fixtureDef.shape.SetAsBox(BLOCK_THICK,WORLD_HEIGHT);
        bodyDef.position.Set(0 - BLOCK_THICK / 2 - 100 / PTM , WORLD_HEIGHT / 2 );
        worldBody = box2Dworld.CreateBody( bodyDef ) ;
        worldBody.CreateFixture(fixtureDef) ;

        // Right wall
        bodyDef.position.Set(WORLD_WIDTH + BLOCK_THICK / 2 , WORLD_HEIGHT / 2 );
        worldBody = box2Dworld.CreateBody( bodyDef ) ;
        worldBody.CreateFixture(fixtureDef) ;

        // -----------

        var touchListener =  function(touchEvent) {
                var x;
                if( typeof touchEvent.targetTouches !== 'undefined' )
                {
                    var e= touchEvent.targetTouches[0];

                    x= e.pageX;
                }
                else
                    x = touchEvent.clientX ;

                x *= window.devicePixelRatio
                var N = 20 ;
                console.log(canvas.width, x);
                if ( x < canvas.width/2 ) {
                    var lastSprite = null ;

                    for( var i =0 ;i < N ; i++ )
                    {
                        if(sprites.length >= 590 )
                            break ;

                        var sprite = createSprite( 1 + i * ASTEROID_SCALE*80 / PTM , 100/PTM ) ;
                        
                        /*
                        if( lastSprite !== null )
                        {
                            var jointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef( 
                                sprite.box2DBody , lastSprite.box2DBody ,
                                new Box2D.Common.Math.b2Vec2(  15 * ASTEROID_SCALE/PTM , 0) ,
                                new Box2D.Common.Math.b2Vec2(- 15 * ASTEROID_SCALE/PTM , 0 )
                                );

                            jointDef.bodyA = sprite.box2DBody ;
                            jointDef.bodyB = lastSprite.box2DBody ;
                            jointDef.length = (80 - 30) * ASTEROID_SCALE / PTM ;
                            box2Dworld.CreateJoint( jointDef ) ;
                        }
                        */
                        lastSprite = sprite ;
                    }

                    
                    createSpritesNumber();
                } else {
                    for( var i =0 ; i < N ; i++ ){
                        if ( sprites.length>0 ) {
                            box2Dworld.DestroyBody( sprites[0].box2DBody ) ;
                            sprites.shift();
                            createSpritesNumber();
                        }
                    }
                }
            };


        if( is_touch_device() )
            canvas.addEventListener( "touchstart", touchListener );
        else
            canvas.addEventListener( "click", touchListener );

        createSpritesNumber();

        time= new Date().getTime();
        setInterval( step, 1000/60 );

    }

    function step() {

        if( navigator.isCocoonJS )
            ctx.clear() ;

        ctx.drawImage( images[3].image, 0, 0,canvas.width, canvas.height );
        
        var t=      new Date().getTime();
        var delta=  t - time;
 
        if( delta > 100 )
            delta = 100 ;

        box2Dworld.Step( delta/1000.0 , 10 , 10 );

        for( var i=0; i<sprites.length; i++ ) {
            sprites[i].draw( ctx );
        }

        ctx.drawImage( buttonT, (W-buttonT.width)/2, 10 );


        var m= images[4].image;
        var ww= (W-m.width)/2;
        var hh= H-m.height-20;
        ctx.drawImage( m, ww, hh );

        var mas= images[0].image;
        var menos= images[1].image;

        ctx.drawImage( mas,     W/2-mas.width-10, hh + (m.height-mas.height)/2 + 15 );
        ctx.drawImage( menos,   W/2+10, hh + (m.height-mas.height)/2 + 15 );

        time= t;
    }

    function createSprite(posx, posy) {
        var sprite = new CocoonJS.Sprite().init( posx , posy, images[2].image ) ;
        sprites.push( sprite ) ;
        return sprite ;
    }

    function createSpritesNumber( ) {
        var text=""+sprites.length;
        var canvas=     document.createElement("canvas");
        var img= images[5].image;
        canvas.width=   img.width;
        canvas.height=  img.height;
        var ctx=        canvas.getContext("2d");
        var w= canvas.width;
        var h= canvas.height;

        ctx.drawImage( img, 0, 0 );

        ctx.textAlign = "center";
        ctx.textBaseline= "middle";

        ctx.font= "12px Arial";

        ctx.fillStyle= '#333';
        ctx.fillText( text, w/2-1, h/2 );
        ctx.fillText( text, w/2+1, h/2 );
        ctx.fillText( text, w/2, h/2+1 );
        ctx.fillText( text, w/2, h/2-1 );
        ctx.fillText( text, w/2-1, h/2-1 );
        ctx.fillText( text, w/2+1, h/2+1 );
        ctx.fillText( text, w/2-1, h/2+1 );
        ctx.fillText( text, w/2+1, h/2-1 );

        ctx.fillStyle= "#fff";
        ctx.fillText( text, w/2, h/2 );

        buttonT= canvas;
    }

    start();

    // window.addEventListener("load",start,false);

})();
