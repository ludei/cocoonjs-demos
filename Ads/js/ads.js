(function() {

    var demo = {
        isHidden: false,
        position: Cocoon.Ad.BannerLayout.BOTTOM_CENTER,
        x : 0,
        y : 0,
        width : 0,
        height : 0,
        ctx:null,
        fullScreenAdvertisement : null,
        fullScreenAlreadyDownloaded: false,
        params: {
            banner : {
                "status" : null
            },
            fullscreen : {
                "status" : null
            }
        }
    };

    demo.createAdBanners = function(){
        Cocoon.Ad.banner.on("ready", function(width,height){
            console.log("onBannerReady " + width, height);
            demo.layoutBanner();
        });

        Cocoon.Ad.banner.on("shown", function(){
            console.log("onBannerShown");
            demo.params.banner.status = "onBannerShown";
            demo.isBannerHidden = false;
        });

        Cocoon.Ad.banner.on("hidden", function(){
            console.log("onBannerHidden");
            demo.params.banner.status = "onBannerHidden";
            demo.isBannerHidden = true;
        });
    };

    demo.layoutBanner = function() {
        var rect = Cocoon.Ad.getRectangle();
        var dpr = window.devicePixelRatio;
        if (demo.position == Cocoon.Ad.BannerLayout.TOP_CENTER) {
            rect.x = window.innerWidth * dpr/2 - rect.width/2;
            rect.y = 0;

        } else {
            rect.x = window.innerWidth * dpr/2 - rect.width/2;
            rect.y = window.innerHeight * dpr - rect.height;
        }

        Cocoon.Ad.setRectangle(rect);
        if (!demo.isBannerHidden)
            Cocoon.Ad.showBanner();
    };

    demo.createFullscreenAds = function(){
         Cocoon.Ad.interstitial.on("ready", function(){
            demo.fullScreenAlreadyDownloaded = true;
            demo.params.fullscreen.status = "Full screen ready,";
            demo.params.fullscreen.sub_status = "press SHOW FULL SCREEN to watch the ad.";
         });
         Cocoon.Ad.interstitial.on("shown", function(){
            demo.params.fullscreen.status = "onFullScreenShown";
            demo.params.fullscreen.sub_status = "";
            console.log("onFullScreenShown");
         });
         Cocoon.Ad.interstitial.on("hidden", function(){
            console.log("onFullScreenHidden");
            demo.params.fullscreen.status = "Full screen hidden,";
            demo.params.fullscreen.sub_status = "press CACHE AD to download another ad.";
         });
     };

     demo.init = function(){

        var canvas= document.createElement("canvas");
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

        ctx= canvas.getContext("2d");
        demo.ctx = ctx;
        var image= new Image();
        image.onload=function() {
            ctx.drawImage( image,0,0 );

            var touchOrClick = function(x, y)
            {
                var bound = canvas.getBoundingClientRect();
                x = (x - bound.left) / scale;
                y = (y - bound.top) / scale;

                if(x >= 540 && x <= 885 && y >= 200 && y <= 255){
                    Cocoon.Ad.showBanner();
                }else if (x >= 540 && x <= 885 && y >= 273 && y <= 327){
                    Cocoon.Ad.hideBanner();
                }else if (x >= 540 && x <= 885 && y >= 350 && y <= 403){
                    // Other way of laying the banners out, using a rect to set the area the banner is going to fill.
                    var rect = Cocoon.Ad.getRectangle();

                    if (demo.position == Cocoon.Ad.BannerLayout.BOTTOM_CENTER) {
                        demo.position = Cocoon.Ad.BannerLayout.TOP_CENTER;
                    } 
                    else {
                        demo.position = Cocoon.Ad.BannerLayout.BOTTOM_CENTER;
                    }
                    demo.layoutBanner();
                }else if (x >= 540 && x <= 885 && y >= 430 && y <= 482){
                    console.log("Downloading banner...");
                    demo.params.banner.status = "Downloading banner...";
                    Cocoon.Ad.loadBanner();
                }else if (x >= 77 && x <= 418 && y >= 200 && y <= 254){
                    demo.params.fullscreen.status = "Showing ad";
                    demo.params.fullscreen.sub_status = "";
                    Cocoon.Ad.showInterstitial();
                }else if (x >= 77 && x <= 418 && y >= 272 && y <= 325){
                    console.log("Downloading fullscreen...");
                    demo.params.fullscreen.status = "Downloading full screen...";
                    demo.params.fullscreen.sub_status = "";
                    Cocoon.Ad.loadInterstitial();
                }else{
                    console.log("No button selected: ", x | 0 , y | 0);
                }

            }

            canvas.addEventListener(
                "touchstart",
                function( touches ) {
                    var that = touches.targetTouches[0];

                        var x= that.pageX;
                        var y= that.pageY;
                        touchOrClick(x, y);

                },
                false
                );
            setInterval(function(){

                ctx.clearRect(0,0,window.innerWidth,window.innerHeight);

                ctx.drawImage(image,0,0);

                ctx.fillStyle = '#888';
                ctx.font = '22px Arial';
                ctx.textBaseline = 'bottom';
                ctx.fillText('Full screen status: '+demo.params.fullscreen.status, 77, 510);
                ctx.fillText('Banner status: '+demo.params.banner.status, 540, 510);
                ctx.fillText(demo.params.fullscreen.sub_status, 77, 530);

            },1000 / 60);

        };
        image.src="resources/images/asiqueda.png";
    }

    /*
    * So here is the magic, the following method is the best way to create banners and show them on the screen:
    * - Create the banners // fullscreen ads (this will add the listeners to manage the ads)
    * - When there is an ad cached, you will be notified by the onBannerReady method, then you can show it.
    *
    * More information about the ads extension can be found here:
    * https://ludei.zendesk.com/hc/en-us/articles/200767308-Ads
    */

    // Create banner ads trought the CocoonJS Ads extension
    demo.createAdBanners();
    // Create fullscreen ads trought the CocoonJS Ads extension
    demo.createFullscreenAds();

    /*
        Download ad banners // fullscreen ads
    */
    Cocoon.Ad.loadBanner();
    Cocoon.Ad.loadInterstitial();

    /***
    * Ads are ready, show the canvas to manage them:
    */
    demo.params.banner.status = "Downloading banner...";
    demo.params.fullscreen.status = "Downloading full screen...";
    demo.params.fullscreen.sub_status = "";
    demo.init();

})();
