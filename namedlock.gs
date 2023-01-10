
const scopedServices_ = {
    "script": {
        lock: LockService.getScriptLock,
        cache: CacheService.getScriptCache
    },
    "document": {
        lock: LockService.getDocumentLock,
        cache: CacheService.getDocumentCache
    },
    "user": {
        lock: LockService.getUserLock,
        cache: CacheService.getUserCache
    }
};

/**
 * This function is used to try to acquire a named lock. 
 * The max amount of time a lock can be held is 60 seconds.
 * @param {GoogleAppsScript.Cache.Cache} cache - The cache service to use.
 * @param {GoogleAppsScript.Lock.Lock} globalLock - The global lock service to use.
 * @param {string} name - The name of the lock.
 * @param {number} timeout - The timeout in milliseconds. 
 * If the lock is not acquired within this time, the function will return false. 
 * Value must be greater than 0 and less than 60000.
 * @return {boolean} - True if the lock was acquired, false otherwise.
*/
function tryNamedLock_(cache, globalLock, name, timeout) {
    let initialTime = new Date().getTime();
    while (new Date().getTime() - initialTime < timeout) {
        let lock = globalLock.tryLock(timeout - (new Date().getTime() - initialTime));
        if (lock) {
            let lockName = cache.get('lock_' + name);
            if (!lockName) {
                cache.put('lock_' + name, "1", 60);
                globalLock.releaseLock();
                return true;
            }
            globalLock.releaseLock();
        }
        Utilities.sleep(50);
    }
    return false;
}

/**
 * This function is used to release a named lock.
 * @param {GoogleAppsScript.Cache.Cache} cache - The cache service to use.
 * @param {string} name - The name of the lock.
*/
function releaseNamedLock_(cache, name) {
    cache.remove('lock_' + name);
}

/**
 * Wait for a named lock to be released and throws an error if the timeout is reached.
 * @param {GoogleAppsScript.Cache.Cache} cache - The cache service to use.
 * @param {GoogleAppsScript.Lock.Lock} globalLock - The global lock service to use.
 * @param {string} name - The name of the lock.
 * @param {number} timeout - The timeout in milliseconds.
*/
function waitNamedLock_(cache, globalLock, name, timeout) {
    let result = tryNamedLock_(cache, globalLock, name, timeout);
    if (!result) {
        throw new Error('Timeout reached while waiting for lock ' + name);
    }
}


function lockObjectBuilder_(serviceBuilder, name) {
    return {
        internalLockState: false,
        tryLock: function (timeoutInMillis) {
            this.internalLockState = tryNamedLock_(serviceBuilder.cache(), serviceBuilder.lock(), name, timeoutInMillis);
            return this.internalLockState;
        },
        releaseLock: function () {
            releaseNamedLock_(serviceBuilder.cache(), name);
        },
        hasLock: function () {
            return this.internalLockState;
        },
        waitLock: function (timeoutInMillis) {
            if (!this.tryLock(timeoutInMillis)) {
                throw new Error('Timeout reached while waiting for lock ' + name);
            }
        }
    };
}


const NamedLockService = {
    /**
    * Gets a lock that prevents concurrent execution of scripts that use the same name.
    * This lock is shared across all users of the script.
    * @param {string} name - The name of the lock.
    * @return {GoogleAppsScript.Lock.Lock} - The named lock object.
    * */
    getScriptNamedLock: function (name) {
        return lockObjectBuilder_(scopedServices_['script'], name);
    },
    /**
     * Gets a lock that prevents concurrent execution of scripts that use the same name.
     * This lock is shared across all users of the document.
     * @param {string} name - The name of the lock.
     * @return {GoogleAppsScript.Lock.Lock} - The named lock object.
     * */
    getDocumentNamedLock: function (name) {
        return lockObjectBuilder_(scopedServices_['document'], name);
    },
    /**
     * Gets a lock that prevents concurrent execution of scripts that use the same name.
     * This lock is individual for each user.
     * @param {string} name - The name of the lock.
     * @return {GoogleAppsScript.Lock.Lock} - The named lock object.
     * */
    getUserNamedLock: function (name) {
        return lockObjectBuilder_(scopedServices_['user'], name);
    }
};


function testLockValue1() {
    let lock = NamedLockService.getDocumentNamedLock('lock1');
    lock.tryLock(1000);
    console.log(lock.hasLock());
}

function testLockValue1Log() {
    let lock = NamedLockService.getDocumentNamedLock('lock1');
    console.log(lock.hasLock());
}

function logLockValue() {
  console.log(CacheService.getDocumentCache().get("lock_lock1"))
}

function testReleaseLock1() {
    let lock = NamedLockService.getDocumentNamedLock('lock1');
    lock.releaseLock();
}
