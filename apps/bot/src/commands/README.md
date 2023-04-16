# Commands

Here is the home of the slash commands.

## How to register a new one

Simply create a new named class export, decorate it with `@injectable` and define its logic.

```ts
@injectable() // <- Magic decorator, this is required for dependency injection
export class Mycommand implements ICommand {
    // Inject services into this command
    constructor(
        private botService: BotService, // <- This one is real
        private anotherService: AnotherService, // <- This one isn't, just an example
    ) {}

    // The slash command that will be published to the Discord API
    definition = new SlashCommandBuilder()
        .setName("name")
        .setDescription("I do something cool!");

    // Handle the command logic
    async execute(interaction: CommandInteraction) {
        try {
            await this.anotherService.somethingElse();

            await interaction.reply(
                `I am a bot named ${this.botService.user?.username} and this command works!`,
            );
        } catch (error) {
            // ...
        }
    }
}
```

Then inside of `index.ts`, export it like the others and you're done!

One thing I did gloss over is translation, but you can see how that works from the other commands.
