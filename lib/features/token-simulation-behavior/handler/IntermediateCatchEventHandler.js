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
  let element = context.element,
      processInstanceId = context.processInstanceId;
  let selfProcessInstanceId = element.parent.shownProcessInstance;
  let isAcrossInstances = processInstanceId !== selfProcessInstanceId;

  let tmpProcessInstanceId = isAcrossInstances ? processInstanceId: selfProcessInstanceId ;
  let alternativeProcessInstanceId = isAcrossInstances? selfProcessInstanceId : processInstanceId;

  if (!element.tokenCount) {
    element.tokenCount = {};
    element.isWaitingFromMessageFlow = !isAcrossInstances;
    element.isWaitingFromSequenceFlow = isAcrossInstances;
  }

  if ((element.isWaitingFromMessageFlow && !isAcrossInstances) || (element.isWaitingFromSequenceFlow && isAcrossInstances)) {
    if (!element.tokenCount[tmpProcessInstanceId]) {
      element.tokenCount[tmpProcessInstanceId] = 0;
    }
    element.tokenCount[tmpProcessInstanceId]++;

    this._eventBus.fire(UPDATE_ELEMENT_EVENT, {
      processInstanceId: tmpProcessInstanceId,
      element: element
    });
  } else {
    if (element.tokenCount[alternativeProcessInstanceId]) {
      element.tokenCount[alternativeProcessInstanceId]--;
      this._eventBus.fire(GENERATE_TOKEN_EVENT, {
        element: element,
        processInstanceId: alternativeProcessInstanceId
      });
    }
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

IntermediateCatchEventHandler.$inject = ['animation', 'eventBus', 'elementRegistry'];

module.exports = IntermediateCatchEventHandler;