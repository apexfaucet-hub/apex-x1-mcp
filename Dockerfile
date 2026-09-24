# The bridge is one dependency-free file; this image lets registries (Glama and others) build it and run the standard
# MCP introspection (initialize, tools/list) against the hosted server it forwards to.
FROM node:20-alpine
WORKDIR /app
COPY package.json index.js ./
ENTRYPOINT ["node", "index.js"]
