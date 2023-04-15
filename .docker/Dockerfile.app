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

ARG port

EXPOSE ${port}

ARG scope

ENV SCOPE ${scope}

RUN yarn run init
RUN yarn run db:seed

CMD ["yarn", "run", "start"]