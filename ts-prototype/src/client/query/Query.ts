/**
 * Our query API can be much like Aphrodite and just resolve against the MemTree(s) directly? And of course
 * the persistor worker.
 * 
 * How can we do this only via maps, filters, reduces?
 * 
 * Maintains concepts of live or not queries.
 */

// deck.whereId(eq(123)).select('name', 'description', (d) => d.slides());
// vs treeql
// d.{name, description, slides: [slide.{id, content} where deck_id = 123 and order > :cursor limit :n]} where id = 123

// what if we only want components?
// d.{name, description, components: [component.{content} where component.slide_id = (slide.id where deck_id = 123)]}

// Keep it SQL-like for now?
/*
SELECT name, description, [
  SELECT content FROM component WHERE component.slide_id = (SELECT id FROM slide WHERE deck_id = :deck_id)
] as components FROM deck WHERE id = :deck_id

It is really just better JSON operators.
[] -> json_group_array
But we'll return an array of objects instead of json string.
And we'll return objects by default rather than arrays.
Ppl can index via Object.keys if they'd like that access pattern.

Ideally we allow actually storing and interpreting JSON in the DB.

Pipe the SQL-like results into a computation pipeline that implements differential dataflow?
The SQL stuff is for getting the relations and not much IVM is needed there.
The application transform logic may need IVM, however.
*/

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

/**
 * Deck.select(...).whereId(eq(123));
 * Deck.select(title, (_) => Slide.select(name, content).whereDeckId(eq(123))).whereId(123);
 */