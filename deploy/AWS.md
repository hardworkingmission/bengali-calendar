# Deploy on AWS: Docker on EC2 + RDS MySQL

This deployment runs one always-on EC2 host with frontend, backend, and Caddy
containers. RDS hosts MySQL separately. It is a single-host deployment with brief
downtime during updates, not a highly available cluster.

```text
Browser -> HTTPS :443 -> Caddy on EC2 -> Next.js :3000
                                    -> /api/* -> Express :4001 -> TLS -> RDS :3306
```

## 1. Create AWS resources

Choose one AWS region and VPC for both EC2 and RDS.

- Create an EC2 instance with Ubuntu 24.04 LTS, an encrypted EBS volume, and
  enough RAM for a Next.js build (4 GiB is a reasonable starting point; measure
  your workload). Put it in a public subnet with an internet gateway route.
  Attach an Elastic IP so DNS survives instance stop/start.
- EC2 security group: allow inbound TCP 80 and 443 from the internet. If using
  SSH, allow TCP 22 only from your own IP; alternatively configure Session Manager.
  Do not open 3000, 4001, 3306, or 8081.
- Create RDS **MySQL**, using a supported version compatible with the schema
  (the local setup uses MySQL 8.0). Set public accessibility to **No**. Use a DB
  subnet group with private subnets in at least two Availability Zones.
  Set initial database name to `bangla_calendar`.
- RDS security group: allow inbound TCP 3306 with the **EC2 security group** as
  the source. EC2 outbound rules must permit RDS TCP 3306, DNS, and HTTPS for
  container downloads, certificate issuance, email, and push delivery.
- Enable RDS encryption, automated backups, and deletion protection. Choose
  Multi-AZ if database availability is required. Set `require_secure_transport=ON`
  in a compatible RDS parameter group.
- Create a DNS A record for your chosen domain pointing to the EC2 Elastic IP.
  Only add an AAAA record if IPv6 is configured end to end.

EC2, EBS, public IPv4, RDS, and other selected AWS services incur charges.

## 2. Prepare EC2

Install Docker Engine and the Compose plugin using the
[official Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/).
Install Git, curl, and a MySQL client (`sudo apt install git curl mysql-client`).
Enable Docker on boot (`sudo systemctl enable --now docker`). Use `sudo docker`
below unless your login already has Docker access.

Clone this repository onto EC2 and run the remaining commands from its root.
Commands in this guide use the EC2 Linux shell, not Windows PowerShell.

Download the public RDS CA bundle (this is not a private key):

```bash
mkdir -p deploy/certs
curl --fail --show-error --location \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
  --output deploy/certs/rds-ca.pem
chmod 644 deploy/certs/rds-ca.pem
```

The bundle path is shared by the API, startup check, and migrations. Certificate
and hostname validation stay enabled. Use the actual RDS endpoint as `DB_HOST`.
See [AWS RDS TLS documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html)
for CA rotation and regional bundles (including other AWS partitions).

## 3. Create the application database user

Connect from EC2 as the RDS administrator; `-p` prompts for the password:

```bash
mysql --host=YOUR_RDS_ENDPOINT --user=YOUR_RDS_ADMIN --password \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca=deploy/certs/rds-ca.pem
```

Run the following SQL, replacing the example password with a unique secret:

```sql
CREATE DATABASE IF NOT EXISTS bangla_calendar CHARACTER SET utf8mb4;
CREATE USER 'calendar_app'@'%' IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD' REQUIRE SSL;
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, REFERENCES
  ON bangla_calendar.* TO 'calendar_app'@'%';
```

The current startup migration creates missing tables, so CREATE and REFERENCES
are required. Future schema alterations need explicit migrations and appropriate
permissions. The startup SQL does not migrate existing data from local MySQL;
export/import that data separately before switching traffic if it must be kept.

## 4. Configure secrets and start

```bash
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Fill in the domain (hostname only, no scheme/path), RDS endpoint, database user
and password, JWT secret, and VAPID keys. Generate a JWT secret with
`openssl rand -hex 32`. Preserve existing JWT/VAPID keys when migrating if you
want existing tokens and push subscriptions to keep working. VAPID keys are
required by the current backend even if you do not plan to use push.
For a new installation, generate a pair with:

```bash
sudo docker build -t calendar-keygen ./backend
sudo docker run --rm calendar-keygen \
  node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Copy the generated pair into the environment file before starting the app.
Treat the private key as a secret. Configure Resend and
a verified sender domain for reminder emails.

Single-quote environment values containing `$` or `#`. The production env file
is ignored by Git. Do not pass secrets as Docker build arguments or commit them.

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --wait --wait-timeout 180
sudo docker compose --env-file .env.production -f docker-compose.prod.yml ps
sudo docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 backend proxy
```

Always use this standalone production file; do not merge it with the development
Compose file. Production does not start MySQL or Adminer containers. Only Caddy
publishes host ports. It obtains and renews HTTPS certificates and redirects HTTP
to HTTPS once DNS and ports are ready; see [Caddy HTTPS requirements](https://caddyserver.com/docs/automatic-https).
Keep the `caddy-data` volume across redeployments.

The frontend is built with `NEXT_PUBLIC_API_URL=/api`, so browser requests use
the site's HTTPS origin. No separate API domain is needed. All containers use
restart policies; Docker health checks report failures but do not automatically
restart a running unhealthy process.

## 5. Verify and operate

```bash
curl -I http://YOUR_DOMAIN
curl -I https://YOUR_DOMAIN
curl --fail https://YOUR_DOMAIN/api/health
```

Expect an HTTP-to-HTTPS redirect, a successful frontend response, and
`{"ok":true}` from the API. The health endpoint checks API liveness, not database
availability. Register/sign in and save/reload a note to verify RDS end to end.
Test an actual push/email reminder as well.

Keep **one backend instance**: its in-process cron has no distributed claim/lock,
so multiple instances can deliver duplicate reminders. Before scaling to ECS or
multiple hosts, separate scheduling and add durable job claiming. Configure
uptime monitoring and alarms, and periodically test RDS backup restoration.

For updates, take a database snapshot before schema changes, keep the previous
Git revision/images for rollback, pull the intended release, then repeat the
`up -d --build --wait` command. Rolling code back does not roll database changes
back. Schedule a maintenance window when needed. Never use `down -v` during a
routine deployment; it removes the certificate volumes.

Troubleshooting: database timeouts usually indicate VPC/security-group routing;
TLS failures require checking the endpoint/CA; migration failures require checking
the database name and grants. HTTPS failures require checking public DNS and
inbound 80/443. Avoid printing rendered Compose configuration with secrets.
