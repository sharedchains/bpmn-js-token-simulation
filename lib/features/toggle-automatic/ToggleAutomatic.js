'use strict';

var domify = require('min-dom').domify,
    domClasses = require('min-dom').classes,
    domEvent = require('min-dom').event,
    domQuery = require('min-dom').query;

var events = require('../../util/EventHelper'),
    TOGGLE_AUTOMATIC_EVENT = events.TOGGLE_AUTOMATIC_EVENT;

function ToggleAutomatic(eventBus, canvas) {
  var self = this;

  this._eventBus = eventBus;
  this._canvas = canvas;

  this.automaticMode = false;
  this.disabled = true;

  this.palette = domQuery('.animation-palette', this._canvas.getContainer());
  if (!this.palette) {
    this.palette = domify('<div class="animation-palette"></div>');
  }

  eventBus.on('import.done', function() {
    self._init();
  });
}

ToggleAutomatic.prototype._init = function() {
  this.container = domify(`
      <div class="toggle-automatic hidden">
        Automatic <span class="toggle"><i class="fa fa-magic"></i>&nbsp;<i class="fa fa-toggle-off"></i></span>
      </div>
  `);

  domEvent.bind(this.container, 'click', this.toggleAutomatic.bind(this));

  this.palette.appendChild(this.container);
  this._canvas.getContainer().appendChild(this.palette);
};

ToggleAutomatic.prototype.toggleAutomatic = function() {
  if (!this.disabled) {
    if (this.automaticMode) {
      this.container.innerHTML = 'Automatic <span class="toggle"><i class="fa fa-magic"></i>&nbsp;<i class="fa fa-toggle-off"></i></span>';

      this._eventBus.fire(TOGGLE_AUTOMATIC_EVENT, {
        automaticMode: false
      });

    } else {
      this.container.innerHTML = 'Automatic <span class="toggle"><i class="fa fa-magic"></i>&nbsp;<i class="fa fa-toggle-on"></i></span>';

      this._eventBus.fire(TOGGLE_AUTOMATIC_EVENT, {
        automaticMode: true
      });
    }
    this.automaticMode = !this.automaticMode;
  }
};

ToggleAutomatic.prototype.disableToggle = function(disable) {
  this.disabled = disable;

  if (disable) {
    domClasses(this.container).add('hidden');
  } else {
    domClasses(this.container).remove('hidden');
  }

};


ToggleAutomatic.$inject = ['eventBus', 'canvas'];

module.exports = ToggleAutomatic;