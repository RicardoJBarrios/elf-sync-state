# Sync State

[![npm](https://img.shields.io/npm/v/elf-sync-state?logo=npm&style=flat-square)](https://www.npmjs.com/package/elf-sync-state) [![GitHub](https://img.shields.io/github/license/ricardojbarrios/elf-sync-state?style=flat-square)](https://github.com/RicardoJBarrios/elf-sync-state/blob/main/LICENSE.md) [![GitHub Repo stars](https://img.shields.io/github/stars/ricardojbarrios/elf-sync-state?logo=github&style=flat-square)](https://github.com/RicardoJBarrios/elf-sync-state)

> Syncs elf store state across tabs

The `syncState()` function gives you the ability to synchronize an [elf store](https://ngneat.github.io/elf/) state across multiple tabs, windows or iframes using the [Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API).

First, you need to install the package via npm:

```bash
npm install elf-sync-state
```

To use it you should call the `syncState()` function passing the store:

```ts
import { createStore, withProps } from '@ngneat/elf';
import { syncState } from 'elf-sync-state';

interface AuthProps {
  user: { id: string } | null;
  token: string | null;
}

const authStore = createStore({ name: 'auth' }, withProps<AuthProps>({ user: null, token: null }));

syncState(authStore);
```

You can pass an optional `Options` object as the second parameter, which allows you to configure the following:

- `channel`: the name of the channel (default is the store name with a `@store` suffix).
- `source`: a function that receives the store and returns the data to sync. The default is `(store) => store`.
- `preUpdate`: a function to map the event message and extract the data. The default is `(event) => event.data`.
- `runGuard`: a function that determines whether the actual implementation should run. The default is `() => typeof window?.BroadcastChannel !== 'undefined'`.
- `requestState`: a boolean indicating whether the store should request the current `source` from other instances. The default is `false`.

```ts
import { syncState } from 'elf-sync-state';
import { authStore } from './auth.store';

syncState(authStore, { channel: 'auth-channel' });
```

The sync state also returns the [`BroadcastChannel`](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) object created or `undefined` if the `runGuard` function returns `false`.

```ts
import { syncState } from 'elf-sync-state';
import { authStore } from './auth.store';

const channel: BroadcastChannel | undefined = syncState(authStore);
```

## Sync a subset of the state

The `includeKeys()` operator can be used with the `source` option to sync a subset of the state.

```ts
import { includeKeys, syncState } from 'elf-sync-state';
import { authStore } from './auth.store';

syncState(authStore, {
  source: (store) => store.pipe(includeKeys(['user'])),
});
```

## Pre Update interceptor

The `preUpdate` option can be used to intercept the [`MessageEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent)
and modify the data to be synchronized taking into account other properties of the event.

```ts
import { includeKeys, syncState } from 'elf-sync-state';
import { authStore } from './auth.store';

syncState(authStore, {
  preUpdate: (event) => {
    console.log(event);
    return event.origin === '' ? undefined : event.data;
  },
});
```

## Request state

If the `requestState` option is enabled, the store will request the initial state from other available stores on the same channel during startup.

```ts
import { syncState } from 'elf-sync-state';
import { authStore } from './auth.store';

syncState(authStore, { requestState: true });
```

## Integration with Elf :mage_woman:

The use of this library has been tested together with other Elf libraries, such as [elf-entities](https://ngneat.github.io/elf/docs/features/entities/entities), [elf-persist-state](https://ngneat.github.io/elf/docs/features/persist-state) or [elf-state-history](https://ngneat.github.io/elf/docs/features/history). I have also tried to be consistent with their programming style and documentation to help with integration.

[Here](https://stackblitz.com/edit/angular-elf-sync-state?devToolsHeight=33&file=src/todo.repository.ts) you can see an example of using all of these in an Angular application. Just open the result in two different tabs to see the library in action.

> :warning: There may be a desync due to hot reload
