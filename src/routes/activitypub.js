import express from 'express';
import { Actor } from '../models/actor.js';

export const ActivityPubRouter = express.Router();

// Get actor profile
ActivityPubRouter.get('/users/:username', (req, res) => {
  const actor = Actor.findByUsername(req.params.username);
  
  if (!actor) {
    return res.status(404).json({ error: 'Actor not found' });
  }

  res.json(actor.toActivityPub());
});

// Handle incoming activities to an actor's inbox
ActivityPubRouter.post('/users/:username/inbox', async (req, res) => {
  const actor = Actor.findByUsername(req.params.username);
  
  if (!actor) {
    return res.status(404).json({ error: 'Actor not found' });
  }

  const activity = req.body;
  
  switch (activity.type) {
    case 'Follow':
      // Handle follow request
      actor.followers.add(activity.actor);
      // Send Accept activity
      res.status(202).json({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Accept',
        actor: actor.id,
        object: activity
      });
      break;
      
    case 'Create':
      // Handle new content
      actor.inbox.push(activity);
      res.status(202).send();
      break;
      
    default:
      res.status(400).json({ error: 'Unsupported activity type' });
  }
});

// Get actor's outbox
ActivityPubRouter.get('/users/:username/outbox', (req, res) => {
  const actor = Actor.findByUsername(req.params.username);
  
  if (!actor) {
    return res.status(404).json({ error: 'Actor not found' });
  }

  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    totalItems: actor.outbox.length,
    orderedItems: actor.outbox
  });
});

// Create and send new activities
ActivityPubRouter.post('/users/:username/outbox', async (req, res) => {
  const actor = Actor.findByUsername(req.params.username);
  
  if (!actor) {
    return res.status(404).json({ error: 'Actor not found' });
  }

  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Create',
    actor: actor.id,
    object: req.body,
    published: new Date().toISOString()
  };

  actor.outbox.push(activity);
  
  // Deliver to followers
  for (const follower of actor.followers) {
    // Implementation of delivery to followers would go here
    console.log(`Delivering to follower: ${follower}`);
  }

  res.status(201).json(activity);
});