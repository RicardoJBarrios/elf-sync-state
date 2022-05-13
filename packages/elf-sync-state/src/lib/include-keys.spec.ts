import { of } from 'rxjs';

import { includeKeys } from './include-keys';

describe('includeKeys', () => {
  it('maps an object to include only the defined keys', (done) => {
    of({ a: 0, b: 0, c: 0 })
      .pipe(includeKeys(['a', 'c']))
      .subscribe((value) => {
        expect(value).toEqual({ a: 0, c: 0 });
        done();
      });
  });
});
