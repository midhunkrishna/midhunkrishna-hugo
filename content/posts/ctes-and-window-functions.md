+++
date = "2017-08-14T15:31:25+05:30"
title = "ctes and window functions"
description = "Readability through abstraction"
type = "posts"
+++

I am a big fan of code readability, but being a fan and expecting the code I write to be readable are two different things. Readable code is easier to understand and much more straightforward to grasp. One significant difference I find while comparing readable and unreadable code, apart from the obvious, is how many different variables I have to hold in my head at a time while I try to grapple my head around it. If this task is simple, I believe that this is not because of some random act of brilliance but due to careful code construction.

A particular example is SQL. The more it does, the more it gets unreadable, A good way to make it readable is using the above mentioned Common Table Expressions or CTEs.

CTEs helps achieve this by its ability to separate data into independent logical entities according to the context of the query.

{{< gist midhunkrishna 6c863c9b7125e89409395556c70ce790 >}}

Hence we have a clear classification called popular posts, which is an abstraction of any post with an upvote count of six or above.



## What I came across the other day...

The other day I ran into a case in which a query was taking much more time than it should. When checked, I found that the join table was quite large. I didn't know how to handle this but hey, someone must have faced a similar issue and then I found out window functions.

Lets take a use case and see how Window Functions can be of use.

For a particular report, in our e-commerce app, we need to find out each item's latest n review-comments, in our case, we can set n = 2.

We can write a simple join and then filter that in our application language (Ruby, Go, PHP etc.)

{{< gist midhunkrishna 9c1336862b3946b305ddeea530fc03f2 >}}

but, for a system like Amazon, this solution would turn out to be awful since items might have large number of comments and to tackle the sheer number of items an comments, we will have to possibly reduce the dataset size even before the join.

## Window Function

In general, a Window Function, is a mathematical function that is zero valued outside of some interval. In case of SQL engines, they operate on rows that are related to the current row, in our case, this can be the item_id. All rows of the join that has a common item_id acts as a partition over which the window function acts.

## Getting back to our problem

We rewrite our query to do the following:

 * Window function should operate on a partition of same item_ids
 * Each of these partitions should be ordered by created time stamp of review_comment
 * select only the top two from each partition


{{< gist midhunkrishna bdd4e9a25e522e90c1fa93ee1bc39a78 >}}


This still is resulting in full join table, but now we have `comment_row_number` field to let us know that the newest review_comment has a value of 1. All we need to do now is to filter using that column. We have used row_number() function from postgres as the window function here. {{< hyperlink url="https://www.postgresql.org/docs/9.3/static/functions-window.html" text="According to the docs," >}} any built-in or user-defined aggregate function can be used as a window function.


{{< gist midhunkrishna 132a8c3bc1b3e380d90be2ca0b262c2e >}}


## Putting it all together

Even though we have our answer, our query has become pretty hard to read. We can get better readability by introducing a {{< hyperlink text="Common Table Expression." url="https://www.postgresql.org/docs/9.6/static/queries-with.html" >}}

{{< gist midhunkrishna 685717a9a21cf066d60d1e473096e675 >}}


Well, that is it folks. We have put together two concepts, readbility and performance to create something which is the best of both worlds.
