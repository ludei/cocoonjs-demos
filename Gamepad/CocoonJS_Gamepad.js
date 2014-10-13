(function () {
    // The CocoonJS must exist before creating the extension.
    if (typeof window.CocoonJS === 'undefined' || window.CocoonJS === null) throw("The CocoonJS object must exist and be valid before creating any extension object.");

    /**
     * This namespace represents the functionalities related to OUYA android gaming control.
     * @namespace
     */
    CocoonJS.Gamepad = {};

    CocoonJS.Gamepad.nativeExtensionObjectAvailable = CocoonJS.nativeExtensionObjectAvailable && typeof window.ext.Gamepad !== 'undefined';

    /**
    * This enumeration simplifies the access to the indices for button and axis elements according to the HTML5 gamepad standard API specification.
    * You may use these values to access the buttons and axes arrays inside the Gamepad objects, according to the W3C gamepad API specification.
    * For example: 
    * gamepad.button[CocoonJS.Gamepad.BUTTON_LEFT_TRIGGER]; 
    * gamepad.axes[CocoonJS.Gamepad.AXIS_LEFT_JOYSTICK_X]; 
    * @namespace
    */
    CocoonJS.Gamepad.Indices = {
        /**
        * Represents the button 0 (the A on the XBOX controller, the O on the OUYA controller)
        */
        BUTTON_0                : 0, 
        /**
        * Represents the button 1 (the B on the XBOX controller, the A on the OUYA controller)
        */
        BUTTON_1                : 1,
        /**
        * Represents the button 2 (the X on the XBOX controller, the U on the OUYA controller)
        */
        BUTTON_2                : 2,
        /**
        * Represents the button 3 (the Y on the XBOX controller, the Y on the OUYA controller)
        */
        BUTTON_3                : 3,
        /**
        * Represents the left bumper button.
        */
        BUTTON_LEFT_BUMPER      : 4,
        /**
        * Represents the right bumper button.
        */
        BUTTON_RIGHT_BUMPER     : 5,
        
        /**
        * Represents the left trigger button.
        */
        BUTTON_LEFT_TRIGGER     : 6,
        /**
        * Represents the right trigger button.
        */
        BUTTON_RIGHT_TRIGGER    : 7,
        
        /**
        * Represents the left joystick button.
        */
        BUTTON_LEFT_JOYSTICK    : 10,
        /**
        * Represents the right joystick button.
        */
        BUTTON_RIGHT_JOYSTICK   : 11,
        /**
        * Represents the dpad up button.
        */
        BUTTON_DPAD_UP          : 12,
        /**
        * Represents the dpad down button.
        */
        BUTTON_DPAD_DOWN        : 13,
        /**
        * Represents the dpad left button.
        */
        BUTTON_DPAD_LEFT        : 14,
        /**
        * Represents the dpad right button.
        */
        BUTTON_DPAD_RIGHT       : 15,
        /**
        * Represents the menu button.
        */
        BUTTON_MENU             : 16,
        
        /**
        * Represents the left joystick horizontal axis.
        */
        AXIS_LEFT_JOYSTICK_X     : 0,
        /**
        * Represents the left joystick vertical axis.
        */
        AXIS_LEFT_JOYSTICK_Y     : 1,
        /**
        * Represents the right joystick horizontal axis.
        */
        AXIS_RIGHT_JOYSTICK_X    : 2,
        /**
        * Represents the right joystick vertical axis.
        */
        AXIS_RIGHT_JOYSTICK_Y    : 3
    };

    // If the extension is present and the navigator does not provide the gamepad API:
    // 1.- Add the getGamepads function to the navigator object.
    // 2.- Replace the window add and remove event listener functions to call to the extension for the gamepad related events.
    var systemSupportsGamepads = navigator["getGamepads"] || navigator["webkitGetGamepads"];
    if (systemSupportsGamepads) 
    {
        if (!navigator.getGamepads)
        {
            console.log("navigator.getGamepads does not exist.");
            if (navigator.webkitGetGamepads)
            {
                console.log("navigator.webkitGamepads exists, adding navigator.getGamepads to point to it.");
                navigator.getGamepads = navigator.webkitGetGamepads;
            }
            else
            {
                console.log("navigator.webkitGetGamepads does not exist either.");
            }
        }
    }
})();



