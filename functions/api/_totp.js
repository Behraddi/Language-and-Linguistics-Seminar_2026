const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function b32decode(s) {
  s = s.toUpperCase().replace(/=+$/, '');
  let bits = 0, val = 0;
  const out = [];
  for (const c of s) {
    const i = B32.indexOf(c);
    if (i < 0) throw new Error('Invalid base32');
    val = (val << 5) | i; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return new Uint8Array(out);
}

function b32encode(bytes) {
  let bits = 0, val = 0, out = '';
  for (const b of bytes) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}

async function hotp(secret, counter) {
  const key = await crypto.subtle.importKey(
    'raw', b32decode(secret),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const msg = new ArrayBuffer(8);
  new DataView(msg).setUint32(4, counter >>> 0, false);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  const off = mac[19] & 0xf;
  const code = (
    ((mac[off] & 0x7f) << 24) | (mac[off+1] << 16) | (mac[off+2] << 8) | mac[off+3]
  ) % 1_000_000;
  return code.toString().padStart(6, '0');
}

export async function verifyTOTP(secret, token) {
  if (!/^\d{6}$/.test(token)) return false;
  const t = Math.floor(Date.now() / 30000);
  for (const d of [-1, 0, 1]) {
    if (await hotp(secret, t + d) === token) return true;
  }
  return false;
}

export function newTOTPSecret() {
  return b32encode(crypto.getRandomValues(new Uint8Array(20)));
}

export function totpUri(secret, issuer = 'Ling Seminar CMS', account = 'admin') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
}
