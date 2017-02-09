/*** GarageDoorToggleButton Z-Way Home automation module **********************

-----------------------------------------------------------------------------
Author: Andreas Cederström <andreas.cederstrom@gmail.com>
Description:
    Link a sensor and a switch into a single unit. Eg. a door sensor and a 
    relay into a combined garage door device.
******************************************************************************/

function GarageDoorToggleButton (id, controller) {
    // Always call superconstructor first
    GarageDoorToggleButton.super_.call(this, id, controller);
}

inherits(GarageDoorToggleButton, AutomationModule);

_module = GarageDoorToggleButton;

GarageDoorToggleButton.prototype.init = function (config) {
    // Always call superclass' init first
    GarageDoorToggleButton.super_.prototype.init.call(this, config);

    var self = this,
        sensorId = this.config.sensor,
        relayId = this.config.relay,
    	sensor = this.controller.devices.get(sensorId);

    vDev = null;

    this.updateToggleButtonMetrics = function(dev) {
        // update vDev metrics with values of sensor
        var level = sensor.get("metrics:level");
        self.vDev.set('metrics:icon', self.getIcon(level));
        self.vDev.set('metrics:level', sensor.get("metrics:level"));
    };

    this.createVDevIfSensorsAreCreated = function(dev) {
        if(dev.id === sensorId) {
            sensor = dev;
            var level = sensor.get("metrics:level");

            self.vDev = this.controller.devices.create({
                deviceId: "GarageDoorToggleButton_" + self.id,
                defaults: {
                    metrics: {
                        multilineType: 'toggleButton',
                        title: self.getInstanceTitle(self.id),
                        icon: self.getIcon(level),
                        level: level,
                    }
                },
                overlay: {
                    deviceType: 'toggleButton',
                },
                handler: function(command){
                    if(command === 'on'){
                        try {
                            self.controller.devices.get(relayId).performCommand('on');
                            self.vDev.set('metrics:icon', GarageDoorToggleButton.ICON_BASE_URL + 'cogs.gif');
                        } catch(e) {
                            self.controller.addNotification('device-info', 'Command has failed. Error:' + e , 'device-status', relayId);
                        }
                    }
                },
                moduleId: this.id
            });

            self.updateToggleButtonMetrics(dev);

            // listen to sensor changes
            self.controller.devices.on(sensorId, 'change:metrics:level', self.updateToggleButtonMetrics);
            self.controller.devices.on(sensorId, 'change:[object Object]', self.updateToggleButtonMetrics);

        }
    };

    if (sensor) {
        self.createVDevIfSensorsAreCreated(sensor);
    }
    else {
        // refresh/create virtual device when sensors are created (after restart)
        self.controller.devices.on('created', self.createVDevIfSensorsAreCreated);
    }
};

GarageDoorToggleButton.prototype.stop = function () {
    var self = this;

	if (this.vDev) {
        this.controller.devices.remove(this.vDev.id);
        this.vDev = null;
    }

    self.controller.devices.off(this.sensorId, 'change:metrics:level', self.updateToggleButtonMetrics);
    self.controller.devices.off(this.sensorId, 'change:[object Object]', self.updateToggleButtonMetrics);
    self.controller.devices.off('created', self.createVDevIfSensorsAreCreated);

    GarageDoorToggleButton.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

GarageDoorToggleButton.prototype.getInstanceTitle = function (instanceId) {
    var instanceTitle = this.controller.instances.filter(function (instance){
        return instance.id === instanceId;
    });

    return instanceTitle[0] && instanceTitle[0].title ? instanceTitle[0].title : 'Garage Door Toggle Button ' + this.id;
}

GarageDoorToggleButton.ICON_BASE_URL = "/ZAutomation/api/v1/load/modulemedia/GarageDoorToggleButton/";

GarageDoorToggleButton.prototype.getIcon = function (level) {
    return GarageDoorToggleButton.ICON_BASE_URL + (level === "on" ? "open.png" : "closed.png");
};
