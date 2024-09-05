import { of } from 'rxjs';

import { includeKeys } from './include-keys';

describe(`includeKeys`, () => {
  it(`returns an object with the defined keys`, (done) => {
    of({ a: 0, b: 0, c: 0 })
      .pipe(includeKeys(['a', 'c']))
      .subscribe((value) => {
        expect(value).toEqual({ a: 0, c: 0 });
        done();
      });
  });

  it(`returns an empty object if no defined keys`, (done) => {
    of({ a: 0, b: 0, c: 0 })
      .pipe(includeKeys([]))
      .subscribe((value) => {
        expect(value).toEqual({});
        done();
      });
  });
});
