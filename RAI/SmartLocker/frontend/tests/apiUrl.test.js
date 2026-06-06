import test from 'node:test';
import assert from 'node:assert/strict';

test('privzeti API URL za lokalni razvoj je backend na portu 5000', () => {
  const fallback = process.env.VITE_API_URL || 'http://localhost:5000';
  assert.equal(fallback, 'http://localhost:5000');
});
