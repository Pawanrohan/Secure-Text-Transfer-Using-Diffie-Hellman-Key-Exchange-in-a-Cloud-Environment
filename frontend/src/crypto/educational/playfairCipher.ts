/**
 * Playfair 5x5 Matrix Cipher (Educational Module)
 * Classroom demonstration of historical polygraphic substitution.
 * Strictly labeled as historical and unsuitable for protecting sensitive cloud data.
 */

export interface PlayfairResult {
  keyword: string;
  matrix: string[][];
  preparedPlaintext: string[];
  ciphertextPairs: string[];
  ciphertext: string;
  decryptedPlaintext: string;
}

export function generatePlayfairMatrix(keyword: string): string[][] {
  const cleanKeyword = keyword
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/J/g, 'I');

  const seen = new Set<string>();
  const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // 25 letters, J merged into I
  const keyChars: string[] = [];

  for (const char of cleanKeyword) {
    if (!seen.has(char)) {
      seen.add(char);
      keyChars.push(char);
    }
  }

  for (const char of alphabet) {
    if (!seen.has(char)) {
      seen.add(char);
      keyChars.push(char);
    }
  }

  const matrix: string[][] = [];
  for (let row = 0; row < 5; row++) {
    matrix.push(keyChars.slice(row * 5, row * 5 + 5));
  }
  return matrix;
}

export function preparePlayfairText(text: string): string[] {
  const clean = text
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/J/g, 'I');

  const digraphs: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const c1 = clean[i];
    if (i + 1 >= clean.length) {
      digraphs.push(c1 + 'X');
      i++;
    } else {
      const c2 = clean[i + 1];
      if (c1 === c2) {
        digraphs.push(c1 + 'X');
        i++;
      } else {
        digraphs.push(c1 + c2);
        i += 2;
      }
    }
  }
  return digraphs;
}

function findPosition(matrix: string[][], char: string): [number, number] {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (matrix[r][c] === char) {
        return [r, c];
      }
    }
  }
  return [0, 0];
}

export function encryptPlayfair(keyword: string, plaintext: string): PlayfairResult {
  const matrix = generatePlayfairMatrix(keyword);
  const preparedPairs = preparePlayfairText(plaintext);
  const cipherPairs: string[] = [];

  for (const pair of preparedPairs) {
    const [r1, c1] = findPosition(matrix, pair[0]);
    const [r2, c2] = findPosition(matrix, pair[1]);

    if (r1 === r2) {
      // Same row: shift right
      const enc1 = matrix[r1][(c1 + 1) % 5];
      const enc2 = matrix[r2][(c2 + 1) % 5];
      cipherPairs.push(enc1 + enc2);
    } else if (c1 === c2) {
      // Same column: shift down
      const enc1 = matrix[(r1 + 1) % 5][c1];
      const enc2 = matrix[(r2 + 1) % 5][c2];
      cipherPairs.push(enc1 + enc2);
    } else {
      // Rectangle: swap columns
      const enc1 = matrix[r1][c2];
      const enc2 = matrix[r2][c1];
      cipherPairs.push(enc1 + enc2);
    }
  }

  const ciphertext = cipherPairs.join('');
  const decrypted = decryptPlayfair(keyword, ciphertext);

  return {
    keyword,
    matrix,
    preparedPlaintext: preparedPairs,
    ciphertextPairs: cipherPairs,
    ciphertext,
    decryptedPlaintext: decrypted,
  };
}

export function decryptPlayfair(keyword: string, ciphertext: string): string {
  const matrix = generatePlayfairMatrix(keyword);
  const clean = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
  let decrypted = '';

  for (let i = 0; i < clean.length; i += 2) {
    const [r1, c1] = findPosition(matrix, clean[i]);
    const [r2, c2] = findPosition(matrix, clean[i + 1]);

    if (r1 === r2) {
      // Same row: shift left
      decrypted += matrix[r1][(c1 + 4) % 5];
      decrypted += matrix[r2][(c2 + 4) % 5];
    } else if (c1 === c2) {
      // Same column: shift up
      decrypted += matrix[(r1 + 4) % 5][c1];
      decrypted += matrix[(r2 + 4) % 5][c2];
    } else {
      // Rectangle: swap columns
      decrypted += matrix[r1][c2];
      decrypted += matrix[r2][c1];
    }
  }

  return decrypted;
}
