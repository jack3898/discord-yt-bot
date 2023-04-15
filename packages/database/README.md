# Database package

This package exports an instance of the Prisma Client from the generated @prisma/client package.

## Unit testing

This package also provides a helpful Jest deep mock proxy instance for use in unit tests.

In your Jest setup file simply include at least the following:

```ts
import { deepMockedPrismaClientReset } from "@yt-bot/database";

jest.mock("@yt-bot/database", () => ({
    __esModule: true,
    ...jest.requireActual("@yt-bot/database"),
    prismaClient: jest.requireActual("@yt-bot/database").deepMockedPrismaClient,
}));

global.beforeEach(() => {
    deepMockedPrismaClientReset();
});
```

Then in your unit tests you can import the `deepMockedPrismaClient` and use Jest's helpful methods to mock the database!

```ts
import { deepMockedPrismaClient } from '@yt-bot/database';

it('returns a user', async () => {
    deepMockedPrismaClient.user.findFirst.mockResolvedValue({
        id: 1,
        name: 'Jack'
    });

    const result = await class.methodThatRunsAndReturnsTheQuery();

    expect(result).toEqual({
        id: 1,
        name: 'Jack'
    })
});
```
