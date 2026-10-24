import React, { useState } from 'react';
import { BookOpen, Calculator, Key, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import { runClassicalDHDemo } from '../crypto/educational/finiteFieldDH.js';
import { runRSAToyDemo } from '../crypto/educational/rsaModule.js';
import { encryptPlayfair } from '../crypto/educational/playfairCipher.js';

export const EducationalLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DH' | 'RSA' | 'PLAYFAIR'>('DH');

  // Finite-Field DH state
  const [dhP, setDhP] = useState<number>(23);
  const [dhG, setDhG] = useState<number>(5);
  const [dhAlicePriv, setDhAlicePriv] = useState<number>(6);
  const [dhBobPriv, setDhBobPriv] = useState<number>(15);
  const dhResult = runClassicalDHDemo(dhP, dhG, dhAlicePriv, dhBobPriv);

  // RSA Toy state
  const [rsaP, setRsaP] = useState<number>(61);
  const [rsaQ, setRsaQ] = useState<number>(53);
  const [rsaM, setRsaM] = useState<number>(65);
  const rsaResult = runRSAToyDemo(rsaP, rsaQ, rsaM);

  // Playfair state
  const [playfairKey, setPlayfairKey] = useState<string>('MONARCHY');
  const [playfairText, setPlayfairText] = useState<string>('INSTRUMENTS');
  const playfairResult = encryptPlayfair(playfairKey, playfairText);

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
          Educational Cryptography Laboratory
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Theoretical foundations and historical comparison modules for your M.Tech research presentation.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'DH', label: '1. Finite-Field Diffie–Hellman (Classical)' },
          { id: 'RSA', label: '2. RSA-OAEP / PSS Mathematical Basis' },
          { id: 'PLAYFAIR', label: '3. Historical Playfair 5×5 Cipher' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FINITE-FIELD DIFFIE-HELLMAN */}
      {activeTab === 'DH' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Classical Finite-Field Diffie–Hellman (Diffie & Hellman, 1976)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Educational demonstration of modular exponentiation key exchange. The security relies on the hardness of the Discrete Logarithm Problem (DLP).
            </p>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Prime Modulus p:</label>
                <input
                  type="number"
                  value={dhP}
                  onChange={(e) => setDhP(Number(e.target.value) || 23)}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Primitive Generator g:</label>
                <input
                  type="number"
                  value={dhG}
                  onChange={(e) => setDhG(Number(e.target.value) || 5)}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Alice Private a:</label>
                <input
                  type="number"
                  value={dhAlicePriv}
                  onChange={(e) => setDhAlicePriv(Number(e.target.value) || 6)}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Bob Private b:</label>
                <input
                  type="number"
                  value={dhBobPriv}
                  onChange={(e) => setDhBobPriv(Number(e.target.value) || 15)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Calculation Steps Table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '0.625rem 0.75rem' }}>Step</th>
                    <th style={{ padding: '0.625rem 0.75rem' }}>Actor</th>
                    <th style={{ padding: '0.625rem 0.75rem' }}>Mathematical Expression</th>
                    <th style={{ padding: '0.625rem 0.75rem' }}>Output Value</th>
                    <th style={{ padding: '0.625rem 0.75rem' }}>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {dhResult.steps.map((st) => (
                    <tr key={st.stepNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>{st.stepNumber}</td>
                      <td style={{ padding: '0.625rem 0.75rem' }}>
                        <span className={`badge ${st.actor === 'Alice' ? 'badge-blue' : st.actor === 'Bob' ? 'badge-green' : 'badge-amber'}`}>
                          {st.actor}
                        </span>
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)', color: '#2563eb' }}>
                        {st.mathExpression}
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700 }}>{st.computedValue}</td>
                      <td style={{ padding: '0.625rem 0.75rem', color: '#475569' }}>{st.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Match Status Banner */}
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', color: '#166534', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} />
              <span>
                <strong>Shared Secret Matched:</strong> Alice S_A = {dhResult.aliceSharedSecret} and Bob S_B = {dhResult.bobSharedSecret}.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RSA */}
      {activeTab === 'RSA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              RSA Asymmetric Cryptosystem (Rivest, Shamir, Adleman, 1977)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Demonstrates why RSA is mathematically fundamentally distinct from Diffie–Hellman and AES.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Prime p:</label>
                <input
                  type="number"
                  value={rsaP}
                  onChange={(e) => setRsaP(Number(e.target.value) || 61)}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Prime q:</label>
                <input
                  type="number"
                  value={rsaQ}
                  onChange={(e) => setRsaQ(Number(e.target.value) || 53)}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Message Integer M:</label>
                <input
                  type="number"
                  value={rsaM}
                  onChange={(e) => setRsaM(Number(e.target.value) || 65)}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rsaResult.steps.map((st, i) => (
                <div key={i} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0f172a' }}>{st.title}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: '#2563eb', fontSize: '0.8125rem', margin: '0.25rem 0' }}>{st.math}</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>{st.explanation}</div>
                </div>
              ))}
            </div>

            {/* Academic Contrast: RSA vs DH + AES */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e40af' }}>
                Why RSA is NOT interchangeable with Diffie–Hellman + AES:
              </div>
              <ul style={{ marginTop: '0.5rem', marginLeft: '1.25rem', fontSize: '0.8125rem', color: '#1e3a8a', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li><strong>No Inherent Forward Secrecy:</strong> RSA public-key encryption uses the receiver's long-term key. If compromised in the future, all past intercepted ciphertexts can be decrypted. In contrast, ephemeral Diffie-Hellman generates fresh keys per message.</li>
                <li><strong>Key Length Overhead:</strong> Equivalent 128-bit security requires 3072-bit RSA keys, whereas Curve25519 achieves it with compact 256-bit (32-byte) keys.</li>
                <li><strong>Throughput:</strong> RSA modular exponentiation is orders of magnitude slower than symmetric AES-256-GCM.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLAYFAIR CIPHER */}
      {activeTab === 'PLAYFAIR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                Playfair 5×5 Matrix Polygraphic Cipher (1854)
              </h3>
              <span className="badge badge-amber">Historical Classroom Demo Only</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Invented by Charles Wheatstone and promoted by Lord Playfair. Included for academic contrast; completely unsuitable for sensitive cloud storage.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Secret Keyword:</label>
                <input
                  type="text"
                  value={playfairKey}
                  onChange={(e) => setPlayfairKey(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>Sample Plaintext:</label>
                <input
                  type="text"
                  value={playfairText}
                  onChange={(e) => setPlayfairText(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* 5x5 Matrix Visual Display */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                Generated 5×5 Key Matrix (I and J combined):
              </div>
              <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(5, 42px)', gap: '4px', backgroundColor: '#e2e8f0', padding: '6px', borderRadius: '0.5rem' }}>
                {playfairResult.matrix.flat().map((char, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: '#0f172a',
                      borderRadius: '4px',
                    }}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div>
                <strong>Digraph Pairs:</strong>{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#2563eb' }}>
                  {playfairResult.preparedPlaintext.join(' ')}
                </span>
              </div>
              <div>
                <strong>Encrypted Ciphertext:</strong>{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#dc2626', fontWeight: 700 }}>
                  {playfairResult.ciphertext}
                </span>
              </div>
              <div>
                <strong>Decrypted Plaintext:</strong>{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#16a34a' }}>
                  {playfairResult.decryptedPlaintext}
                </span>
              </div>
            </div>

            {/* Vulnerability Explanation */}
            <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#991b1b', fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <ShieldAlert size={16} /> Cryptographic Vulnerabilities of Playfair:
              </div>
              <ul style={{ marginTop: '0.5rem', marginLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li><strong>Digraph Frequency Analysis:</strong> In a 25-letter alphabet, there are only 600 possible digraphs ($25 \times 24$). Given several hundred characters of ciphertext, language frequencies (e.g., 'TH', 'HE', 'IN' in English) immediately expose the matrix.</li>
                <li><strong>No Integrity or Authenticity:</strong> Unlike AES-256-GCM, any bit modification goes undetected.</li>
                <li><strong>No Key Agreement:</strong> Requires a pre-shared word and lacks any mathematical forward secrecy.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
