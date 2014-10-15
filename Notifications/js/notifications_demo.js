var pushRegistered = false;
var channel = "";
var subscribed = false;

var isNotificationsAvailable = false;

/**
 * Helper functions
 */

function setLogText(msg) {
    var log = document.getElementById('log');
    log.innerHTML = msg + "<br>" + log.innerHTML;
}

function registerPush() {
    if (isNotificationsAvailable) {
        if (pushRegistered)
            alert('Already registered in the push service');
        else
            Cocoon.Notification.Push.register();
    } else {
        setLogText("Unable to register. Notification service available in this platform");
    }
}

function unregisterPush() {
    if (isNotificationsAvailable) {
        if (pushRegistered)
            Cocoon.Notification.Push.unregister();
        else {
            alert("Not yet registered in the notification service");
            onPushNotificationServiceUnregistered();
        }
    } else {
        setLogText("Sorry, no notification Service available in this platform");
    }
}

function subscribe() {
    if (isNotificationsAvailable) {
        //The channel name must start with a letter and contain only letters, numbers, dashes, and underscores.
        var regexp = /[^\w_-\d]/i;
        channel = document.getElementById("channel").value;

        var validString = !regexp.test(channel);
        if ((channel.length > 4) && validString) {
            Cocoon.Notification.unsubscribe(channel);
            Cocoon.Notification.subscribe(channel);


            setLogText("Subscribed to channel: " + channel);
            alert("Subscribed to channel: " + channel);
            subscribed = true;

        } else {
            setLogText("Error subscribing to channel: " + channel + ". The channel identifier must have more than 4 characters and contain only letters, numbers, dashes, and underscores");
            alert("Error subscribing to channel: " + channel + ". The channel identifier must have more than 4 characters and contain only letters, numbers, dashes, and underscores");
            subscribed = false;
        }
    } else {
        setLogText("Sorry, no notification Service available in this platform");
    }
}

function sendPush() {
    if (isNotificationsAvailable) {
        if (pushRegistered) {
            if (subscribed) {
                var message = document.getElementById('message').value;
                var data = document.getElementById('data').value;
                var badge = Number(document.getElementById('badge').value);
                var sound = (document.getElementById('sound').value.toLowerCase() == "true");
                var userData = JSON.parse(data);
                var channels = new Array();
                channels[0] = channel;

                var pushNotification = Cocoon.Notification.Push.create({
                    message: message,
                    soundEnabled: sound,
                    badgeNumber: badge,
                    userData: userData,
                    channels: channels,
                    expirationTime: 0,
                    expirationTimeInterval: 0
                });

                var pushNotificationId = Cocoon.Notification.Push.send(pushNotification);

            } else {
                alert("Subscribe to a channel before sending push notifications.");
            }

        } else {
            alert("Register with the Push service before sending notifications.");
        }
    } else {
        setLogText("Sorry, no Push service available in this platform.");
    }
}

function sendLocal() {
    if (isNotificationsAvailable) {
        var message = document.getElementById('message').value;
        var data = document.getElementById('data').value;
        var badge = Number(document.getElementById('badge').value);
        var sound = (document.getElementById('sound').value.toLowerCase() == "true");
        var delay = Number(document.getElementById('delay').value) * 1000;
        var userData = JSON.parse(data);

        var scheduleTime = new Date().getTime() + delay;

        var localNotification = Cocoon.Notification.Local.create({
            message: message,
            soundEnabled: sound,
            badgeNumber: badge,
            userData: userData,
            contentBody: "This is the local notification body",
            contentTitle: "Local notification title",
            date: scheduleTime
        });


        createCancelNotificationButton(localNotification.id);
        Cocoon.Notification.Local.send(localNotification);
    } else {
        setLogText("Sorry, no notification Service available in this platform");
    }
}

function createCancelNotificationButton(notificationId) {
    var target = document.getElementById("cancelContainer");
    var newButton = document.createElement("input");

    newButton.setAttribute('type', 'button');
    newButton.setAttribute('name', 'cancel');
    newButton.setAttribute('value', 'Cancel Notification ' + notificationId);
    newButton.setAttribute("id", notificationId);
    newButton.addEventListener("touch", cancelLocal);
    newButton.addEventListener("click", cancelLocal);

    target.appendChild(newButton);
}

function cancelLocal(e) {
    if (isNotificationsAvailable) {

        Cocoon.Notification.Local.cancelAllNotifications(e.target.id);

        //Make the button dissapear
        var target = document.getElementById(e.target.id);
        target.parentNode.removeChild(target);
    }

}

function cancelAllLocal() {
    if (isNotificationsAvailable) {
        var target = document.getElementById("cancelContainer");
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }

        Cocoon.Notification.Local.cancelAllNotifications();
    } else {
        setLogText("Sorry, no notification Service available in this platform.");
    }
}

function clearIconBadge() {
    if (isNotificationsAvailable) {
        Cocoon.Notification.setBadgeNumber(0);
    } else {
        setLogText("Sorry, no notification Service available in this platform.");
    }
}

/**
 * Main function
 */

function start() {

    if (Cocoon.Notification.nativeAvailable) {

        isNotificationsAvailable = true;

        Cocoon.Notification.setBadgeNumber(0);

        /**
         * Local notifications events
         */

        Cocoon.Notification.Local.on("notification", {
            received: function(userdata) {
                //alert("Local notification received, data: " + JSON.stringify(userData));
                setLogText("Local notification received, data: " + JSON.stringify(userData));
            }
        });

        /**
         * Push notifications events
         */

        Cocoon.Notification.Push.on("register", {
            success: function() {
                pushRegistered = true;
                alert("Push notification service successfully registered")
                setLogText("Push notification service successfully registered");
            },
            unregister: function() {
                pushRegistered = false;
                alert("Push notification service unregistered")
                setLogText("Push notification service unregistered");
            },
            error: function() {
                pushRegistered = false;
                alert("Push notification service failed to register, error: " + error);
                setLogText("Push notification service failed to register, error: " + error);
            }
        });

        Cocoon.Notification.Push.on("notification", {
            received: function(userdata) {
                alert("Push notification received data: " + JSON.stringify(userData));
                setLogText("Push notification received data: " + JSON.stringify(userData));
            }
        });

        Cocoon.Notification.Push.on("deliver", {
            success: function(notificationId) {
                setLogText("Push notification successfully delivered, id: " + notificationId);
            },
            error: function(notificationId, error) {
                setLogText("Push notification delivery error, id: " + notificationId + ", error: " + error);
            }
        });

        Cocoon.Notification.start();

    }
}

window.addEventListener("load", start, false);

