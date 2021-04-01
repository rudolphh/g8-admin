const dotenv = require('dotenv').config();
const app = require('./app')
const express = require('express')
const cors = require('cors');

const iplocate = require('node-iplocate');
const publicIP = require('public-ip');
const fetch = require('node-fetch');
const {LocalStorage} = require('node-localstorage');
const http = require('http');
const socketIO = require('socket.io');

const frontHostURL = process.env.PROD ? process.env.PROD : "http://localhost:4200"

const port = process.env.PORT || 4000;
let localstorage= new LocalStorage('./Scratch')

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
  }).sort({ insertTime: -1 }).limit(3);
});

app.get('/top-sports', (req, res) => {

  NewsList.find({ category: 'sports'}, (err, users) => {
      if(err) res.status(500).send(err);
      res.status(200).send(users);
  }).sort({ insertTime: -1 }).limit(3);
});

app.get('/weather', (err, response) => {

  publicIP.v4()
  .then(ip=>{
      iplocate(ip)
      .then((results)=>{
          let city=results.city
          let country=results.country_code
          //console.log(results.city+","+results.country_code)

          let url=`http://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=e89bbf79ee4c5ca05e9ba54a351cb0b5`
          fetch(
              url,
              {method:'GET'})
          .then(res=>res.json())
          .then(json=>{
              //console.log(json)
              response.send(json)
          })
          .catch(err=>{throw err})
      })
  })

});


const server = app.listen(port, () => {
  console.log('App started on ' + frontHostURL);
});

let io = socketIO(server,{
  cors: {
    origins: [frontHostURL]
  }
})

io.sockets.on('connection',(socket)=>{
  console.log('a user connected (socket)')
  var city;

  let list=socket.client.conn.server.clients
  let users=Object.keys(list)


  //consuming my events with labels 
  socket.on('nick',(nick)=>{
       socket.nickname=nick
       
       //console.log(users)
       socket.emit('userList',users)
  })


  socket.on('chat',(data)=>{
      
      publicIP.v4()
       .then(ip=>{
           iplocate(ip)
            .then((results)=>{
                var city=JSON.stringify(results.city,null,2)
                localstorage.setItem('userLocal',city)
                //console.log('city: ',city)
            })
       })

      if(socket.nickname){
          let nickname=socket.nickname
          let curDate = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          let payload={
              message:data,
              nick:nickname,
              date:curDate,
              location:localstorage.getItem('userLocal')
              //location:city
          }

          console.log('payload: ', payload)
          //socket.emit('userList',users)
          //socket.emit('chat',payload)
          socket.broadcast.emit('chat',payload)
      }else{
         //do nothing
      }
  })
})

////////// contact form

const Querylist = require('./models/Query_model');

app.post('/addQuery', (req, res)=>{
  //console.log('request.body: ',req.body)

  //insert into db
  let data=req.body

  Querylist.create(
    data, 
    (err, data) => 
      {
        if(err) return res.status(500).send('There was a problem registering user')
        console.log(`Inserted ... ${data} `)
        //const htmlMsg = encodeURIComponent('Added Query DONE !');
        //res.redirect('/admin/newsForm/?msg=' + htmlMsg)

        //send email
        const sgMail = require('@sendgrid/mail')
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)

        body =`<p>Dear ${data.firstname} ${data.lastname},</p>`
        body += `<p>We received your query (id: ${data._id}) and will respond shortly</p>`
        body += "Thanks,<br>"
        body += "G8 News Team"

        const msg = {
          to: data.email, // Change to your recipient
          //from: 'jazz7000@hotmail.com', // Change to your verified sender
          from: {
            email: 'ru@rudyah.com',
            name: 'G8 News Team'
        },
          subject: 'Your query received',
          text: 'textTest',
          html: body,
        }
        sgMail
          .send(msg)
          .then(() => {
            console.log('Email sent')
            res.send(true)
          })
          .catch((error) => {
            console.error(error)
            res.send(false)
          })

        
      }
  )            
})