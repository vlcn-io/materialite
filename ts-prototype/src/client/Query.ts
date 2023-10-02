/**
 * Our query API can be much like Aphrodite and just resolve against the MemTree(s) directly? And of course
 * the persistor worker.
 * 
 * How can we do this only via maps, filters, reduces?
 */

// deck.whereId(eq(123)).select('name', 'description', (d) => d.slides());
// vs treeql
// d.{name, description, slides: [slide.{id, content} where deck_id = 123 and order > :cursor limit :n]} where id = 123

// what if we only want components?
// d.{name, description, components: [component.{content} where component.slide_id = (slide.id where deck_id = 123)]}

/**
 * Now what do those operations look like against the indices?
 * 
 * - Allow dev to indicate index to use in query?
 * 
 * Becomes a plan that operates against the index then chains more ops.
 * 
 * Pull from index [(type).(attr)] where attr = value
 *   For each result
 *     Pull from index [(type).(attr)] where attr = value, filter where attr > value, limit n
 * 
 * 
 * It is all maps and filters. The only special case is a "pull from index" operation.
 * The rest are chunk iterables for one or more of:
 * - mapping / selecting
 * - filtering / whereing
 * - limiting / taking
 * - ordering / sorting
 */