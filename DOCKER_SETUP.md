# MobiMap STEM Web App - Docker Setup

## Visão Geral
O MobiMap STEM Web App está integrado ao `docker-compose.yml` principal do servidor (`../docker-compose.yml`).

### Containers
- **mobimap-backend**: Express API (porta 3001 interna, acesso via Caddy)
- **mobimap-db**: PostgreSQL 16 (porta 5432 interna)

### Acesso
- **Frontend**: https://vinihomenas.duckdns.org/mobimap/
- **API**: https://vinihomenas.duckdns.org/mobimap/api/
- **Health Check**: https://vinihomenas.duckdns.org/status/mobimap

---

## Setup do Backend

O backend está configurado no `docker-compose.yml`:

```yaml
mobimap-backend:
  build: ./MobiMap STEM Web App/backend
  container_name: mobimap-backend
  restart: unless-stopped
  environment:
    - DATABASE_URL=postgresql://mobimap:mobimap123@mobimap-db:5432/mobimap_stem?schema=public
    - PORT=3001
  ports:
    - "3001:3001"
  depends_on:
    mobimap-db:
      condition: service_healthy
  networks:
    - caddy_net

mobimap-db:
  image: postgres:16-alpine
  container_name: mobimap-db
  ...
```

O backend será buildado, as migrações rodarão, o seed será aplicado, e a API iniciará automaticamente.

---

## Setup do Frontend

### 1. Buildar o frontend localmente
```bash
cd "MobiMap STEM Web App"
npm install
npm run build
```

Isso gera o diretório `dist/` com os arquivos buildados.

### 2. Copiar para o servidor Docker
```bash
cp -r dist/* ../site/mobimap-stem/
```

**Nota**: Se o diretório `../site/mobimap-stem/` não existir, crie-o:
```bash
mkdir -p ../site/mobimap-stem
```

### 3. Reiniciar o Caddy
```bash
docker-compose restart caddy
```

---

## Endpoints da API

### Universities
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/universities` | Listar universidades |
| POST | `/api/universities` | Criar universidade |
| GET | `/api/universities/:id` | Obter detalhe |
| PUT | `/api/universities/:id` | Atualizar (full) |
| PATCH | `/api/universities/:id` | Atualizar (parcial) |
| DELETE | `/api/universities/:id` | Deletar |
| GET | `/api/universities/:id/checklist` | Obter checklist |
| PUT | `/api/universities/:id/checklist` | Atualizar checklist |

### Comparisons / Ranking
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/comparisons/presets` | Listar presets |
| POST | `/api/comparisons/presets` | Criar preset |
| PUT | `/api/comparisons/presets/:id` | Atualizar preset |
| DELETE | `/api/comparisons/presets/:id` | Deletar preset |
| POST | `/api/ranking/calculate` | Calcular ranking |

### Scenarios
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/scenarios` | Listar cenários |
| POST | `/api/scenarios` | Criar cenário |
| PUT | `/api/scenarios/:id` | Atualizar cenário |
| DELETE | `/api/scenarios/:id` | Deletar cenário |

---

## Banco de Dados

### Credenciais
- **User**: `mobimap`
- **Password**: `mobimap123`
- **Database**: `mobimap_stem`
- **Host**: `mobimap-db` (interno) / `localhost:5432` (dev local)

### Dados Iniciais
O seed roda automaticamente no primeiro startup:
- 5 universidades (Trento, Coimbra, FEUP, TU Berlin, PoliMi)
- 4 comparison presets (Custo, STEM, Carreira, Equilibrado)
- 3 decision scenarios (Bolsa+residência, Part-time, Orçamento mínimo)

---

## Desenvolvimento Local

### Dev Backend
```bash
cd backend
npm install
npm run dev
```
Acessa PostgreSQL em `localhost:5432`.

### Dev Frontend
```bash
npm install
npm run dev
```
Acessa backend em `http://localhost:3001/api/` (configure em `.env` ou nos hooks).

---

## Troubleshooting

### Erro de conexão ao banco
Verifique se o container `mobimap-db` está saudável:
```bash
docker-compose logs mobimap-db
docker-compose ps mobimap-db
```

### API retorna erro 502
Caddy não conseguiu conectar ao backend. Verifique:
```bash
docker-compose logs mobimap-backend
docker-compose ps mobimap-backend
```

### Seed não rodou
Limpe o volume e reinicie:
```bash
docker-compose down -v
docker-compose up --build
```

### Frontend não carrega
Verifique se o build foi copiado:
```bash
ls ../site/mobimap-stem/
```
Se vazio, rode o build novamente.

---

## Notes
- O frontend usa localStorage para fallback offline
- O Caddyfile redireciona `/mobimap/api/*` para a API (removendo `/mobimap` do path)
- A SPA usa `try_files {path} /index.html` para roteamento client-side
