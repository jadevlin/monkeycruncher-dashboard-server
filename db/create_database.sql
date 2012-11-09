DROP TABLE IF EXISTS worksheets;
DROP TABLE IF EXISTS users;

CREATE TABLE users
(
  id bigserial PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text,
  email text,
  active boolean,
  admin boolean
);
-- Indices like these are implicitly created by the constraints.
-- CREATE INDEX users_id_index ON users (id);
-- CREATE INDEX users_username_index ON users (username);

CREATE TABLE worksheets
(
  id bigserial PRIMARY KEY,
  name text,
  owner bigint REFERENCES users (id),
  document_ref uuid,
  parent bigsint
);
-- An index like this is implicitly created by the constraints.
-- CREATE INDEX worksheets_id_index ON worksheets (id);
