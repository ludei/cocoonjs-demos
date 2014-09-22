(function() {
    /***
    This demo only Works on the CocoonJS environment.
    */
    if(!CocoonJS.nativeExtensionObjectAvailable) return;

    var demo = {
        isHidden: false,
        position: CocoonJS.Ad.BannerLayout.BOTTOM_CENTER,
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

    demo.layoutBanner = function() {
        var rect = banner1.getRectangle();
        console.log("rect.x: " + rect.x + ", rect.y: " + rect.y + ", rect.width: " + rect.width + ", rect.height: " + rect.height);
        var dpr = window.devicePixelRatio;
        if (demo.position == CocoonJS.Ad.BannerLayout.TOP_CENTER) {
            rect.x = window.innerWidth * dpr/2 - rect.width/2;
            rect.y = 0;

        } else {
            rect.x = window.innerWidth * dpr/2 - rect.width/2;
            rect.y = window.innerHeight * dpr - rect.height;
        }

        banner1.setRectangle(rect);
        if (!demo.isBannerHidden)
            banner1.showBanner();
    }

    var banner1Params = {
        "bannerAdUnit": "agltb3B1Yi1pbmNyDQsSBFNpdGUY5qXqEww",
        "bannerAdUnit-iPad": "agltb3B1Yi1pbmNyDQsSBFNpdGUYk8vlEww",
        "bannerAdUnit-iPhone": "agltb3B1Yi1pbmNyDQsSBFNpdGUY5dDoEww",
        "refresh": 20
    };
    var fullscreen1Params = {
        "fullscreenAdUnit": "agltb3B1Yi1pbmNyDQsSBFNpdGUYjv30Eww",
        "fullscreenAdUnit-iPad": "agltb3B1Yi1pbmNyDQsSBFNpdGUYjf30Eww",
        "fullscreenAdUnit-iPhone": "agltb3B1Yi1pbmNyDQsSBFNpdGUYjf30Eww",
        "refresh": 20
    };

    /**
    * Multi instance
    */
    function onBannerShown() {
        console.log("onBannerShown");
        demo.params.banner.status = "onBannerShown";
        demo.isBannerHidden = false;
    }

    function onBannerHidden() {
        console.log("onBannerHidden");
        demo.params.banner.status = "onBannerHidden";
        demo.isBannerHidden = true;
    }

    function onBannerReady(width, height) {
        console.log("onBannerReady " + width, height);
        demo.layoutBanner();
    }

    function onFullScreenShown() {
        demo.params.fullscreen.status = "onFullScreenShown";
        demo.params.fullscreen.sub_status = "";
        console.log("onFullScreenShown");
    }

    function onFullScreenHidden() {
        console.log("onFullScreenHidden");
        demo.params.fullscreen.status = "Full screen hidden,";
        demo.params.fullscreen.sub_status = "press CACHE AD to download another ad.";
    }

    function onFullScreenReady() {
        demo.fullScreenAlreadyDownloaded = true;
        demo.params.fullscreen.status = "Full screen ready,";
        demo.params.fullscreen.sub_status = "press SHOW FULL SCREEN to watch the ad.";
    }

    var banner1 = CocoonJS.Ad.createBanner(banner1Params);
    banner1.onBannerShown.addEventListener(onBannerShown);
    banner1.onBannerHidden.addEventListener(onBannerHidden);
    banner1.onBannerReady.addEventListener(onBannerReady);
    banner1.refreshBanner();

    var fullscreen1 = CocoonJS.Ad.createFullscreen(fullscreen1Params);
    fullscreen1.onFullScreenShown.addEventListener(onFullScreenShown);
    fullscreen1.onFullScreenHidden.addEventListener(onFullScreenHidden);
    fullscreen1.onFullScreenReady.addEventListener(onFullScreenReady);
    fullscreen1.refreshFullScreen();

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

            var touchOrClick = function(x, y) {
                var bound = canvas.getBoundingClientRect();
                x = (x - bound.left) / scale;
                y = (y - bound.top) / scale;

                if(x >= 540 && x <= 885 && y >= 200 && y <= 255){
                    banner1.showBanner();

                }else if (x >= 540 && x <= 885 && y >= 273 && y <= 327){
                    banner1.hideBanner();

                }else if (x >= 540 && x <= 885 && y >= 350 && y <= 403){
                    // Other way of laying the banners out, using a rect to set the area the banner is going to fill.
                    var rect = banner1.getRectangle();

                    if (demo.position == CocoonJS.Ad.BannerLayout.BOTTOM_CENTER) {
                        demo.position = CocoonJS.Ad.BannerLayout.TOP_CENTER;
                    } 
                    else {
                        demo.position = CocoonJS.Ad.BannerLayout.BOTTOM_CENTER;
                    }
                    demo.layoutBanner();

                }else if (x >= 540 && x <= 885 && y >= 430 && y <= 482){
                    demo.params.banner.status = "Downloading banner...";
                    banner1.refreshBanner();

                }else if (x >= 77 && x <= 418 && y >= 200 && y <= 254){
                    demo.params.fullscreen.status = "Showing ad";
                    demo.params.fullscreen.sub_status = "";
                    fullscreen1.showFullScreen();

                }else if (x >= 77 && x <= 418 && y >= 272 && y <= 325){
                    console.log("Downloading fullscreen...");
                    demo.params.fullscreen.status = "Downloading full screen...";
                    demo.params.fullscreen.sub_status = "";
                    fullscreen1.refreshFullScreen();

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

    /***
    * Ads are ready, show the canvas to manage them:
    */
    demo.params.banner.status = "Downloading banner...";
    demo.params.fullscreen.status = "Downloading full screen...";
    demo.params.fullscreen.sub_status = "";
    demo.init();

})();
