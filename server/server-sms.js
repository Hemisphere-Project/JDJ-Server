var request = require('request');
var _ = require('underscore');

var SMS_API = 'http://app.journaldunseuljour.fr/server/sms/postman.php'
var DEEPLINK = 'http://is.gd/jdj2016';

module.exports = {

  splitMSG: function(msg, splitter) {
    if (splitter === undefined || splitter == '' || splitter == null) var sms = [msg];
    else var sms = msg.split(splitter);
    sms = _.map(sms, function(txt){ return txt.trim(); });
    sms = _.without(sms, null, '');
    return sms;
  },

  HighCoSms: function(msg, splitter) {
    var that = this;

    this.messages = module.exports.splitMSG(msg, splitter);
    this.destinataires = [];

    this.addDest = function(dest) {
      if (dest.constructor === Array)
        this.destinataires = this.destinataires.concat(dest);
      else
        this.destinataires.push(dest);

      var uniqueArray = this.destinataires.filter(function(item, pos, self) { return self.indexOf(item) == pos; });
      this.destinataires = uniqueArray;
    };

    this.send = function(plateform) {

      if (this.messages.length == 0) {console.log('empty SMS: nothing sent'); return false;}
      var destinataires = _.toArray(_.groupBy(this.destinataires, function(element, index){ return index % that.messages.length; }));

      for (var k=0; k<this.messages.length; k++) {
        if (destinataires[k] === undefined || destinataires[k].length == 0) break;

        var mess = this.messages[k];
        if (plateform == 'android') mess = mess.replace("*deeplink*", DEEPLINK);
        else if (plateform == 'ios') mess = mess.replace("*deeplink*", DEEPLINK);
        else mess = mess.replace("*deeplink*", '');

        console.log('send SMS: '+mess+' => '+JSON.stringify(destinataires[k]))
        request.post( SMS_API,
              { form: {
                dest: JSON.stringify(destinataires[k]),
                msg: mess,
                token: 3737}
              },
              function (error, response, body) {
                  if (!error && response.statusCode == 200) console.log(body)
                  else console.log("error "+error+" "+response+" "+body);
              });
      }

    };

    this.sendTo = function(dests, plateform) {
      this.destinataires = [];
      this.addDest(dests);
      this.send(plateform);
    }

  }
};
