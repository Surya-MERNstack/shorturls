
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const shortid = require('shortid');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Atlas connection URL
const DB_URL = 'mongodb+srv://guvidatabase:HemSal0430@guvidatabase.zedvrxd.mongodb.net/userdatabase?retryWrites=true&w=majority';

// Connect to MongoDB Atlas
mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a Mongoose schema for URL
const urlSchema = new mongoose.Schema({
  longUrl: String,
  shortUrl: String,
  clicks: {
    type: Number,
    default: 0,
  },
  clickHistory: [{
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
});

// Create a Mongoose model for URL
const UrlModel = mongoose.model('Url', urlSchema);

// Endpoint for creating a shortened URL
app.post('/shorten', async (req, res) => {
  const { longUrl } = req.body;

  try {
    const shortUrl = shortid.generate();
    const url = new UrlModel({ longUrl, shortUrl });
    await url.save();
    res.json({ shortUrl });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/shorten', async (req, res) => {
  try {
    const urls = await UrlModel.find();
    res.status(200).json(urls);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve shortened URLs' });
  }
});


// Endpoint for redirecting to the original URL
app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await UrlModel.findOne({ shortUrl });
    if (url) {
      url.clicks++;
      url.clickHistory.push({ timestamp: Date.now() });
      await url.save();
      return res.redirect(url.longUrl);
    }
    return res.sendStatus(404);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for retrieving the original URL and click count
app.get('/info/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const url = await UrlModel.findOne({ shortUrl });
    if (url) {
      const { longUrl, clicks, clickHistory } = url;
      return res.json({ longUrl, clicks, clickHistory });
    }
    return res.sendStatus(404);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
