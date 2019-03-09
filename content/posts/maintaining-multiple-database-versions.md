+++
title = "maintaining multiple database versions"
type = "posts"
date = "2019-03-09T14:04:15+05:30"
description = "How to live with multiple database versions in your local machine"
+++


## Introduction: Rainbows and Unicorns.

As a web dev,  I interact with a lot of tools that help me convert coffee (these days I have switched over to tea) to code, and for the most part, different versions of the same tools in my toolbelt co-exist as they have their version-managers. The real power of the version managers become apparent whenever I move from one project to another, `The Next Amazon` project is using Ruby 2.4 while `The Ubercool-Custom-T-Shirt App` is using 2.6. 'Oh well, I have rbenv.'  

I felt right about my dev machine setup and thanked OSS giants for letting me stand on their shoulders and use these excellent version managers until I moved to `Already Existing Logistics Software.`  This application required Postgresql 9.5, and I had 9.6. 

Why is this an issue? you mock me until I tell you that our logistics app uses structure.sql instead of schema.rb which means I need to run the exact version of PostgreSQL that everyone in my team uses, down to the patch version. 

## PostgreSQL and the missing Version Managers. 

The fear of desecrating my local machine by installing multiple versions of PostgreSQL gave me many a sleepless night, I mean should I do it or not? Is there a better alternative? I found not one, but two that would help me make my Fitbit happy again (because sleep) and I went with the simplest of the two. 

## pg_ctlcluster: A fix for the brave and true. 

pg_ctlcluster is a wrapper for pg_ctl utility used to control the PostgreSQL Postmaster server. Every time a client application accesses a database, it connects (over a network or locally) to a running Postmaster. (read more about postmaster here). 

Once we have pg_ctlcluster in your local machine,
- Do you have it already? `which pg_ctlcluster` 
- Where does it come from?  `dpkg -S $(which pg_ctlclusters)`  )

We can check the statuses of all the PostgreSQL clusters in your local machine by:

```bash
romeo@ubuntu:~$ pg_lsclusters
Ver Cluster Port Status Owner    Data directory          Log file
9.4 main     5432 online postgres /var/lib/postgresql/9.4 /var/log/postgresql/postgresql-9.4-main.log
9.6  main    5433 online postgres /var/lib/postgresql/9.6/main /var/log/postgresql/postgresql-9.6-main.log

# Stopping a cluster:
romeo@ubuntu:~$ pg_ctlcluster 9.6 main stop

# Removing a cluster:
romeo@ubuntu:~$ pg_dropcluster --stop 9.6 main

# Creating a new cluster: 
romeo@ubuntu:~$ sudo pg_createcluster --locale en_US.UTF-8 --start 9.6 main

```

All you need to do now is edit your database config file (and that is config/database.yml for us Rails developers) and update the port. But aint that a lot of commands I need to learn?


## Elephant, in a jar.

The second option I had was to use a docker image for PostgreSQL. Assuming we have docker daemon running on the local machine, we need a PostgreSQL docker image. lets go ahead and use the official docker image which is available from {{< hyperlink url="https://hub.docker.com/_/postgres" text="dockerhub" >}}.


```bash
 docker run -d -p 5432:5432 --restart always 
--name postgres -e POSTGRES_PASSWORD=postgres postgres:9.6
```

--detach, -d      Run container in background and print container ID
--restart,  n       {{< hyperlink url="https://docs.docker.com/config/containers/start-containers-automatically/#use-a-restart-policy" text="Restart policy to apply when a container exits" >}}

```bash
romeo@ubuntu:~$ docker ps -a
CONTAINER ID        IMAGE                                 COMMAND                  CREATED             STATUS                      PORTS                    NAMES
41b215a3153a        postgres                              "docker-entrypoint.s…"   3 days ago          Up 26 hours                 0.0.0.0:5432->5432/tcp   postgres
```

As we can see, we have a PostgreSQL server running on port 5432 on localhost, now we can update the database.yml file like the following:

```yaml
default: &default
  ...
  url: postgresql://localhost/

development:
  <<: *default
  database: database_name
```

That is it. With just the `url`, Rails would be able to connect to the dockerized PostgreSQL.

## Closing Thoughts. 

In the end I ended up using the docker image due to the following reasons:  
 * It's far more comfortable to use (I use it already, yes, I am biased) 
 * I need not learn commands which are not useful in any other context
