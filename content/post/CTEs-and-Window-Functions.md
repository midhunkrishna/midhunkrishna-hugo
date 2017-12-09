+++
date = "2017-12-09T17:43:52+05:30"
title = "CTEs and Window Functions"
Categories = []
Tags = []
Description = ""

+++

I am a big fan of code readability, but being a fan and expecting the code I write to be readable are two different things. Readable code is easier to understand and much more straightforward to grasp. One significant difference I find while comparing readable and unreadable code, apart from the obvious, is how many different variables I have to hold in my head at a time while I try to grapple my head around it. If this task is simple, I believe that this is not because of some random act of brilliance but due to careful code construction.


A particular example is SQL. The more it does it usually gets unreadable, especially if I write it with an ‘as long as it works’ attitude and a good way to make it readable is using the above mentioned CTEs.


CTEs helps achieve this by its ability to separate data into independent logical modules according to the context of the query.


    WITH popular_posts AS
    (
           SELECT id,
                  title,
                  body
           FROM   posts
           WHERE  posts.upvote > 5 )
    SELECT *
    FROM   popular_posts
    WHERE  popular_posts.created_at >= dateadd(day, x, getdate());



Here, we have clear classification for any post with upvote count six or above, thereby, logically abstracting away this(classification) into a variable called popular posts.
