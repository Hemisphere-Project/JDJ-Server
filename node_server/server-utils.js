

module.exports = {

  ExecuteTimer: function(atTime, fn) {
    var that = this;
    this.atTime = atTime;
    this.timerjs = null;
    this.callback = fn;
    this.start = function() {
      var delay = Math.max(1, (atTime-(new Date()).getTime()));
      this.timerjs = setTimeout(function(){fn(atTime)}, delay);
    };
    this.stop = function() { clearTimeout(this.timerjs) };

    this.start();
  },

  Observer: function(obj, callback) {
    var that = this;
    this.object = obj;
    this.callback = callback;
    this.dirty = false;
    this.timerjs = null;

    this.trigger = function(c) { that.dirty=true };

    this.start = function() {
      this.dirty = false;
      Object.observe(that.object, that.trigger );
      this.timerjs = setInterval(function() { if (that.dirty) that.callback(); that.dirty=false; }, 300);
    };
    this.stop = function() {
      Object.unobserve(that.object, that.onMove );
      clearInterval(that.timerjs);
    };

    this.start();
  }

};
