var SocketIO = require('socket.io');
var https = require('https'),
    fs =    require('fs');

module.exports = {

  PadServer: function(port) {
    var that = this;

    // Text to display
    this.fulltext = "";
    this.progress = 0;

    // Load new text
    this.loadText = function(txt) {
      this.fulltext = txt;
      this.progress = 0;
      this.sendFullPad(this.socket);
    };

    var options = {
        // key:    fs.readFileSync('/etc/ssl/olds/app.journaldunseuljour.fr.key'),
        // cert:   fs.readFileSync('/etc/ssl/olds/app.journaldunseuljour.fr.crt'),
        // ca:     fs.readFileSync('/etc/ssl/olds/GandiStandardSSLCA2.pem')
        key:    fs.readFileSync('/etc/letsencrypt/live/app.journaldunseuljour.fr/privkey.pem'),
        cert:   fs.readFileSync('/etc/letsencrypt/live/app.journaldunseuljour.fr/fullchain.pem')
    };
    var app = https.createServer(options);
    this.socket = require('socket.io').listen(app);     //socket.io server listens to https connections
    app.listen(port, "0.0.0.0");

    // SocketIO websocket
    //this.socket = new SocketIO();
    //this.socket.listen(port);

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
