import pg from "pg";

import { ErrorHandler } from "../utils/ErrorHandler.js";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export class Database {
  static #pool = new Pool({
    connectionString,
    ssl: connectionString?.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  static async query(text, params) {
    try {
      return await Database.#pool.query(text, params);
    } catch (err) {
      // Rethrown as-is (not wrapped) so callers can still inspect driver
      // error codes, e.g. Postgres unique-violation code "23505".
      ErrorHandler.log("Database.query", err);
      throw err;
    }
  }

  // Multiple changes to the schema are wrapped in a single transaction to avoid leaving the DB in a half-migrated state if an error occurs. This is especially important for the migration of the old password_reset_tokens and email_verification_tokens tables into the new users table, which is done in this function.
  static async ensureSchema() {
    try {
      await Database.#pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_hash TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

        CREATE INDEX IF NOT EXISTS idx_users_reset_token_hash ON users(reset_token_hash);
        CREATE INDEX IF NOT EXISTS idx_users_verification_token_hash ON users(verification_token_hash);

        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          revoked_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens') THEN
            UPDATE users u
            SET reset_token_hash = t.token_hash, reset_token_expires_at = t.expires_at
            FROM password_reset_tokens t
            WHERE t.user_id = u.id AND t.used_at IS NULL AND t.expires_at > now();
            DROP TABLE password_reset_tokens;
          END IF;

          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens') THEN
            UPDATE users u
            SET verification_token_hash = t.token_hash, verification_token_expires_at = t.expires_at
            FROM email_verification_tokens t
            WHERE t.user_id = u.id AND t.used_at IS NULL AND t.expires_at > now();
            DROP TABLE email_verification_tokens;
          END IF;
        END $$;
      `);
    } catch (err) {
      ErrorHandler.log("Database.ensureSchema", err);
      throw err;
    }
  }
}
