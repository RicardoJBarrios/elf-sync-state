import { Store, StoreValue } from '@ngneat/elf';
import { OperatorFunction, pipe } from 'rxjs';
import { map } from 'rxjs/operators';

export function includeKeys<S extends Store, State extends StoreValue<S>>(
  keys: Array<keyof State>
): OperatorFunction<State, Partial<State>> {
  return pipe(
    map((state) => {
      return Object.keys(state).reduce<State>((toSave, key) => {
        if (keys.includes(key)) {
          toSave[key] = state[key];
        }

        return toSave;
      }, {} as State);
    })
  );
}
