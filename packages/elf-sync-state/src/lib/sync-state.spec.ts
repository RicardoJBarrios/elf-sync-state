import { createStore, setProp, Store, withProps } from '@ngneat/elf';
import { Subject, takeUntil } from 'rxjs';
import { SyncMessage, syncState } from './sync-state';
import { includeKeys } from './include-keys';

const MockBroadcastChannel = jest.fn().mockImplementation((channelName) => ({
  name: channelName,
  postMessage: jest.fn(),
  close: jest.fn(),
  onmessage: jest.fn(),
}));

describe(`syncState`, () => {
  const name = 'name';
  let store: any;

  beforeEach(() => {
    store = createStore({ name }, withProps<any>({ a: 0, b: 0 }));
    window.BroadcastChannel = MockBroadcastChannel;
    jest.clearAllMocks();
  });

  it(`returns undefined if doesn't exist BroadcastChannel by default`, () => {
    window.BroadcastChannel = undefined as any;

    expect(syncState(store)).toBeUndefined();
  });

  it(`returns undefined if "runGuard" returns false`, () => {
    expect(syncState(store, { runGuard: () => false })).toBeUndefined();
  });

  it(`returns the BroadcastChannel if "runGuard" returns true`, () => {
    expect(syncState(store, { runGuard: () => true })).toBeDefined();
    expect(MockBroadcastChannel).toHaveBeenCalledTimes(1);
  });

  it(`creates a BroadcastChannel with store name plus "@store" if no "channel"`, () => {
    expect(syncState(store)?.name).toEqual(`${name}@store`);
  });

  it(`creates a BroadcastChannel with option "channel" name`, () => {
    const channel = 'channel';

    expect(syncState(store, { channel })?.name).toEqual(channel);
  });

  it(`do not post a request message with default "requestState"`, () => {
    const channel = syncState(store);

    expect(channel?.postMessage).not.toHaveBeenCalled();
  });

  it(`do not post a request message if "requestState" is false`, () => {
    const channel = syncState(store, { requestState: false });

    expect(channel?.postMessage).not.toHaveBeenCalled();
  });

  it(`post a request message if "requestState" is true`, () => {
    const channel = syncState(store, { requestState: true });

    expect(channel?.postMessage).toHaveBeenCalledTimes(1);
    expect(channel?.postMessage).toHaveBeenNthCalledWith(1, {
      type: 'REQUEST_STATE',
    });
  });

  it(`updates the store with the update state message data`, () => {
    const channel = syncState(store);
    const messageEvent = new MessageEvent('message', {
      data: { type: 'UPDATE_STATE', state: { a: 1 } },
    });
    jest.spyOn(store, 'update');

    channel?.onmessage?.(messageEvent);

    expect(store.update).toHaveBeenCalledTimes(1);
    expect(store.update).toHaveBeenNthCalledWith(1, expect.any(Function));
    expect(store.update.mock.calls[0][0]({ a: 0, b: 0 })).toEqual({
      a: 1,
      b: 0,
    });
  });

  it(`uses "preUpdate" to get the message data`, () => {
    const fn = jest.fn();
    const preUpdate = (
      event: MessageEvent<SyncMessage<typeof store>>
    ): SyncMessage<typeof store> => {
      fn(event);
      return { type: 'UPDATE_STATE', state: { a: 1 } };
    };

    const channel = syncState(store, { preUpdate });
    jest.spyOn(store, 'update');
    const messageEvent = new MessageEvent('message', {
      data: { type: 'UPDATE_STATE', state: { a: 0 } },
    });

    channel?.onmessage?.(messageEvent);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(store.update).toHaveBeenCalledTimes(1);
    expect(store.update).toHaveBeenNthCalledWith(1, expect.any(Function));
    expect(store.update.mock.calls[0][0]({ a: 0, b: 0 })).toEqual({
      a: 1,
      b: 0,
    });
  });

  it(`post an update message with the store if receives a request message`, () => {
    const channel = syncState(store);
    const messageEvent = new MessageEvent('message', {
      data: { type: 'REQUEST_STATE' },
    });

    channel?.onmessage?.(messageEvent);

    expect(channel?.postMessage).toHaveBeenCalledTimes(1);
    expect(channel?.postMessage).toHaveBeenNthCalledWith(1, {
      type: 'UPDATE_STATE',
      state: { a: 0, b: 0 },
    });
  });

  it(`post an update message with the "source" if receives a request message`, () => {
    const source = (s: Store) => s.pipe(includeKeys(['b']));
    const channel = syncState(store, { source });
    const messageEvent = new MessageEvent('message', {
      data: { type: 'REQUEST_STATE' },
    });

    channel?.onmessage?.(messageEvent);

    expect(channel?.postMessage).toHaveBeenCalledTimes(1);
    expect(channel?.postMessage).toHaveBeenNthCalledWith(1, {
      type: 'UPDATE_STATE',
      state: { b: 0 },
    });
  });

  it(`post an update message with the store on store state change`, () => {
    const channel = syncState(store);
    store.update(setProp('a', 1));

    expect(channel?.postMessage).toHaveBeenCalledTimes(1);
    expect(channel?.postMessage).toHaveBeenNthCalledWith(1, {
      type: 'UPDATE_STATE',
      state: { a: 1, b: 0 },
    });
  });

  it(`post an update message with "source" on store state change`, () => {
    const source = (s: Store) => s.pipe(includeKeys(['b']));
    const channel = syncState(store, { source });

    store.update(setProp('b', 1));

    expect(channel?.postMessage).toHaveBeenCalledTimes(1);
    expect(channel?.postMessage).toHaveBeenNthCalledWith(1, {
      type: 'UPDATE_STATE',
      state: { b: 1 },
    });

    store.update(setProp('a', 1));

    expect(channel?.postMessage).toHaveBeenCalledTimes(1);
  });

  it(`doesn't post an update message if store changes with the same values`, () => {
    const channel = syncState(store);
    store.update(setProp('a', 1));
    store.update(setProp('a', 1));

    expect(channel?.postMessage).toHaveBeenCalledTimes(1);
    expect(channel?.postMessage).toHaveBeenNthCalledWith(1, {
      type: 'UPDATE_STATE',
      state: { a: 1, b: 0 },
    });
  });

  it(`doesn't post an update message if store changes with update state message`, () => {
    const channel = syncState(store);
    const messageEvent = new MessageEvent('message', {
      data: { type: 'UPDATE_STATE', state: { a: 1 } },
    });

    channel?.onmessage?.(messageEvent);

    expect(channel?.postMessage).not.toHaveBeenCalled();
  });

  it(`closes the channel on source finalize`, () => {
    const subject = new Subject();
    const source = (s: Store) => s.pipe(takeUntil(subject));
    const channel = syncState(store, { source }) as BroadcastChannel;
    jest.spyOn(channel, 'close');

    subject.next(null);
    subject.complete();

    expect(channel.close).toHaveBeenCalledTimes(1);
  });

  it('desuscribes from source on beforeunload', () => {
    const channel = syncState(store) as BroadcastChannel;
    jest.spyOn(channel, 'close');

    window.dispatchEvent(new Event('beforeunload'));

    expect(channel.close).toHaveBeenCalledTimes(1);
  });
});
