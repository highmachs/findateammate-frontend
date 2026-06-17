ALTER TABLE users ADD COLUMN is_organiser boolean DEFAULT false NOT NULL;
CREATE INDEX users_is_organiser_idx ON users (is_organiser);
