# Language

This bot can be easily translated by creating your own language pack.

## Make your own

To translate this bot, copy and paste the existing english language pack, then replace the path to the language pack in `index.ts`.

When making your own language pack, you must keep the following in mind:

-   Do not change the structure of the language pack. Changing it may cause the bot to crash.
-   Any text within the curly brackets is there because of the templating library being used. (i.e. `{{` and `}}`).
-   Text within the bounds of the template syntax are referenced by code, so changing them may cause incorrect responses. You can remove it if you like.
