var Tools = require('./server-utils');

module.exports = {

  MainServer: function() {
    var that = this;

    /****
    STATE
    *****/

    this.serverState = {
      clientCount: 0,
      controllerCount: 0
    };

    // Auto observer: trigger onStateChange
    this.StateObserver = new Tools.Observer(that.serverState, function() {that.onStateChange()});
    this.onStateChange = function() { }; // Public events (to overwrite)

    this.addClient = function(fd, ep) { that.serverState.clientCount++; };

    this.removeClient = function(fd, ep) { that.serverState.clientCount--; };

    this.addController = function(client) { that.serverState.controllerCount++; };

    this.removeController = function(client) { that.serverState.controllerCount--; };

    this.getState = function() { return that.serverState; };

    /****
    TASKS
    *****/

    this.pendingTasks = {};
    this.timersTasks = {};
    this.lastTask = {};

    // Auto observer: trigger onChange
    this.TasksObserver = new Tools.Observer(that.pendingTasks, function() {that.onTasksChange()});
    this.onTasksChange = function() { }; // Public events (to overwrite)


    // Public events (to overwrite)
    this.onConsume = function(task) { console.log('Task consumed'); };
    this.sendTask = function(task) { console.log('Task sent');  };

    this.addTask = function(task) {
      //extract unique server goal time
      var now = new Date();
      now.setSeconds(now.getSeconds() + task.when);
      var serverTimestamp = now.getTime();
      while (that.pendingTasks.hasOwnProperty(serverTimestamp)) { serverTimestamp++; }

      //setup execution timer and add to pending tasks
      this.pendingTasks[serverTimestamp] = task;
      this.timersTasks[serverTimestamp] = new Tools.ExecuteTimer(serverTimestamp, that.consumeTask );
    };

    this.consumeTask = function(timestamp) {
      var task = that.removeTask(timestamp); // remove Task from queue
      that.lastTask = task;
      task = that.onConsume(task); // process Task
      if (task !== false) that.sendTask(task); // send task to binded publishers
    };

    this.removeTask = function(timestamp) {
      // stop and remove timer
      if (that.timersTasks[timestamp] !== undefined)
        that.timersTasks[timestamp].stop();
      delete that.timersTasks[timestamp];
      // remove from pending queue and return it
      var task = that.pendingTasks[timestamp];
      delete that.pendingTasks[timestamp];
      return task;
    };

    this.getTasks = function() {
      return {
        pendingtasks: that.pendingTasks,
        lasttask: that.lastTask
      }
    };


  }
};
