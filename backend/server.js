// require ('dotenv').config ();
// const express = require ('express');
// const webPush = require ('web-push');
// const SubscriptionModel = require ('./subscriptionSchema');
// const mongoose = require ('mongoose');
// const app = express ();
// const port = 9000;
// const DatabaseName = 'pushDb';
// const DatabaseURI = `mongodb://localhost:27017/${DatabaseName}`;
// app.use (express.json ());
// app.use (express.urlencoded ({extended: false}));

// //...middlewares will be added in a moment

// mongoose
//   .connect (DatabaseURI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then (db => {
//     app.listen (port, () => console.log (`app running live on ${port}`));
//   })
//   .catch (err => console.log (err.message));



// app.use (express.urlencoded ({extended: false}));

// app.post ('/subscribe', async (req, res, next) => {
//   const newSubscription = await SubscriptionModel.create ({...req.body});
// });


// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const webPush = require('web-push');
const cors = require('cors');
require('dotenv').config();

// Create Express app
const app = express();
app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json()); // Parse JSON bodies

// MongoDB Setup
mongoose.connect('mongodb://localhost:27017/webpush-notifications', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected...');
}).catch((err) => {
  console.log('MongoDB connection error:', err);
});

// MongoDB schema to store push subscription information
const subscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Set your VAPID keys (Voluntary Application Server Identification)
// You can generate them using the `web-push` library or from the web-push website
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
webPush.setVapidDetails(
  'mailto:example@yourdomain.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// API Route to save subscription data from the client
app.post('/subscribe', async (req, res) => {
//   const { endpoint, keys } = req.body;
//   const newSubscription = new Subscription({
//     endpoint,
//     keys,
//   });

//   try {
//     await newSubscription.save();
//     res.status(201).json({ message: 'Subscription saved successfully' });
//   } catch (error) {
//     console.error('Error saving subscription:', error);
//     res.status(500).json({ error: 'Failed to save subscription' });
//   }

try {
    const { endpoint, keys } = req.body;

    // Validate input
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }
    if (!keys || !Array.isArray(keys.p256dh) || !Array.isArray(keys.auth)) {
      return res.status(400).json({ error: 'Invalid keys provided' });
    }

    const newSubscription = new Subscription({ 
      endpoint,
      keys: { 
        p256dh: Buffer.from(keys.p256dh).toString('base64'), 
        auth: Buffer.from(keys.auth).toString('base64') 
      }
    });
    console.log(newSubscription)
    await newSubscription.save();

    res.status(201).json({ message: 'Subscription saved successfully!' }); 
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});
const convertToBase64Url = (buffer) => {
    // Convert buffer to Base64
    let base64 = buffer.toString('base64');
    
    // Convert to Base64 URL-safe (replacing + with -, / with _, and removing padding)
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    return base64;
  };
// API Route to send push notification to a specific client
app.post('/sendNotification', async (req, res) => {
  const { subscriptionId, message } = req.body;

  try {
    const subscription = await Subscription.findById(subscriptionId);
    console.log(subscription);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    const p256dhBase64Url = convertToBase64Url(subscription.keys.p256dh);
    const authBase64Url = convertToBase64Url(subscription.keys.auth);

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    const payload = JSON.stringify({
      title: 'New Notification',
      body: message,
      icon: '/icon.png',
    });

    await webPush.sendNotification(pushSubscription, payload);
    res.status(200).json({ message: 'Notification sent' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});


app.post('/unsubscribe', async (req, res) => {
    try {
      const { endpoint } = req.body; 
  
      if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint is required' });
      }
  
      const deletedSubscription = await Subscription.findOneAndDelete({ endpoint }); 
  
      if (deletedSubscription) {
        res.status(200).json({ message: 'Successfully unsubscribed' }); 
      } else {
        res.status(404).json({ error: 'Subscription not found' }); 
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  });


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
