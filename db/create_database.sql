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

CREATE TABLE worksheets
(
  id bigserial PRIMARY KEY,
  name text,
  owner bigint REFERENCES users (id),
  parent bigserial REFERENCES worksheets (id),
  last_edited TIMESTAMP,
  document_ref uuid,
  deleted boolean
);
ALTER TABLE worksheets
  ALTER COLUMN owner DROP NOT NULL,
  ALTER COLUMN parent DROP NOT NULL;
