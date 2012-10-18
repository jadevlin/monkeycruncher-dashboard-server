-- Table: users
DROP TABLE users;
CREATE TABLE users
(
  userid integer NOT NULL,
  username text NOT NULL,
  passwordhash text,
  CONSTRAINT userid_primary_key PRIMARY KEY (userid)
)
WITH (
  OIDS=FALSE
);