.PHONY: help dev-up dev-down dev-logs dev-ps reset-volumes contracts test deploy postdeploy export-artifacts

help:
	@echo "arena-sc targets:"
	@echo "  dev-up           - bring up full dev stack (chain+contracts+postgres+api+frontend)"
	@echo "  dev-down         - tear stack down"
	@echo "  dev-logs         - tail logs"
	@echo "  dev-ps           - list services"
	@echo "  reset-volumes    - down -v then dev-up (drops DB!)"
	@echo "  contracts        - run contracts container once (tests+deploy+postdeploy)"
	@echo "  test             - run hardhat tests in a one-off container"
	@echo "  deploy           - deploy to localhost in one-off container"
	@echo "  postdeploy       - run postDeploy.js in one-off container"
	@echo "  export-artifacts - copy artifacts and address to shared volume"

# Compose wrappers

dev-up:
	docker compose -f docker-compose.dev.yml up -d --build

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

dev-ps:
	docker compose -f docker-compose.dev.yml ps

reset-volumes:
	docker compose -f docker-compose.dev.yml down -v
	$(MAKE) dev-up

# One-off helpers (using contracts image)

contracts:
	docker compose -f docker-compose.dev.yml up contracts

test:
	docker compose -f docker-compose.dev.yml run --rm contracts sh -lc "npx hardhat test"

deploy:
	docker compose -f docker-compose.dev.yml run --rm contracts sh -lc "npx hardhat run scripts/deploy.js --network localhost"

postdeploy:
	docker compose -f docker-compose.dev.yml run --rm contracts node scripts/postDeploy.js

export-artifacts:
	docker compose -f docker-compose.dev.yml run --rm contracts sh -lc "node -e \"const fs=require('fs');const p='./deployments';const f=fs.readdirSync(p).find(x=>x.startsWith('deployment-'));const j=JSON.parse(fs.readFileSync(p+'/'+f));fs.writeFileSync('/artifacts/contract_address', j.contract);\" && cp -r artifacts /artifacts/"
