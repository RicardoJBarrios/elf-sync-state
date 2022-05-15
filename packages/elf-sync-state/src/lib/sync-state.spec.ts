import { createStore, setProp, Store, withProps } from '@ngneat/elf';
import { Subject, take, takeUntil } from 'rxjs';

import { includeKeys } from './include-keys';
import { syncState } from './sync-state';

const channels: Map<string, Subject<any>> = new Map();

class MockBroadcastChannel implements BroadcastChannel {
  private _destroy: Subject<void> = new Subject();
  constructor(public name: string) {
    channels.set(name, new Subject());
  }
  onmessage = jest.fn();
  onmessageerror = jest.fn();
  close = jest.fn().mockImplementation(() => {
    this._destroy.next();
    this._destroy.complete();
  });
  postMessage = jest
    .fn()
    .mockImplementation((message) => channels.get(this.name)?.next(message));
  addEventListener = jest.fn().mockImplementation((_type, listener) => {
    channels
      .get(this.name)
      ?.pipe(takeUntil(this._destroy))
      .subscribe((data) => listener(new MessageEvent('message', { data })));
  });
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
}

describe('syncState', () => {
  const name = 'name';

  beforeAll(() => {
    window.BroadcastChannel = MockBroadcastChannel;
  });

  it('returns the BroadcastChannel', () => {
    const store = createStore({ name }, withProps<any>({}));
    const channel = syncState(store);

    expect(channel).toBeInstanceOf(BroadcastChannel);
  });

  it(`creates a BroadcastChannel with store name plus '@store'`, () => {
    const store = createStore({ name }, withProps<any>({}));

    expect(syncState(store).name).toEqual(`${name}@store`);
  });

  it('creates a BroadcastChannel with option channel name', () => {
    const store = createStore({ name }, withProps({}));
    const channel = 'channel';

    expect(syncState(store, { channel }).name).toEqual(channel);
  });

  it('post a channel message on elf state change', () => {
    const store = createStore({ name }, withProps<any>({}));
    const channel = syncState(store);

    expect(channel.postMessage).not.toHaveBeenCalled();

    const newName = 'newName';
    store.update(setProp('newName', newName));

    expect(channel.postMessage).toHaveBeenNthCalledWith(1, { newName });
  });

  it('post a channel message on option source change', () => {
    const store = createStore({ name }, withProps<any>({ a: 0, b: 0 }));
    const source = (s: Store) => s.pipe(includeKeys(['b']));
    const channel = syncState(store, { source });

    expect(channel.postMessage).not.toHaveBeenCalled();

    store.update(setProp('b', 1));

    expect(channel.postMessage).toHaveBeenNthCalledWith(1, { b: 1 });

    store.update(setProp('a', 1));

    expect(channel.postMessage).toHaveBeenCalledTimes(1);
  });

  it('update the elf store with channel message state data', () => {
    const store = createStore({ name }, withProps<any>({}));
    syncState(store);

    const store2 = createStore({ name }, withProps<any>({}));
    jest.spyOn(store2, 'update');
    syncState(store2);

    expect(store2.update).not.toHaveBeenCalled();
    expect(store2.getValue()).toEqual({});

    const newName = 'newName';
    store.update(setProp('newName', newName));

    expect(store2.update).toHaveBeenCalledTimes(1);
    expect(store2.getValue()).toEqual({ newName });
  });

  it('update the elf store with channel message option source data', () => {
    const store = createStore({ name }, withProps<any>({ a: 0, b: 0 }));
    const source = (s: Store) => s.pipe(includeKeys(['b']));
    syncState(store, { source });

    const store2 = createStore({ name }, withProps<any>({ a: 0, b: 0 }));
    jest.spyOn(store2, 'update');
    syncState(store2);

    expect(store2.update).not.toHaveBeenCalled();
    expect(store2.getValue()).toEqual({ a: 0, b: 0 });

    store.update(setProp('b', 1));

    expect(store2.update).toHaveBeenCalledTimes(1);
    expect(store2.getValue()).toEqual({ a: 0, b: 1 });

    store.update(setProp('a', 1));

    expect(store2.update).toHaveBeenCalledTimes(1);
    expect(store2.getValue()).toEqual({ a: 0, b: 1 });
  });

  it('closes the channel on source finalize', () => {
    const store = createStore({ name }, withProps<any>({}));
    const source = (s: Store) => s.pipe(take(2));
    const channel = syncState(store, { source });

    expect(channel.close).not.toHaveBeenCalled();

    store.update(setProp('a', 1));

    expect(channel.close).toHaveBeenCalledTimes(1);
  });
});
