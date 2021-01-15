'use strict';

var is = require('../../util/ElementHelper').is;

var events = require('../../util/EventHelper'),
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT,
    RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT;

var NOT_SELECTED_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--token-simulation-red-lighten-70'),
    SELECTED_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--token-simulation-green-lighten-71'),
    BLACK_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--token-simulation-grey-darken-30');

function getNext(gateway) {
  var outgoing = gateway.outgoing.filter(isSequenceFlow);

  var index = outgoing.indexOf(gateway.sequenceFlow);

  if (outgoing[index + 1]) {
    return outgoing[index + 1];
  } else {
    return outgoing[0];
  }
}

function isSequenceFlow(connection) {
  return is(connection, 'bpmn:SequenceFlow');
}


function ExclusiveGatewaySettings(eventBus, elementRegistry, graphicsFactory) {
  var self = this;

  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;

  eventBus.on(TOGGLE_MODE_EVENT, function(context) {
    var simulationModeActive = context.simulationModeActive;

    if (!simulationModeActive) {
      self.resetSequenceFlows();
    } else {
      self.setSequenceFlowsDefault();
    }
  });

  eventBus.on(RESET_SIMULATION_EVENT, function() {
    self.resetSequenceFlowsForSimulation();
  });
}

ExclusiveGatewaySettings.prototype.setSequenceFlowsDefault = function() {
  var self = this;

  var exclusiveGateways = this._elementRegistry.filter(function(element) {
    return is(element, 'bpmn:ExclusiveGateway');
  });

  exclusiveGateways.forEach(function(exclusiveGateway) {
    if (exclusiveGateway.outgoing.filter(isSequenceFlow).length) {
      self.setSequenceFlow(exclusiveGateway);
    }
  });
};

ExclusiveGatewaySettings.prototype.resetSequenceFlows = function() {
  var self = this;

  var exclusiveGateways = this._elementRegistry.filter(function(element) {
    return is(element, 'bpmn:ExclusiveGateway');
  });

  exclusiveGateways.forEach(function(exclusiveGateway) {
    if (exclusiveGateway.outgoing.filter(isSequenceFlow).length) {
      self.resetSequenceFlow(exclusiveGateway);
    }
  });
};

ExclusiveGatewaySettings.prototype.resetSequenceFlow = function(gateway) {
  if (gateway.sequenceFlow) {
    delete gateway.sequenceFlow;
  }
};

ExclusiveGatewaySettings.prototype.setSequenceFlow = function(gateway, resetFlows) {
  var self = this;

  var outgoing = gateway.outgoing.filter(isSequenceFlow);

  if (!outgoing.length) {
    return;
  }

  var sequenceFlow = gateway.sequenceFlow;

  if (!resetFlows) {
    if (sequenceFlow) {

      // set next sequence flow
      gateway.sequenceFlow = getNext(gateway);
    } else {

      // set first sequence flow
      gateway.sequenceFlow = outgoing[0];
    }
  }

  // set colors
  gateway.outgoing.forEach(function(outgoing) {
    if (outgoing === gateway.sequenceFlow) {
      self.setColor(outgoing, SELECTED_COLOR);
    } else {
      self.setColor(outgoing, NOT_SELECTED_COLOR);
    }
  });
};

ExclusiveGatewaySettings.prototype.resetSequenceFlowToDark = function(gateway) {
  var self = this;

  var outgoing = gateway.outgoing.filter(isSequenceFlow);
  if (!outgoing.length) {
    return;
  }

  // set colors
  gateway.outgoing.forEach(function(outgoing) {
    self.setColor(outgoing, BLACK_COLOR);
  });
};

ExclusiveGatewaySettings.prototype.resetSequenceFlowsForSimulation = function() {
  var self = this;

  var exclusiveGateways = this._elementRegistry.filter(function(element) {
    return is(element, 'bpmn:ExclusiveGateway');
  });

  exclusiveGateways.forEach(function(exclusiveGateway) {
    if (exclusiveGateway.outgoing.filter(isSequenceFlow).length) {
      self.setSequenceFlow(exclusiveGateway, true);
    }
  });
};

ExclusiveGatewaySettings.prototype.setColor = function(sequenceFlow, color) {

  var label = sequenceFlow.label;
  var businessObject = sequenceFlow.businessObject;

  businessObject.di.set('stroke', color);

  var gfx = this._elementRegistry.getGraphics(sequenceFlow);

  this._graphicsFactory.update('connection', sequenceFlow, gfx);

  if (label) {
    this._graphicsFactory.update('connection', label, this._elementRegistry.getGraphics(label));
  }
};

ExclusiveGatewaySettings.$inject = ['eventBus', 'elementRegistry', 'graphicsFactory'];

module.exports = ExclusiveGatewaySettings;