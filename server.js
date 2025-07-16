// server.js
const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000; // Render uses PORT environment variable

app.use(express.json());
app.use(cors({
  origin: 'https://*.render.com', // Adjust based on your extension's origin if needed
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.post('/download', async (req, res) => {
  const { url, quality } = req.body;

  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  let format;
  if (quality === 'MP3') {
    format = 'audioonly';
  } else {
    const resolutionMap = {
      '1080p': '1080',
      '720p': '720',
      '480p': '480',
      '360p': '360'
    };
    format = `best[height<=${resolutionMap[quality] || '1080'}]`;
  }

  try {
    const info = await ytdl.getInfo(url);
    const stream = ytdl.downloadFromInfo(info, { quality: format });

    res.setHeader('Content-Disposition', `attachment; filename="video.${quality === 'MP3' ? 'mp3' : 'mp4'}"`);
    res.setHeader('Content-Type', quality === 'MP3' ? 'audio/mpeg' : 'video/mp4');

    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream video' });
      }
    });

    res.on('close', () => {
      stream.destroy(); // Clean up the stream if the client disconnects
    });
  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(400).json({ error: 'Failed to download video' });
    }
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));