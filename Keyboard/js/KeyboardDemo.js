var CocoonJS = {};
var W= 960;
var H= 640;
var keyboardIndex= 0;
var buttons= [];
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
    CocoonJS.Button= function() {
        return this;
    };

    CocoonJS.Button.prototype= {

        type    : null,
        x       : 0,
        y       : 0,
        image   : null,
        ctx     : null,

        createUI : function( ctx, keyboard, image, x, y ) {

            this.ctx= ctx;
            this.type= keyboard;
            this.x= x;
            this.y= y;
            this.image= image;
            return this;
        },

        repaint : function(text) {


            var font= "16px Arial";
            this.ctx.fillStyle='#e5e5e5';
            this.ctx.fillRect( this.x, this.y, this.image.width, this.image.height );

            if ( text && text!=="" ) {
                this.ctx.textAlign = "center";
                this.ctx.textBaseline= "middle";
                this.ctx.fillStyle="#000";
                this.ctx.font= font;
                this.ctx.fillText( text, this.x+300, this.y+this.image.height/2 );
            }

            this.ctx.drawImage( this.image, this.x, this.y  );

            return this;
        },

        handle : function( x, y ) {
            var o= this.action;

            if ( x>=this.x && x<=this.x+this.image.width && y>=this.y && y<=this.y+this.image.height ) {
                    Cocoon.Dialog.prompt({ 
                        title : "Title",
                        message : "Message",
                        text : "Initial text",
                        type : this.type,
                        confirmText : "Ok",
                        cancelText : "Cancel"
                    },{
                    success : function(text){
                        console.log("succedd callback called")
                        buttons[ keyboardIndex ].repaint(text);
                    },
                    cancel : function(){
                        console.log("Cancel pressed");
                    }
                });
                return true;
            }

            return false;
        }
    }
})();

(function() {

    var images;

    function start() {

        new CocoonJS.ImagePreloader().loadImages(
            [
                {id:"text",     url:"resources/images/text.png"},
                {id:"email",    url:"resources/images/email.png"},
                {id:"number",   url:"resources/images/number.png"},
                {id:"url",      url:"resources/images/url.png"},
                {id:"phone",    url:"resources/images/phone.png"},

                {id:"asiqueda",   url:"resources/images/asiqueda.png"}
            ],
            function( count, images ) {
                if ( count===images.length ) {
                    demo( images );
                }
            }
        );
    }

    function demo(img) {

        images= img;

        var canvas = document.createElement("canvas");
        canvas.style.cssText="idtkscale:ScaleAspectFit;";
        canvas.width = W;
        canvas.height = H;
        document.body.appendChild(canvas);
        var ctx = canvas.getContext("2d");

        ctx.fillStyle="#e5e5e5";
        ctx.fillRect( 0,0,W,H );

        var data= [
            Cocoon.Dialog.keyboardType.TEXT,
            Cocoon.Dialog.keyboardType.EMAIL,
            Cocoon.Dialog.keyboardType.NUMBER,
            Cocoon.Dialog.keyboardType.URL,
            Cocoon.Dialog.keyboardType.PHONE
        ];

        for( var i=0; i<data.length; i++ ) {
            buttons.push(
                new CocoonJS.Button().
                    createUI(
                        ctx,
                        data[i],
                        images[i].image,
                        (W-images[i].image.width)/2,
                        (H-5*images[i].image.height)/2 + i*images[i].image.height
                    ).repaint("")
            );
        }

        buttons[0].repaint("morti et mangu");

        var touchOrClick = function(x, y) {
            for(var i=0; i<buttons.length; i++ ) {
                if ( buttons[i].handle( x, y ) ) {
                    keyboardIndex= i;
                    break;
                }
            }
        };

        if (window.ontouchstart !== undefined) {
            canvas.addEventListener("touchstart", function(touchEvent) {
                var e= touchEvent.targetTouches[0];
                var x= e.pageX;
                var y= e.pageY;
                touchOrClick(x, y);
            });
        }
        else {
            canvas.addEventListener("mousedown", function(e) {
                var x = e.clientX - canvas.offsetLeft;
                var y = e.clientY - canvas.offsetTop; 
                touchOrClick(x, y);
            });
        }
    }

    window.addEventListener("load",start,false);

})();