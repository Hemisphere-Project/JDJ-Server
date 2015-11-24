var request = require('request');

var SMS_API = 'http://app.journaldunseuljour.fr/server/sms/postman.php'

module.exports = {

  HighCoSms: function(msg) {
    this.message = msg;
    this.destinataires = [];

    this.addDest = function(dest) {
      if (dest.constructor === Array)
        this.destinataires = this.destinataires.concat(dest);
      else
        this.destinataires.push(dest);

      var uniqueArray = this.destinataires.filter(function(item, pos, self) { return self.indexOf(item) == pos; });
      this.destinataires = uniqueArray;
    };

    this.send = function() {
      request.post( SMS_API,
          { form: {
            dest: JSON.stringify(this.destinataires),
            msg: this.message,
            token: 3737}
          },
          function (error, response, body) {
              if (!error && response.statusCode == 200) console.log(body)
              else console.log("error "+error+" "+response+" "+body);
          }
      );

    };

  }
};
