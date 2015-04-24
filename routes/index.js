var express = require('express');
var router = express.Router();
var db = require('orchestrate')(process.env.ORCHESTRATE_API_KEY);
var moment = require('moment');




/* GET home page. */
router.get('/', function(req, res) {

  var offset = req.param("page") ? (req.param("page") - 1) * 10 : 0;

  db.newSearchBuilder()
    .collection('experimental')
    .limit(10)
    .offset(offset)
    .query('*')
    .then(function (things){
      res.render('index', { title: 'Express', things: things.body.results, totalCount: things.body.total_count});
    });


});


router.get('/p/:id', function(req, res) {
  db.get('experimental', req.param("id"))
  .then(function (results){
    db.newEventReader()
    .from('experimental', req.param("id"))
    .type('post')
    .then(function (events){

      events.body.results.forEach(function (obj, index){
          events.body.results[index].date = moment.unix(obj.timestamp / 1000).format('MMMM Do YYYY, h:mm:ss a');
      });

      res.render('post', {
        title: results.body["sub-title"],
        content: results.body["sub-dis"],
        responses: events.body.results
      });
    });
  });
});


router.post('/p/:id', function(req, res) {
  var id = req.param("id")
  , post = {
    text: req.param("answer")
  }

  db.newEventBuilder()
    .from('experimental', id)
    .type('post')
    .data(post)
    .then(function (results){
      res.redirect("/p/" + id);
    });
});

/** POST / create a new thing **/
router.post('/thing', function (req, res){
  var title = req.param("title")
  , subject = req.param("subject")
  , date = moment().format('MMMM Do YYYY, h:mm:ss a')


  db.post('experimental', {
    "sub-title" : title,
    "sub-dis" : subject,
    "date" : date
  })
  .then(function (result) {
    var responseKey = result.headers.location.split("/")[3];
    res.redirect('/p/' + responseKey);
  })
  .fail(function (err) {

  });
});

module.exports = router;
