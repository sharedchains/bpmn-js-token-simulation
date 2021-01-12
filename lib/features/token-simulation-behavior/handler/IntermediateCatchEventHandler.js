'use strict';

var elementHelper = require('../../../util/ElementHelper'),
    is = elementHelper.is;

var events = require('../../../util/EventHelper'),
    CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT,
    UPDATE_ELEMENT_EVENT = events.UPDATE_ELEMENT_EVENT,
    UPDATE_ELEMENTS_EVENT = events.UPDATE_ELEMENTS_EVENT,
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT;

function IntermediateCatchEventHandler(animation, eventBus, elementRegistry) {
  this._animation = animation;
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
}

IntermediateCatchEventHandler.prototype.consume = function(context) {
  var element = context.element,
      processInstanceId = context.processInstanceId;
  var selfProcessInstanceId = element.parent.shownProcessInstance;
  var isAcrossInstances = processInstanceId !== selfProcessInstanceId;

  if (!isAcrossInstances) {
    if (!element.tokenCount) {
      element.tokenCount = {};
    }

    if (!element.tokenCount[processInstanceId]) {
      element.tokenCount[processInstanceId] = 0;
    }

    element.tokenCount[processInstanceId]++;

    if (!element.isWaiting) {
      element.isWaiting = true;
    }
  } else if (element.isWaiting) {
    element.isWaiting = false;
  }
  this._eventBus.fire(UPDATE_ELEMENT_EVENT, {
    processInstanceId: processInstanceId,
    element: element
  });

  if (isAcrossInstances) {
    element.tokenCount[selfProcessInstanceId]--;

    this._eventBus.fire(GENERATE_TOKEN_EVENT, {
      element: element,
      processInstanceId: selfProcessInstanceId
    });
  }
};

IntermediateCatchEventHandler.prototype.generate = function(context) {
  var self = this;

  var element = context.element,
      processInstanceId = context.processInstanceId;

  var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
    return is(outgoing, 'bpmn:SequenceFlow');
  });

  outgoingSequenceFlows.forEach(function(connection) {
    self._animation.createAnimation(connection, processInstanceId, function() {
      self._eventBus.fire(CONSUME_TOKEN_EVENT, {
        element: connection.target,
        processInstanceId: processInstanceId
      });
    });
  });

  var parent = element.parent;

  var events = this._elementRegistry.filter(function(element) {
    return is(element, 'bpmn:IntermediateCatchEvent') &&
           element.parent === parent;
  });

  this._eventBus.fire(UPDATE_ELEMENTS_EVENT, {
    processInstanceId: processInstanceId,
    elements: events
  });
};

IntermediateCatchEventHandler.$inject = [ 'animation', 'eventBus', 'elementRegistry' ];

module.exports = IntermediateCatchEventHandler;