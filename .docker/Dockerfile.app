FROM node:18-bullseye-slim as pruner

WORKDIR /home/node

COPY . .

ARG scope

RUN yarn global add turbo
RUN yarn run prune -- --scope ${scope} --out-dir __build/pruned

FROM node:18-bullseye-slim

WORKDIR /home/node

COPY --from=pruner --chown=node /home/node/__build/pruned .

USER node

RUN yarn install

ARG port

EXPOSE ${port}

ARG scope

ENV SCOPE ${scope}

CMD ["yarn", "run", "start"]