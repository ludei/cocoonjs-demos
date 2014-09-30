(function() {

    /**********************************
     * Fetch products from server
     *******************************/

    var a = null;
    Cocoon.Store.on("load",{
        started: function(){ 
             console.log("onProductsFetchStarted");
        },
        success: function(products){
            for (var i = products.length - 1; i >= 0; i--) {
                Cocoon.Store.addProduct(products[i]);
                console.log("Adding product to the local database: " + JSON.stringify(products[i]));
            };

            console.log("onProductsFetchCompleted: " + JSON.stringify(products));
        },
        error: function(errorMessage){ 
             console.log("onProductsFetchFailed");
        }
    });

    /**********************************
     * Product purchase
     *******************************/

    Cocoon.Store.on("purchase",{
        started: function(productId){
            console.log("Product purchase started: " + productId );
        },
        success: function(purchaseInfo){ 
            console.log("Product purchase completed: ");
            console.log(JSON.stringify(arguments));
        },
        verification: function(productId,data){ 
            console.log("verification received");
            // This callback will be fired only when using "unmanaged" mode
            //in iOS refer to:
            //https://developer.apple.com/library/ios/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateRemotely.html#//apple_ref/doc/uid/TP40010573-CH104-SW1
            // An example of the implementing server is:
            // https://github.com/pcrawfor/iap_verifier

            // in Android refer to:
            // https://developer.android.com/google/play/billing/gp-purchase-status-api.html#overview
            //
            //An example of implementing server is:
            //https://www.npmjs.org/package/iab_verifier

            var orderId = data.match(/\d+\.\d+/g)[0];

            console.log("********************************************");
            console.log("CURRENT PRODUCTS ON LOCAL DATABASE:\n\n\n\n\n\n");
            console.log(JSON.stringify(Cocoon.Store.getProducts()));
            console.log("********************************************");

            Cocoon.Store.consume(orderId, productId);
            console.log("======= orderID : " + orderId + "productId  " + productId + " consumed =========");
            Cocoon.Store.finish(orderId);
            console.log("======= purchase finished ===========");
        },
        error: function(productId, err){
            console.log("Product purchase failed: " + err);
        }
    });

    /********************************** 
     * Consume purchase mode
     *******************************/

    Cocoon.Store.on("consume",{
        started: function(transactionId){
            console.log("Consume purchase started: " + transactionId);
        },
        success: function(transactionId){
            console.log("Consume purchase completed: "  + transactionId);
        },
        error: function(transactionId, err){ 
            console.log("Consume purchase failed: " + err);
        }
    });

    /**********************************
     * Restore purchases mode
     *******************************/

    Cocoon.Store.on("restore",{
        started: function(){ 
            console.log("Restore purchases started.");
        },
        success:function() {
            console.log("Restore purchases completed.");
            console.log("EO LOOP");
            for (var prop in arguments) {
                console.log(arguments[prop]);
            };
            console.log("EOF LOOP");
        },
        error: function(errorMessage){ 
            console.log("Restore purchases failed: " + errorMessage);
        }
    });

    /**********************************
     * START THE DEMO
     *******************************/

    Cocoon.Store.initialize({
        sandbox: false,
        managed: true
    });

    var canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 360;
    canvas.style.cssText = "idtkscale:ScaleToFill;";
    var ctx = canvas.getContext("2d");


    var img = document.createElement("img");
    img.onload = function(e) {
        ctx.drawImage(e.target, 0, 0);
    }

    img.src = "background.jpg";

    canvas.addEventListener("click", function(e) {
        x = e.clientX;
        y = e.clientY;

        if (x >= 64 && x <= 373 && y >= 63 && y <= 87) {
            console.log("Fetch product from store");
            Cocoon.Dialog.prompt({
                title: "Product id",
                message: "The product id you would like to purchase.",
                text: "remove.ads"
            }, {
                success: function(productId) {
                    a = productId;
                    Cocoon.Store.loadProducts([a]);
                },
                cancel: function() {
                    console.log("The user has canceled the dialog.");
                }
            });
        } else if (x >= 107 && x <= 365 && y >= 171 && y <= 193) {
            console.log("Purchase product");
            Cocoon.Store.purchase(a);
        } else if (x >= 97 && x <= 376 && y >= 269 && y <= 289) {
            console.log("Restore purchases");
            Cocoon.Store.restore();
        }

    });
    document.body.appendChild(canvas);
})();