-- Table: users
-- DROP TABLE users;

CREATE TABLE users
(
  "userID" integer NOT NULL,
  "username" text NOT NULL,
  "passwordHash" text,
  CONSTRAINT "userID_primary_key" PRIMARY KEY ("userID" )
)
WITH (
  OIDS=FALSE
);