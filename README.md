# Discord YouTube Bot 3

The third one!

This README will look much nicer in the future, but for now it's a place to jot notes for development.

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
