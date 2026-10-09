#!/bin/bash
# Publica o Unbora na VPS (k3s), no namespace unbora.
# Sobe o Postgres do namespace unbora e publica o site, o admin, o business e a API.
# Não altera o namespace partiumenu.
set -euo pipefail

LOCK=/root/unbora/deploy.lock
exec 9>"$LOCK"
if ! flock -w 1800 9; then
  echo "Outro deploy do Unbora ainda está rodando."
  exit 1
fi

REPO=/root/unbora/repo
BRANCH=main
LOG=/root/unbora/deploy.log
mkdir -p /root/unbora

exec > >(tee -a "$LOG") 2>&1
echo "===== UNBORA DEPLOY $(date -u +%Y-%m-%dT%H:%M:%SZ) ====="

if [ ! -d "$REPO/.git" ]; then
  git clone --branch "$BRANCH" --depth 1 https://github.com/alissoncostareal/unbora.git "$REPO"
fi

cd "$REPO"
git fetch --depth 1 origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
echo "COMMIT $(git rev-parse --short HEAD)"

if [ ! -f backend/Dockerfile ]; then
  echo "Falta backend/Dockerfile em origin/$BRANCH. Nada foi publicado."
  exit 1
fi

decode_b64() {
  if [ -z "${1:-}" ]; then
    printf ''
    return
  fi
  printf '%s' "$1" | base64 -d
}

kubectl apply -f k8s/vps/namespace.yaml
kubectl apply -f k8s/vps/postgres.yaml
kubectl -n unbora rollout status statefulset/postgres --timeout=180s

DB_USER=$(kubectl -n unbora get secret unbora-postgres -o jsonpath='{.data.username}' | base64 -d)
DB_PASS=$(kubectl -n unbora get secret unbora-postgres -o jsonpath='{.data.password}' | base64 -d)
if [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
  echo "Não achei o secret unbora/unbora-postgres."
  exit 1
fi
echo "Banco unbora pronto em postgres.unbora.svc.cluster.local."

DATABASE_URL=$(DB_USER="$DB_USER" DB_PASS="$DB_PASS" python3 - <<'PY'
import os
from urllib.parse import quote
user = quote(os.environ["DB_USER"], safe="")
password = quote(os.environ["DB_PASS"], safe="")
print(f"postgresql://{user}:{password}@postgres.unbora.svc.cluster.local:5432/unbora?sslmode=disable")
PY
)

patch_secret() {
  DATABASE_URL="$DATABASE_URL" \
  GROQ_API_KEY="$(decode_b64 "${GROQ_API_KEY_B64:-}")" \
  BRAVE_API_KEY="$(decode_b64 "${BRAVE_API_KEY_B64:-}")" \
  GOOGLE_PLACES_API_KEY="$(decode_b64 "${GOOGLE_PLACES_API_KEY_B64:-}")" \
  SUPERADMIN_EMAIL="$(decode_b64 "${SUPERADMIN_EMAIL_B64:-}")" \
  SUPERADMIN_PASSWORD="$(decode_b64 "${SUPERADMIN_PASSWORD_B64:-}")" \
  ADMIN_JWT_SECRET="$(decode_b64 "${ADMIN_JWT_SECRET_B64:-}")" \
  python3 - <<'PY'
import json, os, subprocess

def nonempty(name):
    value = os.environ.get(name, "")
    return value if value else None

data = {"DATABASE_URL": os.environ["DATABASE_URL"]}
for key in (
    "GROQ_API_KEY",
    "BRAVE_API_KEY",
    "GOOGLE_PLACES_API_KEY",
    "SUPERADMIN_EMAIL",
    "SUPERADMIN_PASSWORD",
    "ADMIN_JWT_SECRET",
):
    value = nonempty(key)
    if value:
        data[key] = value

patch = json.dumps({"stringData": data})
exists = subprocess.run(
    ["kubectl", "-n", "unbora", "get", "secret", "unbora-backend-secret"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
).returncode == 0
if not exists:
    subprocess.run(
        [
            "kubectl", "-n", "unbora", "create", "secret", "generic", "unbora-backend-secret",
            "--from-literal=DATABASE_URL=" + data["DATABASE_URL"],
            "--from-literal=GROQ_API_KEY=" + data.get("GROQ_API_KEY", ""),
            "--from-literal=BRAVE_API_KEY=" + data.get("BRAVE_API_KEY", ""),
            "--from-literal=GOOGLE_PLACES_API_KEY=" + data.get("GOOGLE_PLACES_API_KEY", ""),
            "--from-literal=SUPERADMIN_EMAIL=" + data.get("SUPERADMIN_EMAIL", "admin@unbora.com"),
            "--from-literal=SUPERADMIN_PASSWORD=" + data.get("SUPERADMIN_PASSWORD", ""),
            "--from-literal=ADMIN_JWT_SECRET=" + data.get("ADMIN_JWT_SECRET", ""),
        ],
        check=True,
    )
else:
    subprocess.run(
        ["kubectl", "-n", "unbora", "patch", "secret", "unbora-backend-secret", "--type", "merge", "-p", patch],
        check=True,
    )
PY
}

patch_secret
unset DB_PASS DATABASE_URL

docker build -t unbora-api:latest -f backend/Dockerfile backend
docker save unbora-api:latest | k3s ctr images import -

VITE_GOOGLE_CLIENT_ID="$(decode_b64 "${VITE_GOOGLE_CLIENT_ID_B64:-}")"
VITE_GOOGLE_MAPS_API_KEY="$(decode_b64 "${VITE_GOOGLE_MAPS_API_KEY_B64:-}")"
docker build \
  --build-arg VITE_API_BASE_URL=https://api.unbora.com.br \
  --build-arg VITE_GOOGLE_CLIENT_ID="$VITE_GOOGLE_CLIENT_ID" \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="$VITE_GOOGLE_MAPS_API_KEY" \
  -t unbora-web:latest \
  -f frontend/Dockerfile \
  frontend
docker save unbora-web:latest | k3s ctr images import -
unset VITE_GOOGLE_CLIENT_ID VITE_GOOGLE_MAPS_API_KEY

docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.unbora.com.br \
  --build-arg NEXT_PUBLIC_API_URL=https://api.unbora.com.br \
  -t unbora-admin:latest \
  -f admin/Dockerfile \
  admin
docker save unbora-admin:latest | k3s ctr images import -

docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.unbora.com.br \
  --build-arg NEXT_PUBLIC_API_URL=https://api.unbora.com.br \
  -t unbora-business:latest \
  -f business/Dockerfile \
  business
docker save unbora-business:latest | k3s ctr images import -

kubectl apply -f k8s/vps/ollama.yaml
kubectl apply -f k8s/vps/configmap.yaml
kubectl apply -f k8s/vps/deployment.yaml
kubectl apply -f k8s/vps/service.yaml
kubectl apply -f k8s/vps/web.yaml
kubectl apply -f k8s/vps/admin.yaml
kubectl apply -f k8s/vps/business.yaml
kubectl apply -f k8s/vps/ingress.yaml

kubectl -n unbora rollout restart deploy/unbora-backend deploy/unbora-web deploy/unbora-admin deploy/unbora-business
kubectl -n unbora rollout status deploy/unbora-backend --timeout=300s
kubectl -n unbora rollout status deploy/unbora-web --timeout=180s
kubectl -n unbora rollout status deploy/unbora-admin --timeout=180s
kubectl -n unbora rollout status deploy/unbora-business --timeout=180s
echo "DEPLOY_OK $(git rev-parse --short HEAD)"
echo "Site https://unbora.com.br"
echo "Admin https://admin.unbora.com.br"
echo "Business https://business.unbora.com.br"
echo "API https://api.unbora.com.br/health"
