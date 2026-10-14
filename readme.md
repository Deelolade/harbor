# Harbor

## Overview

Harbor helps teams coordinate projects, organize tasks, and collaborate in one unified space. It takes the friction out of task planning by turning messy workflows into straightforward kanban boards with live updates, file attachments, and direct team discussions. Teams get everything they need to ship work without wrestling with bloated setups.

## Features

* **Workspaces and Role Control**: Create dedicated workspaces, send email invites, and manage access with owner, admin, and member permission levels.
* **Kanban Boards and Custom Columns**: Organize project workflows into customizable columns with drag-and-drop task movement across stages.
* **Task Checklists and Labels**: Break complex work into subtasks, set priorities from Low to Urgent, assign due dates, and apply colored tags.
* **Task Discussions and Mentions**: Post comments on tasks with automatic user mention alerts to keep discussions attached directly to the work.
* **Verified File Attachments**: Upload documents and images to tasks with server-side magic byte inspection to make sure file contents match their extensions.
* **Live Activity Streams**: Broadcast task creation, column transfers, and member updates across the workspace in real time.
* **Command Palette and Quick Search**: Jump between projects, tasks, workspace settings, and search results using keyboard shortcuts.

## Usage

### Workspace Navigation and Project Creation

Once logged in, you can create a workspace or pick an existing one from the workspace directory. Inside a workspace, you can manage projects from the home dashboard.

To create a new project:

1. Click **New project** from your workspace home view.
2. Enter the project title, an optional description, and select the project visibility (Private, Workspace, or Public).
3. Open the project to view its kanban boards.

### Managing Tasks on Kanban Boards

Each project comes with default kanban columns (To Do, In Progress, and Done). You can create custom columns anytime by clicking **Add column**.

To create and manage tasks:

1. Click **Add task** inside any column or press the keyboard shortcut `C`.
2. Provide a title, choose an assignee from the workspace members list, pick a priority level, and set an optional due date.
3. Open any task card to write descriptions, check off subtasks, or post comments.
4. Drag task cards between columns to update their progress. When you drop a card into the Done column, Harbor automatically notifies the assignee.

### Uploading Attachments

Attach design assets, documents, or screenshots directly inside task cards:

1. Click on a task to open the modal view.
2. In the **Attachments** area, click the plus icon and choose a file from your computer.
3. Harbor verifies the file's binary signature, uploads it to storage, and links it to the card.
4. Click an existing attachment to rename it or open it in a new browser tab.

### Keyboard Shortcuts and Command Palette

You can navigate Harbor entirely with your keyboard:

* Press `Cmd + K` (macOS) or `Ctrl + K` (Windows/Linux) to toggle the global command palette and search across all tasks, projects, and members.
* Press `/` while viewing a board to jump straight to the search filter.
* Press `G` followed by `H` to return to the workspace home view.
* Press `G` followed by `P` to view all projects.
* Press `G` followed by `M` to view workspace members.

## Technologies Used

| Technology | Category | Description |
| :--- | :--- | :--- |
| [React](https://react.dev/) | Frontend | Component-driven user interface library |
| [TypeScript](https://www.typescriptlang.org/) | Language | Static typing across client and server |
| [Vite](https://vitejs.dev/) | Frontend Tooling | Frontend development server and bundler |
| [Tailwind CSS](https://tailwindcss.com/) | Styling | Utility-first CSS styling framework |
| [TanStack Query](https://tanstack.com/query/latest) | State Management | Asynchronous server-state caching and synchronization |
| [dnd-kit](https://dndkit.com/) | Interaction | Drag-and-drop toolkit for kanban column interactions |
| [Fastify](https://fastify.dev/) | Backend Framework | High-throughput web framework for Node.js |
| [Prisma](https://www.prisma.io/) | Database ORM | Schema management and database query layer |
| [PostgreSQL](https://www.postgresql.org/) | Database | Primary relational data store |
| [Better Auth](https://www.better-auth.com/) | Authentication | Session and credential authentication handling |
| [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) | Object Storage | S3-compatible file storage for uploaded attachments |
| [Ably](https://ably.com/) | Realtime | Realtime messaging and event stream delivery |
| [SendByte](https://sendbyte.com/) | Email Service | Transactional email delivery for invitations and verifications |
| [Zod](https://zod.dev/) | Validation | Runtime type validation for API payloads and forms |

## Author Info

* LinkedIn: https://linkedin.com/in/deelolade
* X: https://x.com/deelolade

---

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://dokugen.samueltuoyo.com)