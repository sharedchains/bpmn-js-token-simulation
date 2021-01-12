'use strict';

const events = require('../../util/EventHelper');

function LogEvents(eventBus) {
  var self = this;

  for (const event in events) {
    eventBus.on(events[event], function(context) {

      const contextString = self.stringify(context, 2, null, 2);

      const date = new Date();
      const dateString = date.toLocaleTimeString() + ':' + date.getUTCMilliseconds();

      console.log(`INVOKED EVENT ${events[event]} AT ${dateString} for CONTEXT ${contextString}`);
    });
  }
}

LogEvents.prototype.stringify = function(val, depth, replacer, space) {
  depth = isNaN(+depth) ? 1 : depth;

  function _build(key, val, depth, o, a) { // (JSON.stringify() has it's own rules, which we respect here by using it for property iteration)
    return !val || typeof val != 'object' ? val : (a = Array.isArray(val), JSON.stringify(val, function(k, v) {
      if (a || depth > 0) {
        if (replacer) v = replacer(k, v);
        if (!k) return (a = Array.isArray(v), val = v);
        !o && (o = a ? [] : {});
        o[k] = _build(k, v, a ? depth : depth - 1);
      }
    }), o || (a ? [] : {}));
  }

  return JSON.stringify(_build('', val, depth), null, space);
};

LogEvents.$inject = ['eventBus'];

module.exports = LogEvents;