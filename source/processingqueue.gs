
function compressItems_(items) {
    let stringifiedItems = JSON.stringify(items);
    let blob = Utilities.newBlob(stringifiedItems);
    let deflatedBlob = Utilities.gzip(blob);
    let encodedItems = Utilities.base64Encode(deflatedBlob.getBytes());
    return encodedItems;
}

function decompressItems_(encodedItems) {
    let deflatedBlob = Utilities.newBlob(Utilities.base64Decode(encodedItems, Utilities.Charset.UTF_8), 'application/x-gzip');
    let blob = Utilities.ungzip(deflatedBlob);
    let stringifiedItems = blob.getDataAsString();
    return JSON.parse(stringifiedItems);
}

const availableQueues = [1,2,3,4,5]

function getFirstAvailableQueueIndex_() {
    let first_available = asLazy(Array.from(Array(20), (_, i) => (i%5)+1)).map(
        function (queueItem) {
            console.log('Trying to lock queue_' + queueItem);
            let lock = NamedLockService.getDocumentNamedLock('queue_' + queueItem);
            let queueLock = lock.tryLock(50);
            return [queueItem, queueLock];
        }).filter(function (item) {
            return item[1];
        }).first()[0];
    console.log('First available queue: ' + first_available)
    return first_available;
}

function getProcessingQueue_(queueIndex) {
    let lock = NamedLockService.getDocumentNamedLock('queue_' + queueIndex);
    let cache = CacheService.getDocumentCache();
    let queueEncoded = cache.get('queue_' + queueIndex);
    var queue = !queueEncoded ? [] : decompressItems_(queueEncoded);
    var size = queue.reduce((acc, dataObjectJson) => acc + dataObjectJson.length, 0);
    return {
        index: queueIndex,
        addJsonItem: function (dataObjectJson) {
            size += dataObjectJson.length;
            queue = [...queue, dataObjectJson];
        },
        addJsonItems: function (dataObjectJsons) {
            size += dataObjectJsons.reduce((acc, dataObjectJson) => acc + dataObjectJson.length, 0);
            queue = [...queue, ...dataObjectJsons];
        },
        getSize: function () {
            return size;
        },
        clear: function (process) {
            if (size===0) {return ;}
            process(queue.map(JSON.parse));
            queue = [];
            size = 0;
        },
        commit: function (process) {
            if (size > 20000) {
                try {
                    this.clear(process)
                }
                catch (error) {
                    console.error('Error while sending data to target url and impossible to store more items in queue: ' + error);
                    throw error;
                }
                finally {
                    lock.releaseLock();
                }
            }
            cache.put('queue_' + queueIndex, compressItems_(queue), 21600);
            lock.releaseLock();
            return queue;
        }
    }
}

function listReadOnlyQueues() {
    let cache = CacheService.getDocumentCache();
    return asLazy(availableQueues).map(
        function (queueIndex) {
            let queueEncoded = cache.get('queue_' + queueIndex);
            var queue = !queueEncoded ? [] : decompressItems_(queueEncoded);
            return {
                index: queueIndex,
                items: queue,
                charsSize: queue.reduce((acc, dataObjectJson) => acc + dataObjectJson.length, 0)
            };
        }).toList();
}

const ProcessingQueueService = {
    getAvailableProcessingQueue: function () {
        let queueIndex = getFirstAvailableQueueIndex_();
        return getProcessingQueue_(queueIndex);
    },
    clearAllQueues: function (process) {
        var processedItems = [];
        let results = asLazy(Array.from(Array(200), (_, i) => (i%5)+1))
            .filter(i => (!processedItems.includes(i)) 
                && NamedLockService.getDocumentNamedLock('queue_' + i).tryLock(50))
            .map(i => {
                let processingQueue = getProcessingQueue_(i);
                processingQueue.clear(process);
                processedItems.push(i);
                return processingQueue.commit(process);
            });
        /* return concatenated lists */
        return results.reduce((acc, list) => [...acc, ...list], []);
    }
};
