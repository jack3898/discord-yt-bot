# Kubernetes deployment (WIP)

This here folder holds the minimum needed to run this bot fully sharded with Kubernetes.

Do keep in mind, I am not an expert with Kubernetes so any contributions would be highly appreciated!

The Kubernetes config does not yet auto-scale the bot and takes in a fixed number defining how many shards you would like.

Make sure you have the bot image built with the commands recommended below (make sure your terminal context is the root of this repository):

-   `docker build . -f .\.docker\Dockerfile.app --build-arg scope=@yt-bot/bot -t ytbot-bot:latest`
-   `docker build . -f .\.docker\Dockerfile.app --build-arg scope=@yt-bot/shard-manager -t ytbot-shard-manager:latest --build-arg port=3000`

## How it works

Sharding is a simple concept of having multiple Discord bot processes control one bot user. This allows the bot to scale, and be used in a growing number of Discord servers.

The Discord API only asks for how many shards there are, and which bot has which shard ID. Then, evenly allocates Discord servers to each bot shard. That means that if you have two shards, and one is offline, it will not respond to user input in roughly ~50% of Discord servers.

The bot will check for the existence of an environment variable that contains the shard manager URL.

The shard manager will run as a seperate Node process that has an open websocket connection private to the cluster. Bots connect to the shard manager, which knows how many shards to allocate (by another environment variable).

When a bot connects to the shard manager, it will automatically find a shard ID for the bot that is not already taken and assign it to the bot.

The bot receives this shard ID, and logs in to the discord API with it.

When the bot disconnects, the shard manager will receive a disconnection event, and free up the shard ID ready to be taken by another bot.

## But, I don't want to shard

That probably makes sense if you're using this bot in under 2500 Discord servers. Just run the Bot with Docker Compose instead and switch to the Kubernetes solution when you require more resources!

Or you can install Node natively and run the bot. Make sure to use Yarn and populate a .env file at the root!
