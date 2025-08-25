const crypto = require("crypto");

function verifySignature(signature, payload, secret) {
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

module.exports = { verifySignature };
