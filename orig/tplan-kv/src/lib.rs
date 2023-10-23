use std::{collections::HashMap, path::Path};

#[derive(Debug)]
pub struct KVErr {
    msg: String,
}

pub type KVResult<T> = Result<T, KVErr>;

pub struct KvStore {
    map: HashMap<String, String>,
}

impl KvStore {
    pub fn open(path: &Path) -> KVResult<KvStore> {
        Ok(KvStore::new())
    }

    pub fn new() -> KvStore {
        KvStore {
            map: HashMap::new(),
        }
    }

    pub fn get(&self, key: String) -> KVResult<Option<String>> {
        Ok(self.map.get(&key).cloned())
    }

    pub fn set(&mut self, key: String, value: String) -> KVResult<()> {
        self.map.insert(key, value);
        Ok(())
    }

    pub fn remove(&mut self, key: String) -> KVResult<()> {
        self.map.remove(&key);
        Ok(())
    }
}
