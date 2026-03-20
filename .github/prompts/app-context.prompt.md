---
name: app context
description: use it to know the general prupose of the app, its main features, and the current development phase. It will help you understand the context of user requests and generate more relevant responses.
---




This platform is a **time-centric SaaS system** designed to model, track, organize, and monetize human time and activities.
The core abstraction is **time-bound activities**, which can represent work sessions, tasks, habits, appointments, or events.
The system unifies **time tracking, task management, habit tracking, scheduling, and availability coordination** into a single structured data model, allowing users and organizations to understand, plan, optimize, and commercialize their time.

The platform exposes both **structured interfaces (UI/API)** and a **natural-language interface (AI agent)** capable of translating user intent into operations such as creating tasks, logging time, scheduling events, or generating availability polls.

The long-term objective is to provide a **unified temporal workspace** where personal productivity, team coordination, and client interactions are managed through a shared timeline and activity graph.

---

# Product Phases

## Phase 1 — Time Tracking (Core Temporal Layer) (current phase)

Focus: **recording and analyzing time usage**

Capabilities:

* Work session tracking (start/stop timers)
* Manual time entry
* Daily / weekly / monthly reports
* Legal work-hour compliance
* Activity categorization
* Time aggregation by project / task / user
* Personal productivity analytics

Goal:

Establish a **reliable temporal data foundation**.

---

## Phase 2 — Task & Project Management

Focus: **planning and structuring work**

Capabilities:

* Projects
* Hierarchical tasks (infinite subtasks)
* Task estimation vs real time
* Progress tracking
* Status workflows
* Dependencies
* Future support for **Gantt diagrams**
* Integration between tasks and time entries

Goal:

Transform time tracking into **work organization and planning**.

---

## Phase 3 — Scheduling & Time Monetization (C2B)

Focus: **selling and allocating time**

Capabilities:

* Calendar availability management
* Client appointment booking
* Service definitions
* Public booking links
* Calendar conflict management
* Automatic time entry generation
* Business workflows for SMBs

Goal:

Allow professionals and businesses to **offer and monetize time slots**.

---

# Additional Fronts / Modules Proposed

## Habit Tracking

Structured habit system with **custom dynamic metrics**.

Examples:

Gym habit:

* weight
* biceps weight
* triceps weight
* reps

Smoking reduction:

* cigarettes per day
* craving level
* money saved

Capabilities:

* customizable fields per habit
* daily / weekly / monthly progression
* statistical visualizations
* personal improvement analytics

---

## AI Interaction Layer

Natural-language interface integrated with the platform.

Capabilities:

* create tasks
* log time
* schedule appointments
* query analytics
* manage habits
* plan events

Example commands:

```
create a meeting tomorrow at 10
log 2 hours on backend api
schedule a gym session today
```

Goal:

Provide an **intent-driven interface** to the system.

---

## Messaging & Notifications

Automated communication with users and clients.

Channels:

* WhatsApp
* SMS
* Email

Capabilities:

* appointment reminders
* confirmations
* follow-ups
* event notifications

---

## Configurable Scheduling Bot

Conversational booking interface for businesses.

Example:

Client message:

```
I want an appointment tomorrow
```

Bot:

* checks availability
* proposes slots
* confirms booking

Deployment channels:

* WhatsApp
* web chat
* social platforms

---

## Availability Coordination

Group scheduling and consensus planning.

Capabilities:

* event invitation links
* participants indicate available time slots
* automatic optimal time detection
* group coordination

Use cases:

* meetings
* group events
* social planning
* team coordination

---

## Event Participation Links

Capability to generate shareable links for:

* events
* meetings
* availability polls
* appointment booking

External participants can interact **without requiring accounts**.

---

# Conceptual System Domains

The platform ultimately integrates four domains:

```
time tracking
task organization
personal improvement
client scheduling
```

All built around a unified concept:

**time-based activities within a shared temporal graph.**
