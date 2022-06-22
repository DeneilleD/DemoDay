module.exports = function(app, passport, db, multer, ObjectId) {

 // Image Upload Code =========================================================================
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + ".png")
  }
});
var upload = multer({storage: storage}); 
const twilio = require('twilio');

const accountSid = 'AC9e5d1d413296c0f29ae8ebd56dd5f96f'; // Your Account SID from www.twilio.com/console
const authToken = 'd4121e215382597bbe543c232d43e891'; // Your Auth Token from www.twilio.com/console
const client = new twilio('AC9e5d1d413296c0f29ae8ebd56dd5f96f', 'd4121e215382597bbe543c232d43e891');
// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('main.ejs');
    });

    
    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('entries').find({postedBy: req.user._id}).sort({date:1}).toArray((err, result) => {
          if (err) return console.log(err)
          console.log(result)
          res.render('profile.ejs', {
            user : req.user,
            entries: result
          })
        })
    });
    //feed page
    app.get('/feed', function(req, res) {
      db.collection('entries').find().sort({'date': -1}).toArray((err, result) => {
        if (err) return console.log(err)
        res.render('feed.ejs', {
          entries: result
        })
      })
  });
  //post page
  app.get('/post/:postId', isLoggedIn, function(req, res) {
    // let postId = ObjectId(req.params.zebra)
    // //when trying to pull a query param out of a url
    // console.log(postId)
    let postId = ObjectId(req.params.postId)
    db.collection('entries').find({_id: postId}).toArray((err, result) => {
      if (err) return console.log(err)
      res.render('post.ejs', {
        entries: result
      })
    })
});
//profile page
app.get('/page/:id', isLoggedIn, function(req, res) {
  let postId = ObjectId(req.params.id)
  db.collection('entries').find({postedBy: postId}).toArray((err, result) => {
    if (err) return console.log(err)
    res.render('page.ejs', {
      entries: result
    })
  })
});

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
// post routes
//message form

app.post('/msgPost', async (req, res) => {
  const consumer = req.user._id
  const phone  = req.body.phone;

  try {
    // add the phone number to the users database record
    await db.collection('users').updateOne(
      { _id: consumer },
      {
        $set: {
          phone: phone
        }
      }
    );

    // send an initial text message
    await client.messages.create({
      body: 'Mental Health Journey Status: "Active!" Take things one day at a time and know everyday you show up for yourself is one worth celebrating - The Safe Space ✌',
      to: phone, // Text this number
      from: '+13163955977', // From a valid Twilio number
    });

    res.redirect('/profile')
  } catch ( e ) {
    console.log( e );
  }
});
  
  
//
app.post('/makePost', (req, res) => {
  
let colors = {
  green : ['strong','confident','worthy','valuable' ,'appreciated'],
  purple : ['fear', 'anxious','insecure', 'unworthy', 'apprehensive'],
  red : ['anger','hateful', 'critical', 'jealous', 'hurt'],
  orange : ['sadness', 'guilty', 'vulnerable', 'depressed', 'ashamed'],
  yellow : ['bored', 'embarrassed', 'disapproving', 'offended', 'disgusted'],
  pink : ['happy', 'joyful', 'accepted', 'valued', 'content', 'loving'],
  blue : ['surprise', 'excited', 'amazed', 'confused', 'energetic', 'dismayed']
}
  let userInput = req.body.currentMood
  let keys = Object.keys(colors)
  let color
  let scale 
  for(let i=0; i< keys.length; i++){
    if(colors[keys[i]].includes(userInput)){
        color = keys[i]
        switch (colors[keys[i]].indexOf(userInput)) {
          case 0:
            scale = 1;
            break;
          case 1:
              scale = .8;
            break;
          case 2:
              scale = .6;
            break;
          case 3:
              scale = .4;
            break;
          case 4:
              scale = .3;
            break;
          case 5:
              scale = .2;
            break;
        }          }
  }
  let user = req.user._id
  db.collection('entries').insertOne({date: req.body.date, title: req.body.title, caption: req.body.caption, postedBy: user, currentMood: userInput, color: color, scale:scale}, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')


    res.redirect('/profile')
    
  })
})


// message board routes ===============================================================

    app.post('/messages', (req, res) => {
      db.collection('messages').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })

    })

    app.put('/messages', (req, res) => {
      db.collection('messages')
      .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
        $set: {
          thumbUp:req.body.thumbUp + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.delete('/makePost', (req, res) => {
      console.log(req.body.title)
      db.collection('entries').findOneAndDelete({title:req.body.title, date: req.body.date}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })




// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/feed', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.local.phone    = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
