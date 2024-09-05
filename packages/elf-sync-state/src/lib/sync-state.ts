import { Store, StoreValue } from '@ngneat/elf';
import { isEqual } from 'lodash-es';
import {
  finalize,
  Observable,
  tap,
  skip,
  distinctUntilChanged,
  first,
  filter,
  Subject,
  fromEvent,
  takeUntil,
} from 'rxjs';

export type PartialStore<S extends Store> = Partial<StoreValue<S>>;

export type SyncMessage<S extends Store> =
  | { type: 'REQUEST_STATE' }
  | { type: 'UPDATE_STATE'; state: PartialStore<S> };

interface Options<S extends Store> {
  channel?: string;
  source?: (store: S) => Observable<PartialStore<S>>;
  preUpdate?: (event: MessageEvent<SyncMessage<S>>) => SyncMessage<S>;
  runGuard?: () => boolean;
  requestState?: boolean;
}

export function syncState<S extends Store>(
  store: S,
  options?: Options<S>
): BroadcastChannel | undefined {
  const {
    channel = `${store.name}@store`,
    source = (_store: S) => _store.asObservable(),
    preUpdate = (_event: MessageEvent<SyncMessage<S>>) => _event.data,
    runGuard = () => typeof window?.BroadcastChannel !== 'undefined',
    requestState = false,
  } = options || {};

  if (!runGuard()) {
    return undefined;
  }

  const stateChannel = new BroadcastChannel(channel);
  let isExternalUpdate = false;

  if (requestState) {
    stateChannel.postMessage({ type: 'REQUEST_STATE' });
  }

  stateChannel.onmessage = (event: MessageEvent<SyncMessage<S>>) => {
    const message = preUpdate(event);

    switch (message.type) {
      case 'REQUEST_STATE': {
        source(store)
          .pipe(first())
          .subscribe((state) => {
            stateChannel.postMessage({ type: 'UPDATE_STATE', state });
          });
        break;
      }
      case 'UPDATE_STATE': {
        isExternalUpdate = true;
        store.update((state) => ({ ...state, ...message.state }));
        isExternalUpdate = false;
        break;
      }
    }
  };

  const unsubscribe$ = new Subject<void>();

  fromEvent(window, 'beforeunload')
    .pipe(takeUntil(unsubscribe$))
    .subscribe(() => {
      unsubscribe$.next();
      unsubscribe$.complete();
    });

  source(store)
    .pipe(
      skip(1),
      filter(() => !isExternalUpdate),
      distinctUntilChanged(isEqual),
      tap({
        next: (state) =>
          stateChannel.postMessage({ type: 'UPDATE_STATE', state }),
      }),
      finalize(() => stateChannel.close()),
      takeUntil(unsubscribe$)
    )
    .subscribe();

  return stateChannel;
}
