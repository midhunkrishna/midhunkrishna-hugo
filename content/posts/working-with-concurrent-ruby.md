+++
title = "working with concurrent ruby"
type = "posts"
date = "2017-09-21T14:21:14+05:30"
description = "Using concurrent ruby for performance and happiness"
+++


Most of us have worked on legacy/inherited code bases and sometimes we are assigned that exhilarating task of hunting down that performance issue which is causing worker threads to be killed, users to get pissed off and the support team to repent for their past sins.

## The dreaded shipment uploader

Being a TMS (Transportation Management System), our system dealt with Deliveries, and Shipments. The shipment uploader endpoint allowed the shipping companies to upload a csv which imported these shipments, grouped them into deliveries and calculated the projected cost of shipping these from their origin to destination and showed these values on the uploader UI itself.

We had a large number of users from multiple companies using that endpoint, so changing the UI to support an asynchronous upload ended up not being an option at all.

I got a copy of one of the files from S3 and started an upload, it took ~ 90 seconds for the upload to go through, used benchmark module to figure out what were the hot zones of that controller action and finally a pattern emerged. Time taken by the uploader was proportionate to the number of shipments assigned to a delivery.

{{< gist midhunkrishna f5de6c59f6bc198abc3126825770f68a >}}

It seemed, validating routes and checking the packaging of cargos on each shipment took time. If I can run these operations parallelly, I could, in theory, cut down some time.

## Threads and Concurrent Ruby

It is often intimidating even to entertain the idea of working with threads. They can bring in complexity, unpredictable behaviors and the later arises due to a lack of thread-safe code. Ruby is a language of mutable references, it is often difficult to write 100% thread-safe code, hence I needed something which offered primitives and patterns that would guarantee thread safety.

I checked {{<hyperlink text="Concurrent Ruby" url="https://github.com/ruby-concurrency/concurrent-ruby" >}} and {{<hyperlink text="Celluloid" url="https://github.com/celluloid/celluloid" >}} and decided to go with Concurrent Ruby since the application gemset had it (via Sidekiq)


I decided to refactor this using {{< hyperlink url="https://github.com/ruby-concurrency/concurrent-ruby/blob/master/doc/future.md" text="Concurrent Ruby Futures." >}}. In general, using futures, one can perform an action atomically, in an asynchronous fashion, and then come back and collect the result of the action at a later time, and while collecting the result, the main thread blocks until the result of the action is available.

{{< gist midhunkrishna b38b6bacfe377e8a8ffd5fc3812af2ac >}}

This seemed to fix the performance problem we were facing. I was able to get the uploader to finish under 20 seconds. Little did I know that this would blow up in my face 10 minutes later.

## Concurrent Ruby Futures and Exceptions

Usually, when an exception occurs, in the main thread, the interpreter stops and gathers the exception data and then it exists with the exception and the gathered data. In the case of Ruby Threads, when calling Thread#join, the exception that occured in the thread are processed. As an alternative to this, we can also set {{< hyperlink url="https://ruby-doc.org/core-1.9.3/Thread.html#method-c-abort_on_exception" text="Thread#abort_on_exception" >}} to be true, which will cause all threads to {{< hyperlink url="https://stackoverflow.com/questions/9095316/handling-exceptions-raised-in-a-ruby-thread#answer-9095369" text="exit when an exception is raised in any threads." >}}

In the case of Concurrent Ruby Futures, exceptions are swallowed.


## Promises to the rescue.

{{< hyperlink url="https://github.com/ruby-concurrency/concurrent-ruby/blob/master/doc/promises.in.md" text="Concurrent Ruby Promises " >}} are very much like Futures, but with extra features and one of which is that the promise object keeps track of its state.

{{< gist midhunkrishna ce5356e1375d306f42be376999434b5f >}}

What happens if each of these threads raised their exception? I decided to write a wrapper around Concurrent Ruby Promise. Why a wrapper, you might ask. The primary motivation was that I should be able to tap into all these concurrent goodness without worrying a lot, without scratching my head as to why I did not get a notification when that failed to process.

The final implementation is,

{{< gist midhunkrishna 8f683668da68cd02d97c9937a7676f24>}}

## Summing it up

At the end of the day, I learned a lot from this little excercise. In this particular case, each shipment objects were different and independant and hence all I needed was a good solid solution that would give me a good abstraction which is clean and easy to use at the same time, provided a level of thread safety through concurrent primitives which I could rely on.
