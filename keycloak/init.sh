#!/bin/bash

echo "Creating PoC Users and Clients"

/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user $KEYCLOAK_USER --password $KEYCLOAK_PASSWORD

# Realm
# /opt/keycloak/bin/kcadm.sh create realms -s realm=magnolia -s enabled=true -o

# Users
/opt/keycloak/bin/kcadm.sh create users -r master -s username=mlewis  -s firstName=Martin -s lastName=Lewis -s enabled=true -s email=mlewis@demo.com
/opt/keycloak/bin/kcadm.sh set-password -r master --username mlewis --new-password demo1234!

# Clients
## Portal
/opt/keycloak/bin/kcadm.sh create clients -r master -s clientId=portal -s clientAuthenticatorType=client-secret -s secret=00000000–0000–0000–0000–000000000000 -s 'redirectUris=["*"]' -o
## Authenticator
/opt/keycloak/bin/kcadm.sh create clients -r master -s clientId=authenticator -s publicClient=true -s implicitFlowEnabled=true -s 'redirectUris=["vcclient://openid/"]' -o


