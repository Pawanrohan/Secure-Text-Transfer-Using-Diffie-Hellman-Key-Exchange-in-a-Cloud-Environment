-- SecureText Database Schema
-- Production and Cloud-Ready Specification (PostgreSQL & SQLite dual-compatible)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. User Public Key Directory (Cross-signed with Ed25519)
CREATE TABLE IF NOT EXISTS user_public_keys (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    key_id VARCHAR(64) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    dh_public_key TEXT NOT NULL,
    signing_public_key TEXT NOT NULL,
    signature TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    safety_number TEXT NOT NULL,
    is_revoked INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_keys_user_id ON user_public_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_keys_fingerprint ON user_public_keys(fingerprint);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    user_a_id VARCHAR(64) NOT NULL,
    user_b_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_a_id) REFERENCES users(id),
    FOREIGN KEY (user_b_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_conv_user_a ON conversations(user_a_id);
CREATE INDEX IF NOT EXISTS idx_conv_user_b ON conversations(user_b_id);

-- 4. Messages Table (Zero-Knowledge Cloud: Ciphertext only, No Plaintext or Keys)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64),
    sender_id VARCHAR(64) NOT NULL,
    recipient_id VARCHAR(64) NOT NULL,
    protocol_version VARCHAR(32) NOT NULL,
    sender_key_id VARCHAR(64) NOT NULL,
    recipient_key_id VARCHAR(64) NOT NULL,
    ephemeral_public_key TEXT NOT NULL,
    nonce TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    signature TEXT NOT NULL,
    canonical_aad TEXT NOT NULL,
    payload_size_bytes INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 5. Message Delivery Status Table
CREATE TABLE IF NOT EXISTS message_delivery_status (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deliv_msg_id ON message_delivery_status(message_id);

-- 6. Security Event Auditing Table
CREATE TABLE IF NOT EXISTS security_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    event_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    details TEXT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sec_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_events_user ON security_events(user_id);

-- 7. Active User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
