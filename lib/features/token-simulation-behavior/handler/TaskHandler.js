'use strict';

var is = require('../../../util/ElementHelper').is;

var events = require('../../../util/EventHelper'),
    CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT,
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT,
    TOGGLE_AUTOMATIC_EVENT = events.TOGGLE_AUTOMATIC_EVENT,
    UPDATE_ELEMENTS_EVENT = events.UPDATE_ELEMENTS_EVENT,
    UPDATE_ELEMENT_EVENT = events.UPDATE_ELEMENT_EVENT;

function TaskHandler(animation, eventBus, elementRegistry) {
  var self = this;
  this._animation = animation;
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;

  this._automaticMode = false;

  eventBus.on(TOGGLE_AUTOMATIC_EVENT, function(context) {
    self._automaticMode = context.automaticMode;
  });
}

TaskHandler.prototype.consume = function(context) {

  // fire to generate token on self
  if (this._automaticMode) {
    this._eventBus.fire(GENERATE_TOKEN_EVENT, context);
  } else {
    let element = context.element,
        processInstanceId = context.processInstanceId;

    element.isWaiting = true;

    this._eventBus.fire(UPDATE_ELEMENT_EVENT, {
      processInstanceId: processInstanceId,
      element: element
    });
  }
};

TaskHandler.prototype.generate = function(context) {
  var self = this;

  var element = context.element,
      processInstanceId = context.processInstanceId;

  var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
    return is(outgoing, 'bpmn:SequenceFlow') || (is(element, 'bpmn:SendTask') && is(outgoing, 'bpmn:MessageFlow'));
  });

  outgoingSequenceFlows.forEach(function(outgoing) {
    self._animation.createAnimation(outgoing, processInstanceId, function() {
      self._eventBus.fire(CONSUME_TOKEN_EVENT, {
        element: outgoing.target,
        processInstanceId: processInstanceId
      });
    });
  });

  var tasks = this._elementRegistry.filter(function(element) {
    return is(element, [
      'bpmn:BusinessRuleTask',
      'bpmn:CallActivity',
      'bpmn:ManualTask',
      'bpmn:ScriptTask',
      'bpmn:SendTask',
      'bpmn:ServiceTask',
      'bpmn:Task',
      'bpmn:UserTask'
    ]);
  });

  this._eventBus.fire(UPDATE_ELEMENTS_EVENT, {
    elements: tasks
  });
};

TaskHandler.$inject = ['animation', 'eventBus', 'elementRegistry'];

module.exports = TaskHandler;