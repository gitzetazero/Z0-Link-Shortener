const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BASE_URL = process.env.BASE_URL || 'https://short.zzero.me';
const LINKS_FILE = process.env.LINKS_FILE || path.join(__dirname, 'links.json');

function readLinks() {
  try {
    const raw = fs.readFileSync(LINKS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

function writeLinks(links) {
  fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function generateSlug() {
  return crypto.randomBytes(4).toString('hex');
}

function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_, res) => {
    res.json({ ok: true });
  });

  app.post('/api/links', (req, res) => {
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) {
      return res.status(503).json({ error: 'ADMIN_TOKEN is not configured' });
    }

    if (req.get('x-admin-token') !== adminToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { url, slug } = req.body || {};

    if (!url || !isValidHttpUrl(url)) {
      return res.status(400).json({ error: 'A valid http(s) URL is required' });
    }

    const links = readLinks();

    let shortCode = slug;
    if (!shortCode) {
      do {
        shortCode = generateSlug();
      } while (links[shortCode]);
    }

    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(shortCode)) {
      return res.status(400).json({ error: 'Slug must be 3-32 chars: letters, numbers, _ or -' });
    }

    if (links[shortCode]) {
      return res.status(409).json({ error: 'Slug already exists' });
    }

    links[shortCode] = url;
    writeLinks(links);

    return res.status(201).json({
      slug: shortCode,
      url,
      shortUrl: `${BASE_URL.replace(/\/$/, '')}/${shortCode}`,
    });
  });

  app.get('/:slug', (req, res) => {
    const links = readLinks();
    const target = links[req.params.slug];

    if (!target) {
      return res.status(404).json({ error: 'Short link not found' });
    }

    return res.redirect(302, target);
  });

  return app;
}

module.exports = { createApp, readLinks, writeLinks };
