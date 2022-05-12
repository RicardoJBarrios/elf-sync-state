# Sync State

[![npm](https://img.shields.io/npm/v/elf-sync-state?logo=npm&style=flat-square)](https://www.npmjs.com/package/elf-sync-state) [![GitHub watchers](https://img.shields.io/github/watchers/ricardojbarrios/elf-sync-state?logo=github&style=flat-square)](https://github.com/RicardoJBarrios/elf-sync-state) [![GitHub](https://img.shields.io/github/license/ricardojbarrios/kuoki?style=flat-square)](https://github.com/RicardoJBarrios/elf-sync-state/blob/main/LICENSE.md) [![GitHub issues environment](https://img.shields.io/github/issues/ricardojbarrios/elf-sync-state?logo=github&label=issues&style=flat-square)](https://github.com/RicardoJBarrios/elf-sync-state/issues)

The `syncState()` function gives you the ability to sync an [elf](https://ngneat.github.io/elf/) store state across multiple tabs, windows, iframes or workers using the [Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API).

First, you need to install the package via npm:

```bash
npm i elf-sync-state
```

To use it you should call the `syncState()` function, passing the store and the options:

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

- `channel`: the name of the channel (by default - the store name).
- `source`: a method that receives the store and return what to sync from it (by default - the entire store).

The sync state also returns the created [`BroadcastChannel`](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel).
