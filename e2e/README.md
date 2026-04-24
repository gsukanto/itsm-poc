# ITSM walkthrough recordings

Auto-generated `.webm` walkthroughs of every module, produced by `e2e/record.ts`.

## How to (re)generate

```bash
# 1) Make sure local stack is running and you have a dev JWT
docker compose up -d
pnpm dev                                        # api + web

# 2) Mint a dev JWT (HS256 with JWT_DEV_SECRET)
node -e "const c=require('crypto');const h={alg:'HS256',typ:'JWT'};const p={sub:'admin-itsm-local',oid:'admin-itsm-local',email:'admin@itsm.local',name:'ITSM Admin',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+8*3600,aud:'api://itsm'};const b=o=>Buffer.from(JSON.stringify(o)).toString('base64url');const s=b(h)+'.'+b(p);const sig=c.createHmac('sha256','dev-only-change-me').update(s).digest('base64url');console.log(s+'.'+sig)" > /tmp/dev.jwt

# 3) Record (~3-5 min for all modules)
pnpm record:videos
```

Output: one `.webm` per module under `e2e/videos/`.

## Modules covered
- dashboard, incidents, service-requests, catalog, problems, changes (+ calendar),
  cmdb, knowledge, slm, events, availability, capacity, releases, assets,
  continuity, suppliers, financial, approvals
