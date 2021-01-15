'use strict';

var is = require('../../util/ElementHelper').is;

var events = require('../../util/EventHelper'),
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT,
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT,
    RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT,
    RESET_COLORS_EVENT = events.RESET_COLORS_EVENT;

var GENERATED_TOKEN_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--token-simulation-blue-base-67');

var VERY_HIGH_PRIORITY = 50000;
var LOW_PRIORITY = 500;

function PreserveElementColors(eventBus, elementRegistry, graphicsFactory) {
  var self = this;

  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;

  this.elementColors = {};

  eventBus.on(TOGGLE_MODE_EVENT, VERY_HIGH_PRIORITY, function(context) {
    var simulationModeActive = context.simulationModeActive;

    if (!simulationModeActive) {
      self.resetColors(true);
      self.elementColors = {};
    } else {
      self.preserveColors();
    }
  });

  eventBus.on(GENERATE_TOKEN_EVENT, LOW_PRIORITY, function(context) {
    self.setColor(context.element, '#000000', GENERATED_TOKEN_COLOR);
  });

  eventBus.on([RESET_SIMULATION_EVENT, RESET_COLORS_EVENT], VERY_HIGH_PRIORITY, function() {
    self.resetColors();
  });
}

PreserveElementColors.prototype.preserveColors = function() {
  var self = this;

  this._elementRegistry.forEach(function(element) {
    self.elementColors[element.id] = {
      stroke: element.businessObject.di.get('stroke'),
      fill: element.businessObject.di.get('fill')
    };

    self.setColor(element, '#000000', '#fff');
  });
};

PreserveElementColors.prototype.resetColors = function(resetAll) {
  var self = this;

  this._elementRegistry.forEach(function(element) {
    if (self.elementColors[element.id]) {
      if (!resetAll && is(element, 'bpmn:SequenceFlow')) {
        return;
      }
      self.setColor(element, self.elementColors[element.id].stroke, self.elementColors[element.id].fill);
    }
  });
};

PreserveElementColors.prototype.setColor = function(element, stroke, fill) {
  var businessObject = element.businessObject;

  businessObject.di.set('stroke', stroke);
  businessObject.di.set('fill', fill);

  var gfx = this._elementRegistry.getGraphics(element);

  var type = element.waypoints ? 'connection' : 'shape';

  this._graphicsFactory.update(type, element, gfx);
};

PreserveElementColors.$inject = [ 'eventBus', 'elementRegistry', 'graphicsFactory' ];

module.exports = PreserveElementColors;