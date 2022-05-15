# Sync State

[![npm](https://img.shields.io/npm/v/elf-sync-state?logo=npm&style=flat-square)](https://www.npmjs.com/package/elf-sync-state) [![GitHub](https://img.shields.io/github/license/ricardojbarrios/kuoki?style=flat-square)](https://github.com/RicardoJBarrios/elf-sync-state/blob/main/LICENSE.md) [![GitHub issues environment](https://img.shields.io/github/issues/ricardojbarrios/elf-sync-state?logo=github&label=issues&style=flat-square)](https://github.com/RicardoJBarrios/elf-sync-state/issues)

The `syncState()` function gives you the ability to sync an [elf](https://ngneat.github.io/elf/) store state across multiple tabs, windows, iframes or workers using the [Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API).

First, you need to install the package via npm:

```bash
npm i elf-sync-state
```

To use it you should call the `syncState()` function, passing the store:

```ts
import { createStore, withProps } from '@ngneat/elf';
import { syncState } from 'elf-sync-state';

interface AuthProps {
  user: { id: string } | null;
}

const authStore = createStore(
  { name: 'auth' },
  withProps<AuthProps>({ user: null })
);

const channel: BroadcastChannel = syncState(authStore);
```

As the second parameter you can pass an optional `Options` object, which can be used to define the following:

- `channel`: the name of the channel (by default - the store name plus a `@store` suffix).
- `source`: a method that receives the store and return what to sync from it (by default - the entire store).

```ts
import { includeKeys, syncState } from 'elf-sync-state';
import { todoStore } from './todo.store';

syncState(todoStore, {
  channel: 'todo-channel',
  source: () => todoStore.pipe(includeKeys(['ids', 'entities'])),
});
```

The sync state also returns the [`BroadcastChannel`](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) object created.

## Sync a state subset

The `includeKeys()` operator can be used to sync a subset of the state:

```ts
import { includeKeys, syncState } from 'elf-sync-state';
import { todoStore } from './todo.store';

syncState(todoStore, {
  source: () => todoStore.pipe(includeKeys(['ids', 'entities'])),
});
```

## Integration with other plugins

The use of this library has been tested together with other store libraries, such as [elf-entities](https://ngneat.github.io/elf/docs/features/entities/entities), [elf-persist-state](https://ngneat.github.io/elf/docs/features/persist-state) or [elf-state-history](https://ngneat.github.io/elf/docs/features/history).

[Here](https://stackblitz.com/edit/angular-elf-sync-state?devToolsHeight=33&file=src/app/todo.repository.ts) is an example of using all of these in an Angular application. Just open the result in two different tabs to see the library in action.

> :warning: There may be a desync due to hot reload
