const express = require('express');
const bodyPaser = require('body-parser');
const session = require('express-session');
const massive = require('massive');
const axios = require('axios');
const url = require('url');

require('dotenv').config();
massive(process.env.CONNECTION_STRING).then(db => {
  console.log('-- DB CONNECTED --')
  app.set('db', db)
});

const app = express();
app.use(bodyPaser.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
}));
// app.use(express.static(`${__dirname}/../build`));

app.post('/api/step2', (req, res)=>{
  console.log('req.body.code', req.body.code)
  const { code } = req.body

  const payload = {
    client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
    client_secret: process.env.REACT_APP_AUTH0_CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: `http://${req.headers.host}/auth/callback`
  }

  axios
    .post(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`, payload)
    .then(result=>{
      res.status(200).send(result.data)
    })
    .catch(err=>console.log('-- err step 2--', err))

})

app.post('/api/step3', (req, res)=>{
  const { access_token } = req.body
  axios
    .get(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/userinfo?access_token=${access_token}`)
    .then(result=>{
      res.status(200).send(result.data)
    })
    .catch(err=> console.log('-- err step 3 --', err))
})

app.post('/api/step4', (req, res) => {
  // here we get userData back from client, store it on session
  const userData = req.body
  // here we have auth0 id as userData.sub 
  // we can use this to look up user in the database
  const db = app.get('db')
  db
    .find_user_by_auth0_id(userData.sub)
    .then(result=>{
      if( result[0] ){
        const user = result[0]
        req.session.user = user
        res.status(200).send({
          userStatus: 'existing user found',
          user: req.session.user
        })
      } else {
        db
          .create_user([userData.sub, userData.email, userData.name, userData.picture])
          .then(result =>{
            req.session.user = result[0]
            res.status(200).send({
              userStatus: 'new user registered',
              user: result[0]
            })
          })
      }
    })

})

app.get('/test', (req, res)=>{console.log('got here'); res.sendStatus(200)})
app.get('/auth/callback', (req, res) => {
  
  
  
  // STEP 1.)
  //Make an object called payload with the code recieved from the clientside, client_id, client_secret, grant_type, redirect_uri 
  //hint: code is recieved from client side as a query
  
  const {
    REACT_APP_AUTH0_CLIENT_ID,
    REACT_APP_AUTH0_CLIENT_SECRET
  } = process.env
  const { code } = req.query

  let payload ={
    
    client_id: REACT_APP_AUTH0_CLIENT_ID,
    client_secret: REACT_APP_AUTH0_CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: `http://${req.headers.host}/auth/callback`
    
  }

  console.log('req.query.code ', req.query.code)

  res.redirect(url.format({
    pathname:"/",
    query: {
      "code": code
    }
  }))
  //STEP 2.)
  // WRITE a FUNCTION that RETURNS an axios POST with the payload as the body
  function tradeCodeForAccessToken(){
    
    //code here..
    return axios
            .post(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`, payload)

    
  }
  
  //STEP 3.)
  // WRITE a FUNCTION that accepts the access token as a parameter and RETURNS an axios GET to auth0 that passes the access token as a query
  function tradeAccessTokenForUserInfo(){
    
    //code here ..
    
  }
  
  
  //STEP 4.)
  
  // WRITE a FUNCTION that accepts the userInfo as a parameter and RETURNS a block of code.
  // Your code should set session, check your database to see if user exists and return thier info or if they dont exist, insert them into the database
  function storeUserInfoInDataBase(){
    
    //code here...
    
  }
  
  //Final Code, Uncomment after completeing steps 1-4 above
  
  // tradeCodeForAccessToken()
  // .then(accessToken => tradeAccessTokenForUserInfo(accessToken))
  // .then(userInfo => storeUserInfoInDataBase(userInfo));
  // })
  
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.send();
});

app.get('/api/user-data', (req, res) => {
  res.json({ user: req.session.user });
});

function checkLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
}

app.get('/api/secure-data', checkLoggedIn, (req, res) => {
  res.json({ someSecureData: 123 });
});

const SERVER_PORT = process.env.SERVER_PORT || 3044;
app.listen(SERVER_PORT, () => {
  console.log('Server listening on port ' + SERVER_PORT);
});
