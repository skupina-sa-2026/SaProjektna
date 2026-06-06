const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidLockerId, normalizeLockerName } = require('../src/utils/lockerValidation');

test('veljaven ID paketnika mora biti pozitivno celo stevilo', () => {
  assert.equal(isValidLockerId(352), true);
  assert.equal(isValidLockerId('539'), true);
});

test('neveljavni ID-ji paketnika se zavrnejo', () => {
  assert.equal(isValidLockerId(0), false);
  assert.equal(isValidLockerId(-1), false);
  assert.equal(isValidLockerId('abc'), false);
});

test('ime paketnika se normalizira', () => {
  assert.equal(normalizeLockerName('  Paketnik   Maribor  '), 'Paketnik Maribor');
});
