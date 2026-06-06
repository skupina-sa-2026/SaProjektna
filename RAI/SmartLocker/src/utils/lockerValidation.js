function isValidLockerId(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= 999999;
}

function normalizeLockerName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

module.exports = { isValidLockerId, normalizeLockerName };
