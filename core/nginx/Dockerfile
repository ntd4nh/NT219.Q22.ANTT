FROM owasp/modsecurity-crs:nginx-alpine-3.1.16

ENV BACKEND=http://kong:8000
ENV MODSEC_RULE_ENGINE=On
ENV PORT=8080
ENV SSL_PORT=8443
ENV SERVER_NAME=localhost

COPY nginx/modsecurity-custom.conf /etc/modsecurity.d/owasp-crs/rules/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf
