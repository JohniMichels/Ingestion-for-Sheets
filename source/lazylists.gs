
/**
 * Creates a lazy list from an array.
 * @param {any[]} list
 * @return {LazyList}
*/
function asLazy(list) {
    let index = -1;
    let enumerator =  {
        moveNext: function () {
            index++;
            return index < list.length;
        },
        getCurrent: function () {
            return list[index];
        },
        reset: function () {
            index = -1;
        }
    };
    return registerMethods_(enumerator);
}

/**
 * Registers methods on the enumerator.
 * @param {LazyList} enumerator
 * @return {LazyList}
*/
function registerMethods_(enumerator) {
    enumerator.map = function (mapper) {
        return lazyMap_(enumerator, mapper);
    };
    enumerator.filter = function (predicate) {
        return lazyFilter_(enumerator, predicate);
    };
    enumerator.reduce = function (reducer, initialValue) {
        return lazyReduce_(enumerator, reducer, initialValue);
    };
    enumerator.toList = function () {
        return lazyToList_(enumerator);
    };
    enumerator.take = function (n) {
        return lazyTake_(enumerator, n);
    };
    enumerator.first = function () {
        return enumerator.take(1).toList()[0];
    };
    enumerator.forEach = function (action) {
        while (enumerator.moveNext()) {
            action(enumerator.getCurrent());
        }
    };
    return enumerator;
}

function lazyTake_(enumerator, n) {
    var newEnumerator = {
        initialN: n,
        remainingN: n,
        moveNext: function () {
            
            return this.remainingN-- > 0 && enumerator.moveNext();
        },
        getCurrent: function () {
            return enumerator.getCurrent();
        },
        reset: function () {
            this.remainingN = this.initialN;
            enumerator.reset();
        }
    };
    return registerMethods_(newEnumerator);
}

function lazyMap_(enumerator, mapper) {
    var newEnumerator = {
        moveNext: function () {
            return enumerator.moveNext();
        },
        getCurrent: function () {
            return mapper(enumerator.getCurrent());
        },
        reset: function () {
            enumerator.reset();
        }
    };
    return registerMethods_(newEnumerator);
}

function lazyFilter_(enumerator, predicate) {
    var newEnumerator = {
        moveNext: function () {
            while (enumerator.moveNext()) {
                if (predicate(enumerator.getCurrent())) {
                    return true;
                }
            }
            
            return false;
        },
        getCurrent: function () {
            return enumerator.getCurrent();
        },
        reset: function () {
            enumerator.reset();
        }
    };
    return registerMethods_(newEnumerator);
}

function lazyReduce_(enumerator, reducer, initialValue) {
    let result = initialValue;
    while (enumerator.moveNext()) {
        result = reducer(result, enumerator.getCurrent());
    }
    return result;
}

function lazyToList_(enumerator) {
    var list = [];
    while (enumerator.moveNext()) {
        list.push(enumerator.getCurrent());
    }
    return list;
}


function testLazy() {
    let arg = asLazy([1,2,3,4,5]);
    let items = arg.map(
      function(x) { 
        console.log(x);
        return 10*x;
      }
    ).map(function (x) {
      console.log(x);
      return x*10;
    }).map(
      function (x) {
        console.log(x);
        return x
      }
    ).filter(function (x) {return x<300;}).toList();
  }
  