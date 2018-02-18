+++
date = "2018-02-18T15:31:25+05:30"
title = "ctes and window functions"
description = "hallelujah!!"
type = "posts"
+++

I am a big fan of code readability, but being a fan and expecting the code I write to be readable are two different things. Readable code is easier to understand and much more straightforward to grasp. One significant difference I find while comparing readable and unreadable code, apart from the obvious, is how many different variables I have to hold in my head at a time while I try to grapple my head around it. If this task is simple, I believe that this is not because of some random act of brilliance but due to careful code construction.

A particular example is SQL. The more it does, the more it gets unreadable, A good way to make it readable is using the above mentioned CTEs.

CTEs helps achieve this by its ability to separate data into independent logical entities according to the context of the query.

{{< gist midhunkrishna 6c863c9b7125e89409395556c70ce790 >}}

Here, we have clear classification for any post with upvote count six or above, thereby, logically abstracting away this(classification) into a variable called popular posts.
