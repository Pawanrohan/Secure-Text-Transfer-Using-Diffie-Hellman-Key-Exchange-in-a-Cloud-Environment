/**
 * RSA Educational Module
 * Demonstrates the mathematical basis of RSA, RSA-OAEP, and RSA-PSS,
 * and explains why RSA is NOT interchangeable with Diffie–Hellman + AES.
 */

export interface RSAToyResult {
  p: number;
  q: number;
  n: number;
  phi: number;
  e: number;
  d: number;
  samplePlaintext: number;
  encryptedCiphertext: number;
  decryptedPlaintext: number;
  isValid: boolean;
  steps: {
    title: string;
    math: string;
    explanation: string;
  }[];
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function modInverse(e: number, phi: number): number {
  let [m0, y, x] = [phi, 0, 1];
  if (phi === 1) return 0;
  while (e > 1) {
    const q = Math.floor(e / phi);
    let t = phi;
    phi = e % phi;
    e = t;
    t = y;
    y = x - q * y;
    x = t;
  }
  if (x < 0) x += m0;
  return x;
}

function modPow(base: number, exp: number, mod: number): number {
  let res = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) res = (res * base) % mod;
    base = (base * base) % mod;
    exp = Math.floor(exp / 2);
  }
  return res;
}

export function runRSAToyDemo(p = 61, q = 53, samplePlaintext = 65): RSAToyResult {
  const n = p * q; // 3233
  const phi = (p - 1) * (q - 1); // 3120
  let e = 17;
  while (e < phi) {
    if (gcd(e, phi) === 1) break;
    e += 2;
  }
  const d = modInverse(e, phi); // 2753

  const encryptedCiphertext = modPow(samplePlaintext, e, n);
  const decryptedPlaintext = modPow(encryptedCiphertext, d, n);

  const steps = [
    {
      title: '1. Select Primes',
      math: `p = ${p}, q = ${q}`,
      explanation: 'Select two distinct large primes p and q. In practical systems, these must each be at least 1024 or 1536 bits.',
    },
    {
      title: '2. Compute Modulus and Euler Totient',
      math: `n = p \\times q = ${n}, \\quad \\phi(n) = (p-1)(q-1) = ${phi}`,
      explanation: 'Modulus n is public. Totient phi(n) is kept strictly secret.',
    },
    {
      title: '3. Select Public Exponent e',
      math: `e = ${e}, \\quad \\gcd(e, \\phi(n)) = 1`,
      explanation: 'e must be coprime to phi(n). Typically 65537 (0x10001) in industry.',
    },
    {
      title: '4. Compute Private Exponent d',
      math: `d \\equiv e^{-1} \\pmod{\\phi(n)} = ${d}`,
      explanation: 'Computed using Extended Euclidean Algorithm such that (e * d) mod phi(n) = 1.',
    },
    {
      title: '5. Encryption (RSA-OAEP Concept)',
      math: `C = M^e \\pmod n = ${samplePlaintext}^{${e}} \\pmod{${n}} = ${encryptedCiphertext}`,
      explanation: 'Plaintext block M is encrypted with public key (e, n). In practice, OAEP padding is mandatory to prevent chosen-ciphertext attacks.',
    },
    {
      title: '6. Decryption',
      math: `M = C^d \\pmod n = ${encryptedCiphertext}^{${d}} \\pmod{${n}} = ${decryptedPlaintext}`,
      explanation: 'Recipient uses private key (d, n) to recover original integer M.',
    },
  ];

  return {
    p,
    q,
    n,
    phi,
    e,
    d,
    samplePlaintext,
    encryptedCiphertext,
    decryptedPlaintext,
    isValid: samplePlaintext === decryptedPlaintext,
    steps,
  };
}
