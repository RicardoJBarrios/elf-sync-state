# Sync State

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
