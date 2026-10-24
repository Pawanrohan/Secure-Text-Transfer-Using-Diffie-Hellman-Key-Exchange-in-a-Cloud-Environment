/**
 * Classical Finite-Field Diffie–Hellman (Educational Module)
 * Mathematical demonstration using small parameters for academic evaluation.
 * NOT to be used in production or real cloud messages.
 */

export interface ClassicalDHStep {
  stepNumber: number;
  actor: 'Public' | 'Alice' | 'Bob';
  title: string;
  mathExpression: string;
  computedValue: string;
  explanation: string;
}

export interface ClassicalDHDemoResult {
  p: number;
  g: number;
  alicePrivate: number;
  alicePublic: number;
  bobPrivate: number;
  bobPublic: number;
  aliceSharedSecret: number;
  bobSharedSecret: number;
  isSecretMatching: boolean;
  steps: ClassicalDHStep[];
}

/**
 * Computes (base^exp) mod mod efficiently
 */
export function modPow(base: number, exp: number, mod: number): number {
  let res = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) res = (res * base) % mod;
    base = (base * base) % mod;
    exp = Math.floor(exp / 2);
  }
  return res;
}

export function runClassicalDHDemo(
  p = 23,
  g = 5,
  alicePrivate = 6,
  bobPrivate = 15
): ClassicalDHDemoResult {
  const alicePublic = modPow(g, alicePrivate, p);
  const bobPublic = modPow(g, bobPrivate, p);

  const aliceShared = modPow(bobPublic, alicePrivate, p);
  const bobShared = modPow(alicePublic, bobPrivate, p);

  const steps: ClassicalDHStep[] = [
    {
      stepNumber: 1,
      actor: 'Public',
      title: 'Domain Parameters Agreement',
      mathExpression: `p = ${p} (prime), g = ${g} (primitive root modulo p)`,
      computedValue: `p=${p}, g=${g}`,
      explanation: 'Both parties agree publicly on a prime modulus p and base generator g over an unencrypted channel.',
    },
    {
      stepNumber: 2,
      actor: 'Alice',
      title: 'Alice Private Secret Selection',
      mathExpression: `a \\in [2, p-2] = ${alicePrivate}`,
      computedValue: `a=${alicePrivate}`,
      explanation: 'Alice chooses a random private integer a and keeps it strictly confidential.',
    },
    {
      stepNumber: 3,
      actor: 'Alice',
      title: 'Alice Public Key Computation',
      mathExpression: `A = g^a \\pmod p = ${g}^{${alicePrivate}} \\pmod{${p}}`,
      computedValue: `A = ${alicePublic}`,
      explanation: 'Alice calculates A and transmits it across the untrusted network.',
    },
    {
      stepNumber: 4,
      actor: 'Bob',
      title: 'Bob Private Secret Selection',
      mathExpression: `b \\in [2, p-2] = ${bobPrivate}`,
      computedValue: `b=${bobPrivate}`,
      explanation: 'Bob independently chooses private integer b and keeps it strictly confidential.',
    },
    {
      stepNumber: 5,
      actor: 'Bob',
      title: 'Bob Public Key Computation',
      mathExpression: `B = g^b \\pmod p = ${g}^{${bobPrivate}} \\pmod{${p}}`,
      computedValue: `B = ${bobPublic}`,
      explanation: 'Bob calculates B and transmits it across the untrusted network.',
    },
    {
      stepNumber: 6,
      actor: 'Alice',
      title: 'Alice Computes Shared Secret',
      mathExpression: `S_A = B^a \\pmod p = ${bobPublic}^{${alicePrivate}} \\pmod{${p}} = (g^b)^a = g^{ab}`,
      computedValue: `S_A = ${aliceShared}`,
      explanation: 'Alice raises Bob public value B to her private secret a.',
    },
    {
      stepNumber: 7,
      actor: 'Bob',
      title: 'Bob Computes Shared Secret',
      mathExpression: `S_B = A^b \\pmod p = ${alicePublic}^{${bobPrivate}} \\pmod{${p}} = (g^a)^b = g^{ab}`,
      computedValue: `S_B = ${bobShared}`,
      explanation: 'Bob raises Alice public value A to his private secret b.',
    },
  ];

  return {
    p,
    g,
    alicePrivate,
    alicePublic,
    bobPrivate,
    bobPublic,
    aliceSharedSecret: aliceShared,
    bobSharedSecret: bobShared,
    isSecretMatching: aliceShared === bobShared,
    steps,
  };
}
