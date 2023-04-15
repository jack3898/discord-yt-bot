# Discord YouTube Bot

A Node-based Discord YouTube bot. It's currently in development and there are more features to come!

This bot is written with Discord.js v14, using the Discord v10 API. So it uses slash commands.

This README will be updated to look prettier and contain more information soon when the bot is near MVP.

## Running the bot

### Docker

-   Download this repository or use `git clone`
-   Install docker on your system
-   Build the image
    -   `docker build -t yt_bot:latest -f .docker/Dockerfile.app . --build-arg scope=@yt-bot/bot` to build the image
-   Run the image
    -   `docker run --name youtube_bot -e NODE_ENV=production -e DISCORD_TOKEN=[TOKEN HERE] -e CLIENT_ID=[CLIENT ID HERE] yt_bot:latest`
    -   You may want to volume mount the database at `packages\database\app.db` so it persists between multiple containers.

### Native

You can run this bot without Docker if you like.

-   Install Node.js v18 (LTS)
-   Download and extract this repostory or use `git clone`
-   Run `npm install -g yarn`
-   Run `yarn run init` to install the repo, and build dependencies
-   Run `yarn run db:seed` to just include vital starting data for the app to work in the db
-   Run `cp .env.example .env` to copy the example env file to a new .env
-   Satify env details.
    -   IMPORTANT: If you include a guild ID then slash commands will be registered in discord server scope. It is recommended to ignore this as it is useful for development only!
-   Run yarn run start:all-daemon which will daemonise the Discord bot and run it as a background process.
    -   Do checkout the [pm2 documentation](https://pm2.keymetrics.io/docs/usage/quick-start/) for more tips on how to use it effectively!

### Kubernetes

Kubernetes support is very under-developed, so I would not recommend you use it. If you know Kubernetes, and would like to contribute the adding of it, please get in touch!

## Getting started as a developer

-   Download Node.js v18 (LTS)
-   Clone the repository
-   Run `npm install -g yarn`
-   Run `yarn run init` to install the repo, and build dependencies
-   Run `yarn run db:seed` to just include vital starting data for the app to work in the db
-   Run `cp .env.example .env` to copy the example env file to a new .env
-   Satisfy env details
-   Run `yarn run dev`
-   Done!

TIP:
If you use Visual Studio Code, there is an out of the box debugger profile you can use.

### Testing

You can run `yarn run test:watch` to run tests for all packages and files changed since the last commit. While you develop, I recommend just `cd`-ing to the package directory and running `npx jest --watch`.

Unit tests are currently only written for services and packages. The tests for commands would be too unweildy, hard to maintain and i'd consider them more as integration tests anyway.

Check out the README in packages/database for more info on how database mocking works.

## How do I contribute?

At the moment this is a small project and it's just been me developing it at the moment, so contributing guidelines and repository settings have not been finalised for contributions! So just raise an issue, submit a PR or get in touch if you want more information. :) I won't blame you for missing some details.
