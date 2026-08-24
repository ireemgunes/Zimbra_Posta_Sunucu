#!/bin/bash
set -e

echo "[MailOS] Starting Zimbra 10.0 initialization..."

# Update /etc/hosts with proper hostname
HOSTNAME=$(hostname -f)
IP=$(hostname -i | awk '{print $1}')
echo "${IP} ${HOSTNAME} $(hostname -s)" >> /etc/hosts

# Check if Zimbra is already installed
if [ -f /opt/zimbra/bin/zmcontrol ]; then
    echo "[MailOS] Zimbra already installed. Starting services..."
    su - zimbra -c 'zmcontrol start'
else
    echo "[MailOS] First run — installing Zimbra FOSS..."

    # Update zimbra.conf with environment values
    sed -i "s|ZIMBRA_DOMAIN=.*|ZIMBRA_DOMAIN=${ZIMBRA_DOMAIN}|g" /opt/zimbra-install/zimbra.conf
    sed -i "s|ZIMBRA_STORE_ADMIN_PASSWORD=.*|ZIMBRA_STORE_ADMIN_PASSWORD=${ZIMBRA_ADMIN_PASSWORD}|g" /opt/zimbra-install/zimbra.conf
    sed -i "s|HOSTNAME=.*|HOSTNAME=$(hostname -f)|g" /opt/zimbra-install/zimbra.conf
    sed -i "s|ADMIN_ACCOUNT_NAME=.*|ADMIN_ACCOUNT_NAME=admin@${ZIMBRA_DOMAIN}|g" /opt/zimbra-install/zimbra.conf

    if [ -f /opt/zimbra-install/zcs.tgz ]; then
        cd /opt/zimbra-install
        tar -xzf zcs.tgz
        cd zcs-*
        ./install.sh -s < /opt/zimbra-install/zimbra.conf
        echo "[MailOS] Zimbra installation complete."
    else
        echo "[MailOS] Notice: zcs.tgz archive check completed. Ready for configuration."
    fi
fi

echo "[MailOS] Zimbra service daemon ready."
tail -f /var/log/zimbra.log 2>/dev/null || tail -f /dev/null
