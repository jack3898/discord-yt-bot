# Discord YouTube Bot 3

The third one!

This README will look much nicer in the future, but for now it's a place to jot notes for development.

## Getting started as a developer

-   Clone the repository
-   Run `npm install -g yarn`
-   Run `yarn run init` to install the repo, and build dependencies
-   Run `cp .env.example .env` to copy the example env file to a new .env
-   Satisfy env details
-   Run `yarn run dev`
-   Done!

## Build Docker images

### Build requirements

-   Shard manager

    -   Args:
        -   scope (should be @yt-bot/shard-manager)
        -   port
    -   Env:
        -   NODE_ENV (development or production)
    -   Env (optional)
        -   SHARD_MANAGER_URL (e.g. http://localhost:3000)
        -   SHARDS (e.g. 3 for 3 shard connections)

-   Bot
    -   Args:
        -   scope (should be @yt-bot/bot)
    -   Env:
        -   NODE_ENV (development or production)
        -   DISCORD_TOKEN
        -   CLIENT_ID
        -   SHARD_MANAGER_URL (e.g. http://localhost:3000)
    -   Env (optional):
        -   GUILD_ID
