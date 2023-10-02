pub struct KvStore {}

impl KvStore {
    pub fn new() -> KvStore {
        KvStore {}
    }

    pub fn get(&self, key: String) -> Option<String> {
        None
    }

    pub fn set(&mut self, key: String, value: String) {}

    pub fn remove(&mut self, key: String) {}
}
