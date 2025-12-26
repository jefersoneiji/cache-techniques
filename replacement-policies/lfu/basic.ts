class cache_node<K, V> {
    constructor(
        public key: K,
        public value: V,
        public frequency: number = 1,
        public prev: cache_node<K, V> | null = null,
        public next: cache_node<K, V> | null = null
    ) { }
}

class doubly_linked_list<K, V> {
    private head: cache_node<K, V> | null = null;
    private tail: cache_node<K, V> | null = null;

    is_empty(): boolean {
        return this.head === null;
    }

    add_head(node: cache_node<K, V>): void {
        node.next = this.head;
        node.prev = null;

        if (this.head) {
            this.head.prev = node;
        } else {
            this.tail = node;
        }

        this.head = node;
    }

    remove_node(node: cache_node<K, V>): void {
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }
        if(node.next){
            node.next.prev = node.prev
        }else {
            this.tail = node.prev
        }
        node.next = null;
        node.prev = null;
    }

    remove_tail(): cache_node<K, V> | null {
        if (!this.tail) return null;
        const removed_node = this.tail;
        this.remove_node(removed_node);
        return removed_node;
    }
}

class lfu_cache<K, V> {
    private capacity: number;
    private size: number = 0;
    private min_freq: number = 0;
    private node_map: Map<K, cache_node<K, V>> = new Map();
    private freq_map: Map<number, doubly_linked_list<K, V>> = new Map();

    constructor(capacity: number) {
        this.capacity = capacity;
    }

    private update_frequency(node: cache_node<K, V>): void {
        const old_freq = node.frequency;
        const new_freq = old_freq + 1;

        // Remove node from old frequency list
        const old_list = this.freq_map.get(old_freq)!;
        old_list.remove_node(node);

        if (old_list.is_empty()) {
            // If the minFreq list became empty, increment minFreq
            this.freq_map.delete(old_freq);

            if (this.min_freq === old_freq) {
                this.min_freq = new_freq;
            }
        }

        // Add node to new frequency list
        if (!this.freq_map.has(new_freq)) {
            this.freq_map.set(new_freq, new doubly_linked_list());
        }

        node.frequency = new_freq;
        this.freq_map.get(new_freq)!.add_head(node);
    }

    get(key: K): V | undefined {
        if (this.node_map.has(key)) {
            const node = this.node_map.get(key)!;
            this.update_frequency(node);
            return node.value;
        }

        return undefined; // or -1, depending on desired API
    }

    put(key: K, value: V): void {
        if (this.capacity === 0) return;

        if (this.node_map.has(key)) {
            const node = this.node_map.get(key)!;
            node.value = value;
            this.update_frequency(node);
            return;
        }

        if (this.size >= this.capacity) {
            // Evict LFU item. If tie, LRU among them.
            const min_freq_list = this.freq_map.get(this.min_freq)!;
            const evicted_node = min_freq_list.remove_tail()!;
            this.node_map.delete(evicted_node.key);
            this.size--;

            if (min_freq_list.is_empty()) {
                this.freq_map.delete(this.min_freq);
                // No need to update minFreq here; the new item will set it to 1
            }
        }

        // Insert new node
        const new_node = new cache_node(key, value, 1);
        if (!this.freq_map.has(1)) {
            this.freq_map.set(1, new doubly_linked_list());
        }
        this.freq_map.get(1)!.add_head(new_node);
        this.node_map.set(key, new_node);
        this.min_freq = 1;
        this.size++;
    }

    get_freq_list(){
        console.log('FREQUENCY LIST IS: ', this.freq_map)
    }
}

const cache = new lfu_cache<number, number>(2);

cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1)); // returns 1, freq of key 1 is now 2
cache.put(3, 3); // evicts key 2 (freq 1, LRU among freq 1 items)
console.log(cache.get(2)); // returns undefined (or -1 in some implementations)
console.log(cache.get(3)); // returns 3, freq of key 3 is now 2
cache.put(4,4)
cache.put(5,5)
cache.put(6,6)
cache.get_freq_list()

