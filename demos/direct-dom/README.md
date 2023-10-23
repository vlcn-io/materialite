Directly manipulates the DOM.

This approach is interesting but abandoned given:

- This approach here would require an entirely new UI framework.
- React virtualized tables outperform massive DOM lists, even if we just update a single row in the DOM.
