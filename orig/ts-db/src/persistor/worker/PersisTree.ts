/**
 * Accumulates MemTrees and persists after a given point.
 * 
 * Either over-writes the existing tree on disk or writes a new tree.
 * 
 * Maybe always over-write until tree hits page size? Then start a new tree?
 * 
 * PersisTree is a balanced binary search tree since we need to be able to traverse in order for 
 * when serializing to disk.
 */