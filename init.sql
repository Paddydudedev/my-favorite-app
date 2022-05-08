CREATE TABLE eth_keys (user_id bigint not null, private_key varchar(165) not null, address varchar(65) not null);

CREATE TABLE secrets (user_id bigint not null, secret varchar(165) not null);