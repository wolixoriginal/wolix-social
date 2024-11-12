import express from 'express';
import crypto from 'crypto';
import bodyParser from 'body-parser';
import { Actor } from './models/actor.js';
import { ActivityPubRouter } from './routes/activitypub.js';
import { UIRouter } from './routes/ui.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json({ type: 'application/activity+json' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize routes
app.use('/', ActivityPubRouter);
app.use('/', UIRouter);

// WebFinger endpoint for actor discovery
app.get('/.well-known/webfinger', (req, res) => {
  const resource = req.query.resource;
  if (!resource || !resource.startsWith('acct:')) {
    return res.status(400).json({ error: 'Invalid resource query' });
  }

  const [username] = resource.substring(5).split('@');
  const actor = Actor.findByUsername(username);

  if (!actor) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    subject: resource,
    links: [{
      rel: 'self',
      type: 'application/activity+json',
      href: `https://${req.hostname}/users/${username}`
    }]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ActivityPub server running on port ${PORT}`);
});