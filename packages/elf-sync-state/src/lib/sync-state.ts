import { Store, StoreValue } from '@ngneat/elf';
import { isEqual } from 'lodash-es';
import { distinctUntilChanged, finalize, Observable, skip, tap } from 'rxjs';

interface Options<S extends Store> {
  channel?: string;
  source?: (store: S) => Observable<Partial<StoreValue<S>>>;
}

export function syncState<S extends Store>(
  store: S,
  options?: Options<S>
): BroadcastChannel {
  const defaultOptions: Required<Options<S>> = {
    channel: `${store.name}@store`,
    source: (_store) => _store.asObservable(),
  };

  const merged = { ...defaultOptions, ...options };

  const stateChannel = new BroadcastChannel(merged.channel);
  let isPostable = true;

  stateChannel.addEventListener('message', (event: MessageEvent) => {
    isPostable = false;
    store.update((state) => ({ ...state, ...event.data }));
  });

  merged
    .source(store)
    .pipe(
      skip(1),
      distinctUntilChanged(isEqual),
      tap((value) => {
        if (isPostable) {
          stateChannel.postMessage(value);
        } else {
          isPostable = true;
        }
      }),
      finalize(() => stateChannel.close())
    )
    .subscribe();

  return stateChannel;
}
