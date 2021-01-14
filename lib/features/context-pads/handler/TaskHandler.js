'use strict';

var domify = require('min-dom').domify,
    domEvent = require('min-dom').event;

var events = require('../../../util/EventHelper'),
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT,
    TOGGLE_AUTOMATIC_EVENT = events.TOGGLE_AUTOMATIC_EVENT;

function TaskHandler(eventBus) {
  let self = this;
  this._eventBus = eventBus;

  this._automaticMode = false;

  eventBus.on(TOGGLE_AUTOMATIC_EVENT, function(context) {
    self._automaticMode = context.automaticMode;
  });
}

TaskHandler.prototype.createContextPads = function(element) {

  let self = this;
  let contextPad;
  if (this._automaticMode) {
    return;
  }

  let processInstanceId = element.parent.shownProcessInstance;
  if (element.isWaiting) {
    contextPad = domify('<div class="context-pad" title="Trigger Event"><i class="fa fa-play"></i></div>');

    domEvent.bind(contextPad, 'click', function() {
      delete element.isWaiting;
      self._eventBus.fire(GENERATE_TOKEN_EVENT, {
        element: element,
        processInstanceId: processInstanceId
      });
    });

    return [{
      element: element,
      html: contextPad
    }];
  }
};

TaskHandler.$inject = ['eventBus'];

module.exports = TaskHandler;