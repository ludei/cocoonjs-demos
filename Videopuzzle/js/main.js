(function() {

    var director;
    var image;
    var scene;
    var url = window.URL || window.webkitURL;
    var isStreaming = false;

    new CAAT.ImagePreloader().loadImages(
        [
            {id:'image',    url: 'resources/images/image.jpg'}
        ],
        function( counter, images ) {
            if ( counter===images.length ) {

                director= new CAAT.Director().initialize( 800, 600 );
                director.setImagesCache( images );
                director.addAudio("11", "resources/sounds/11.ogg").addAudio("12", "resources/sounds/12.ogg").addAudio("win", "resources/sounds/win.ogg");
                scene= director.createScene();

                image= director.getImage("image");
                var cimage= document.createElement("canvas");
                cimage.width= image.width;
                cimage.height= image.height;
                var ctx= cimage.getContext("2d");
                ctx.drawImage( image, 0, 0 );
                image= cimage;
                var v;

                if (Cocoon.Camera.getNumberOfCameras() > 0)
                {
                    var im = Cocoon.Camera.start({
                            cameraIndex : 0, 
                            width : 640, 
                            height :480, 
                            frameRate : 20,
                            success: function(img){
                                if(img){

                                    if(Cocoon.nativeAvailable){
                                        setInterval( function() {
                                            ctx.drawImage( img, 0, 0, cimage.width, cimage.height );
                                        }, 60 );
                                    }else{
                                        v.src = url ? url.createObjectURL(img) : img;
                                        v.play();
                                    }
                                }
                            },
                            error : function(){
                                console.log("Error :(");
                            }
                        });
                
                        if(v)
                          v.addEventListener('canplay', function(e) {
                              if (!isStreaming) {
                                isStreaming = true;
                              }
                          }, false),
                          v.addEventListener('play', function() {

                            setInterval(function() {
                              if (v.paused || v.ended) return;
                              ctx.fillRect(0, 0, cimage.width, cimage.height);
                              ctx.drawImage(v, 0, 0, cimage.width, cimage.height);
                            }, 33);
                          
                          }, false);
                }
                else
                {
                    console.log("Sorry, it seems that there is no camera available in the system. The game will work using a static image.");
                }

                start();

            }
        });

    function start() {
        var puzzle= new Puzzle.Game().setImage( director, image ).setTable( 2,2, 800,600 );
        scene.addChild( puzzle );

        scene.createTimer(
            0, 3000,
            function() {
                puzzle.start();
            }
        )
        CAAT.loop(60)

    }
})();
