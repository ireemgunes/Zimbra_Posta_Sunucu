FROM ubuntu:20.04

ARG DEBIAN_FRONTEND=noninteractive
ARG ZIMBRA_VERSION=10.0.9
ARG ZIMBRA_PLATFORM=UBUNTU20_64

ENV TZ=Europe/Istanbul
ENV ZIMBRA_DOMAIN=mailos.local
ENV ZIMBRA_ADMIN_PASSWORD=ZimbraAdmin2024!

# Configure reliable repository settings & timeouts
RUN set -eux; \
    echo 'Acquire::Retries "3";' > /etc/apt/apt.conf.d/80-retries; \
    echo 'Acquire::http::Timeout "20";' >> /etc/apt/apt.conf.d/80-retries; \
    (apt-get update -o Acquire::ForceIPv4=true || apt-get update --fix-missing || true); \
    (apt-get install -y --no-install-recommends \
        sudo \
        ca-certificates \
        curl \
        wget \
        hostname \
        net-tools \
        sqlite3 \
        rsyslog \
        perl \
    || apt-get install -y --fix-missing \
        sudo \
        ca-certificates \
        curl \
        wget \
        hostname \
    || true); \
    rm -rf /var/lib/apt/lists/*

# Set up local hostname resolution
RUN echo "127.0.0.1 mail.mailos.local mail" >> /etc/hosts || true

WORKDIR /opt/zimbra-install

# Copy zimbra install configuration
COPY zimbra.conf /opt/zimbra-install/zimbra.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 25 465 587 110 995 143 993 80 443 7071 8080 8443

VOLUME ["/opt/zimbra"]

ENTRYPOINT ["/entrypoint.sh"]
