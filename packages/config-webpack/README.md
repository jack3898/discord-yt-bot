# Webpack config

## Why Node code is bundled

You may be wondering why this repository bothers bundling Node code, when bundle sizes are not too important for a server. The main reasons why are:

-   Reduced memory footprint
    -   ts-node is a popular way to run TypeScript code as if it were native, but takes a longer time to start and has an increased memory footprint.
    -   ts-node's transpile-only flag will not work as this bot uses reflect-metadata.
-   Opens support for other tooling
    -   If you know how to use pm2, the bundled output will be fully compatible with it making it daemonizable without fuss.
-   Saves creating a build script for all local packages
    -   If I settled with TSC (the TypeScript compiler), I would need to ensure all dependencies are JavaScript as well because TSC does not convert dependencies. This means all packages will need a build script that outputs to dist, a `main` in package.json of `dist/index.js`, generated declaration files and sourcemaps, and developers will need to run two or more code watch processes. 🤯
    -   A bundler automatically converts pure TypeScript code for me, and in development one can just run the code directly with ts-node or nodemon.
-   It's not actually that bad!
    -   This config does not bundle dependencies located in node_modules. It only bundles code written for this repository. The resulting bundle should be tiny as it only includes our code, and keeps the rest as imports. Also, it's not used in development! It only runs once during a production pre-build.

## Why not bundle everything?

The main reason I avoid bundling everything is that some packages do not bundle as they can be platform-specific binaries. Not all npm packages are written in JavaScript, and how is Webpack going to bundle binaries?

To fix that you could mark the problematic package as an external so Webpack keeps it as a importable module. But then that becomes a pain to manage as there can be quite a few problematic packages you need to ensure are included in the externals list.

In the end I settled with just marking all packages as external except our own.

## What do these emojis mean when the bundler runs? 👽📦

The alien just means the package is marked as external and was not included in the bundle.

The box means the code is bundled.

It's there for debug purposes.

I thought the alien was kinda funny. 🤣
