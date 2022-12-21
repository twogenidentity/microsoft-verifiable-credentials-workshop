FROM quay.io/keycloak/keycloak:20.0.2 as builder
LABEL maintainer="embesozzi@twogenidentity.com"
ENV KC_DB=postgres
COPY ./init.sh /opt/keycloak/init.sh

RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:20.0.2
COPY --from=builder /opt/keycloak/init.sh /opt/keycloak/init.sh
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start-dev"]