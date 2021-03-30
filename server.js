const app = require('./app')
const express = require('express')
const cors = require('cors');

const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.urlencoded({extended:true}))
app.use(express.json())

const session = require('express-session')
app.use(session({
  secret: 'edurekaSecret',
  resave: false,
  saveUninitialized: true
}));


app.set('view engine', 'ejs')
app.set('views', './views')

let sess;

const NewsList = require('./models/News_model');

app.get('/',(req,res) => {
    sess=req.session;
    sess.email=" "
   
    res.render('signin',
      { invalid: req.query.invalid?req.query.invalid:'',
         msg: req.query.msg?req.query.msg:''})    
});

app.get('/top-news', (req, res) => {

  NewsList.find({ category: 'normal' }, (err, users) => {
      if(err) res.status(500).send(err);
      res.status(200).send(users);
  }).limit(3);
});

app.get('/top-sports', (req, res) => {

  NewsList.find({ category: 'sports'}, (err, users) => {
      if(err) res.status(500).send(err);
      res.status(200).send(users);
  }).limit(3);
});


const server = app.listen(port, () => {
  console.log('App started on ' + port);
});