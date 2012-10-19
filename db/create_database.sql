DROP TABLE users;
CREATE TABLE users
(
  id SERIAL,
  username text NOT NULL UNIQUE,
  password_hash text,
  email text,
  active boolean,
  admin boolean,
  CONSTRAINT id_primary_key PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

DROP TABLE worksheets;
CREATE TABLE worksheets
(
  id SERIAL
);