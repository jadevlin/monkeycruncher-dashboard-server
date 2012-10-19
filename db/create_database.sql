-- Table: users
DROP TABLE users;
CREATE TABLE users
(
  userid SERIAL,
  username text NOT NULL UNIQUE,
  passwordhash text,
  email text,
  active boolean,
  admin boolean,
  CONSTRAINT userid_primary_key PRIMARY KEY (userid)
)
WITH (
  OIDS=FALSE
);