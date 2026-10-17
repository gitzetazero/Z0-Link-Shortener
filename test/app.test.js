const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

const tmpFile = path.join(os.tmpdir(), `z0-link-shortener-test-${process.pid}.json`);

process.env.LINKS_FILE = tmpFile;
process.env.BASE_URL = 'https://short.zzero.me';
process.env.ADMIN_TOKEN = 'secret-token';

const { createApp } = require('../app');
const app = createApp();

test.beforeEach(() => {
  try {
    fs.unlinkSync(tmpFile);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
});

test('requires admin token to create short links', async () => {
  const response = await request(app)
    .post('/api/links')
    .send({ url: 'https://example.com' });

  assert.equal(response.status, 401);
});

test('creates short link with short.zzero.me base URL', async () => {
  const response = await request(app)
    .post('/api/links')
    .set('x-admin-token', 'secret-token')
    .send({ url: 'https://example.com/path', slug: 'my-link' });

  assert.equal(response.status, 201);
  assert.equal(response.body.shortUrl, 'https://short.zzero.me/my-link');
});

test('redirects short slug to original URL', async () => {
  await request(app)
    .post('/api/links')
    .set('x-admin-token', 'secret-token')
    .send({ url: 'https://example.com/path', slug: 'go-home' })
    .expect(201);

  const redirect = await request(app).get('/go-home');

  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.location, 'https://example.com/path');
});
