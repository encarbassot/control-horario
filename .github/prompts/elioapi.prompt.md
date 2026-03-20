---
name: elioapi
description: use this file to know what is elioapi
---

Elioapi its a framework for backend with a framework agnostic adapter for frontend. its prupose its to create a seamless connection between frontend and backend, using a single source of truth, extracting the data structures in the root of the project

```bash
project-root/
├── api/
├── frontend/
├── modules/
├── constants/
```

api is heavy based on express, but skiping most of the boilerplate, or providing premade utilities like auth, mailer, db connection, ...

its still in development, its currentli being build in paralel with this project of time tracking, fieel free to add, modify or remove anything you think its necessary, the main goal is to create a comprehensive framework for backend, its an opensource project to allow anyone to create backends like ecomerce, saas, crms, social networks

the idea is not to hide express at any point, express is great, and everybody knows how to use it

as I said, ElioApi is frontend agnostic, there is an adapter called ElioApiAdapter, but in this project (time tracking) we are also using elio-react-components, another bundle of mine, do not confuse the files, since both have the same naming convetion, starting each file with Elio

The strong part of elioapi is that defines the data structures in a schema, this schema allows to the db be auto updated when changes detected, also allows for objects and fields to be automatically generated for example the crud operations