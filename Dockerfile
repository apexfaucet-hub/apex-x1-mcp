# The bridge is one dependency-free file; this image lets registries (Glama and others) build it and run the standard
# MCP introspection (initialize, tools/list) against the hosted server it forwards to.
FROM node:20-alpine
WORKDIR /app
COPY package.json index.js ./
# X1 profile by default: this listing is "APEX X1" (20 tools). Override with a different CMD: "arc", "web", or "" for every tool.
ENTRYPOINT ["node", "index.js"]
CMD ["x1"]
