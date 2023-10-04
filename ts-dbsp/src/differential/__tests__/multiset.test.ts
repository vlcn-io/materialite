import { expect, test } from 'vitest'

/**
 * We need a more efficient difference.
 * One that produces small sets when overlap is small.
 * 
 * So no concat negate crazyness.
 * 
 * concat + negate + normalize?
 * 
 * But carrying these concats forward seems bogus.
 * 
 * 
 */

test("map then difference", () => {
  
});