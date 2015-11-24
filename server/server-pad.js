var SocketIO = require('socket.io');

module.exports = {

  PadServer: function(port) {
    var that = this;

    // Text to display
    this.fulltext = "default";
    this.progress = 0;

    // Load new text
    this.loadText = function(txt) {
      this.fulltext = txt;
      this.progress = 0;
      this.sendFullPad(this.socket);
    };

    // SocketIO websocket
    this.socket = new SocketIO();
    this.socket.listen(port);

    // Send the complete PAD status to dest
    this.sendFullPad = function(dest) {
      dest.emit('fulltext', that.fulltext);
      dest.emit('progress', that.progress);
    }

    // Increment progress and send
    this.next = function() {
      that.progress++;
      that.socket.emit('progress', that.progress);
    }

    // Events binding
    this.socket.on('connection', function(client){
      client.on('keypressed', function() {that.next()});
      that.sendFullPad(client);
    });

    this.socket.on('error', function(err) {
        console.log('Socket.io Error: '+err);
    });

  }
};
