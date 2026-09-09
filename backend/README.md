# Harbor

## Overview

Harbor helps teams manage their projects, tasks, and collaborative workspaces in one unified platform. It takes complex organizational structures and produces a streamlined environment where members can track kanban boards, share attachments, and communicate in real time. There is no complicated setup involved, just straightforward functionality that keeps organizations aligned and productive.

## System Architecture

```mermaid
flowchart LR
  Client["Web Client"]
  Server["Fastify API Server"]
  Database[("PostgreSQL")]
  Storage["Cloudflare R2"]
  Realtime["Ably Realtime"]
  Email["SendByte Service"]

  Client --> Server
  Server --> Database
  Server --> Storage
  Server --> Realtime
  Server --> Email

  style Client fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
  style Server fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
  style Database fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
  style Storage fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff
  style Realtime fill:#022c22,stroke:#10b981,stroke-width:2px,color:#fff
  style Email fill:#4c0519,stroke:#ef4444,stroke-width:2px,color:#fff
```

## Features

*   **Workspace Management**: Administrators can create organizations, invite members via email, and assign strict role-based access controls.
*   **Kanban Task Tracking**: Teams can organize work into projects, boards, and columns with support for subtasks and customizable labels.
*   **Secure File Attachments**: Users can upload files directly to tasks. The server enforces strict validation using magic byte detection to ensure uploaded files match their claimed extensions.

```mermaid
sequenceDiagram
  actor User
  participant API as "Fastify Server"
  participant Storage as "Cloudflare R2"
  participant DB as "PostgreSQL Database"

  User->>API: POST /attachments/upload
  API->>API: Validate magic bytes and size
  API->>Storage: Stream file to bucket
  Storage->>API: Return success
  API->>DB: Create attachment record
  DB->>API: Return metadata
  API->>User: Return attachment details
```

*   **Real-time Collaboration**: The system broadcasts comments, mentions, and task updates in real time using server-sent events, keeping all team members perfectly synchronized.

```mermaid
sequenceDiagram
  actor Inviter
  participant API as "Fastify Server"
  participant Email as "SendByte Service"
  actor Invitee

  Inviter->>API: POST /api/workspaces/:id/invites
  API->>API: Generate secure token
  API->>Email: Send invitation template
  Email->>Invitee: Deliver email
  Invitee->>API: POST /api/workspaces/invites/accept
  API->>API: Consume token and add member
  API->>Invitee: Grant workspace access
```

## Installation

Clone the Repository:

```bash
git clone https://github.com/Deelolade/harbor.git
```

Install the dependencies:

```bash
npm install
```

Generate the database client:

```bash
npm run build
```

Start the development server:

```bash
npm run dev
```

## Usage

Once the server is running, the application will listen for incoming HTTP requests and WebSocket connections on the configured port. By default, the application runs on port 8800. 

To verify the server is operational, developers can issue a standard health check request using curl:

```bash
curl http://localhost:8800/
```

This returns a simple text confirmation that the Fastify instance is active and ready to process incoming traffic.

## Technologies Used

| Technology | Description |
| :--- | :--- |
| TypeScript | Type-safe programming language |
| Node.js | JavaScript runtime environment |
| Fastify | High-performance web framework |
| Prisma | Type-safe database ORM |
| PostgreSQL | Relational database management |
| Better Auth | Authentication and session management |
| Ably | Real-time messaging and SSE |
| Cloudflare R2 | S3-compatible object storage |
| SendByte | Transactional email delivery |
| Zod | Schema validation |

## Environment Variables

The server requires several environment variables to function correctly. 

```env
NODE_ENV="development"
PORT="8800"
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:8800"
COOKIE_SECRET="super-secret-cookie-key"
DATABASE_URL="postgresql://user:password@localhost:5432/harbor"
SENDBYTE_SECRET="sendbyte-api-key"
EMAIL_FROM="Harbor <noreply@example.com>"
ABLY_API_KEY="ably-api-key"
BETTER_AUTH_URL="http://localhost:8800"
GOOGLE_CLIENT_ID="google-id"
GOOGLE_CLIENT_SECRET="google-secret"
GITHUB_CLIENT_ID="github-id"
GITHUB_CLIENT_SECRET="github-secret"
R2_ACCOUNT_ID="cloudflare-account-id"
R2_ACCESS_KEY_ID="r2-access-key"
R2_SECRET_ACCESS_KEY="r2-secret-key"
R2_BUCKET_NAME="harbor-attachments"
R2_PUBLIC_URL="https://pub-r2-url.com"
```

## API Documentation

### System & Realtime Endpoints

#### GET /
**Description**: Server health check route.
**Request**: None
**Response**: 
```text
Hello new fastify project sample
```

#### GET /api/ably/token
**Description**: Generates an Ably authentication token for client-side realtime connections.
**Request**: None
**Response**:
```json
{
  "token": "ably-auth-token-string"
}
```

#### GET /api/ably/sse
**Description**: Proxies a Server-Sent Events stream from Ably. Requires authentication.
**Request**: 
Query parameter: `channel` (string)
**Response**: Event stream format (text/event-stream)

### Authentication Endpoints (Better Auth)

#### ALL /api/auth/*
**Description**: Better Auth handles standard authentication routes under this prefix, including login, signup, and OAuth callbacks. 
**Request**: Dependent on specific Better Auth implementation.
**Response**: Session cookies and profile payloads.

### Account Management Endpoints

#### PUT /api/account/profile
**Description**: Updates the current user's profile details.
**Request**:
```json
{
  "name": "Jane Doe",
  "image": "https://example.com/avatar.png"
}
```
**Response**:
```json
{
  "id": "cuid123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "image": "https://example.com/avatar.png"
}
```

#### POST /api/account/change-email
**Description**: Initiates an email change process by sending a verification code to the new address.
**Request**:
```json
{
  "newEmail": "new-address@example.com"
}
```
**Response**:
```json
{
  "message": "Confirmation email sent."
}
```

#### POST /api/account/confirm-email-change
**Description**: Finalizes the email change process using the secure token.
**Request**:
```json
{
  "token": "secure-token-string"
}
```
**Response**:
```json
{
  "message": "Email changed successfully."
}
```

#### POST /api/account/change-password
**Description**: Updates a user password.
**Request**:
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-secure-password"
}
```
**Response**:
```json
{
  "message": "Password changed successfully."
}
```

#### POST /api/account/verify-email
**Description**: Verifies a new account's email address.
**Request**:
```json
{
  "token": "verification-token"
}
```
**Response**:
```json
{}
```

#### POST /api/account/resend-verification
**Description**: Resends the initial account email verification link.
**Request**:
```json
{
  "email": "user@example.com"
}
```
**Response**:
```json
{}
```

#### POST /api/account/complete-signup
**Description**: Completes the user registration process by provisioning a default personal workspace.
**Request**:
```json
{
  "userId": "cuid123",
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```
**Response**:
```json
{
  "ok": true
}
```

### Workspace Endpoints

#### POST /api/workspaces
**Description**: Creates a new workspace and sets the creator as the Owner.
**Request**:
```json
{
  "name": "Engineering Team"
}
```
**Response**:
```json
{
  "id": "workspace123",
  "name": "Engineering Team",
  "ownerId": "user123",
  "members": []
}
```

#### GET /api/workspaces
**Description**: Lists all workspaces the authenticated user belongs to.
**Request**: None
**Response**:
```json
[
  {
    "id": "workspace123",
    "name": "Engineering Team",
    "owner": { "id": "user123", "name": "Jane Doe" }
  }
]
```

#### GET /api/workspaces/:id
**Description**: Retrieves comprehensive details for a single workspace, including all members.
**Request**: None
**Response**:
```json
{
  "id": "workspace123",
  "name": "Engineering Team",
  "members": []
}
```

#### GET /api/workspaces/:id/name
**Description**: Lightweight endpoint fetching only the workspace name, useful for UI breadcrumbs.
**Request**: None
**Response**:
```json
{
  "name": "Engineering Team"
}
```

#### PUT /api/workspaces/:id
**Description**: Updates workspace configuration. Requires Admin or Owner roles.
**Request**:
```json
{
  "name": "Updated Team Name",
  "image": "https://example.com/logo.png"
}
```
**Response**:
```json
{
  "id": "workspace123",
  "name": "Updated Team Name"
}
```

#### DELETE /api/workspaces/:id
**Description**: Deletes a workspace permanently. Requires Owner role.
**Request**: None
**Response**: Returns 204 No Content

### Workspace Member Endpoints

#### GET /api/workspaces/:id/members
**Description**: Lists all users who have access to the specified workspace.
**Request**: None
**Response**:
```json
[
  {
    "id": "member123",
    "role": "ADMIN",
    "user": { "name": "Jane Doe" }
  }
]
```

#### POST /api/workspaces/:id/members
**Description**: Directly adds an existing user to a workspace.
**Request**:
```json
{
  "userId": "user456",
  "role": "MEMBER"
}
```
**Response**:
```json
{
  "id": "member123",
  "workspaceId": "ws123",
  "role": "MEMBER"
}
```

#### PUT /api/workspaces/:id/members/:userId
**Description**: Modifies the permission role of a workspace member.
**Request**:
```json
{
  "role": "ADMIN"
}
```
**Response**:
```json
{
  "id": "member123",
  "role": "ADMIN"
}
```

#### DELETE /api/workspaces/:id/members/:userId
**Description**: Removes a user from a workspace.
**Request**: None
**Response**: Returns 204 No Content

#### POST /api/workspaces/:id/invites
**Description**: Issues an email invitation to join the workspace.
**Request**:
```json
{
  "email": "newhire@example.com"
}
```
**Response**:
```json
{
  "message": "Invitation sent."
}
```

#### GET /api/workspaces/invites/:token
**Description**: Public endpoint to validate an invite token and retrieve workspace metadata.
**Request**: None
**Response**:
```json
{
  "workspaceName": "Engineering Team",
  "inviterName": "Jane Doe",
  "email": "newhire@example.com",
  "expiresAt": "2024-12-31T00:00:00Z"
}
```

#### POST /api/workspaces/invites/accept
**Description**: Consumes an invite token and grants workspace access to the authenticated user.
**Request**:
```json
{
  "token": "secure-token-string"
}
```
**Response**:
```json
{
  "workspaceId": "workspace123"
}
```

### Project Endpoints

#### POST /api/workspaces/:id/projects
**Description**: Provisions a new project within a workspace.
**Request**:
```json
{
  "name": "Q3 Marketing Launch",
  "description": "Planning for Q3",
  "visibility": "WORKSPACE"
}
```
**Response**:
```json
{
  "id": "proj123",
  "name": "Q3 Marketing Launch",
  "workspaceId": "ws123"
}
```

#### GET /api/workspaces/:id/projects
**Description**: Lists all projects inside a specific workspace.
**Request**: None
**Response**:
```json
[
  {
    "id": "proj123",
    "name": "Q3 Marketing Launch"
  }
]
```

#### GET /api/projects/:id
**Description**: Retrieves comprehensive metadata for a specific project.
**Request**: None
**Response**:
```json
{
  "id": "proj123",
  "name": "Q3 Marketing Launch",
  "workspace": { "id": "ws123", "name": "Marketing" }
}
```

#### PUT /api/projects/:id
**Description**: Updates metadata for a project.
**Request**:
```json
{
  "description": "Updated project description"
}
```
**Response**:
```json
{
  "id": "proj123",
  "description": "Updated project description"
}
```

#### DELETE /api/projects/:id
**Description**: Completely removes a project.
**Request**: None
**Response**: Returns 204 No Content

### Board Endpoints

#### POST /api/projects/:projectId/boards
**Description**: Creates a new kanban board within a project, automatically populating default columns.
**Request**:
```json
{
  "name": "Sprint 1"
}
```
**Response**:
```json
{
  "id": "board123",
  "name": "Sprint 1",
  "columns": []
}
```

#### GET /api/projects/:projectId/boards
**Description**: Lists all boards inside a project, including column and task hierarchy arrays.
**Request**: None
**Response**:
```json
[
  {
    "id": "board123",
    "name": "Sprint 1",
    "columns": []
  }
]
```

#### PUT /api/boards/:boardId
**Description**: Edits a board's configuration.
**Request**:
```json
{
  "name": "Updated Sprint Name",
  "archived": true
}
```
**Response**:
```json
{
  "id": "board123",
  "name": "Updated Sprint Name"
}
```

#### PUT /api/projects/:id/boards/reorder
**Description**: Bulk reorders boards within a project context.
**Request**:
```json
{
  "boardIds": ["board2", "board1", "board3"]
}
```
**Response**:
```json
{}
```

#### DELETE /api/boards/:boardId
**Description**: Deletes a kanban board.
**Request**: None
**Response**: Returns 204 No Content

### Column Endpoints

#### POST /api/boards/:boardId/columns
**Description**: Appends a new column to a board layout.
**Request**:
```json
{
  "name": "In Review",
  "color": "#ff0000"
}
```
**Response**:
```json
{
  "id": "col123",
  "name": "In Review"
}
```

#### PUT /api/columns/:columnId
**Description**: Edits column attributes.
**Request**:
```json
{
  "name": "Ready for QA"
}
```
**Response**:
```json
{
  "id": "col123",
  "name": "Ready for QA"
}
```

#### PUT /api/boards/:id/columns/reorder
**Description**: Applies a new ordering sequence to columns in a board.
**Request**:
```json
{
  "columnIds": ["col2", "col3", "col1"]
}
```
**Response**:
```json
{}
```

#### DELETE /api/columns/:columnId
**Description**: Removes a column from a board.
**Request**: None
**Response**: Returns 204 No Content

### Task Endpoints

#### POST /api/columns/:columnId/tasks
**Description**: Provisions a new task inside a specific column.
**Request**:
```json
{
  "title": "Fix login bug",
  "description": "Users cannot log in via SSO.",
  "priority": "HIGH",
  "assigneeId": "user123"
}
```
**Response**:
```json
{
  "id": "task123",
  "title": "Fix login bug",
  "priority": "HIGH"
}
```

#### GET /api/tasks/:id
**Description**: Retrieves a deep hierarchy of a task including subtasks, attachments, comments, and label bindings.
**Request**: None
**Response**:
```json
{
  "id": "task123",
  "title": "Fix login bug",
  "comments": [],
  "attachments": [],
  "subtasks": []
}
```

#### PUT /api/tasks/:id
**Description**: Updates task payload attributes like descriptions or priorities.
**Request**:
```json
{
  "priority": "URGENT",
  "dueDate": "2024-10-10T12:00:00Z"
}
```
**Response**:
```json
{
  "id": "task123",
  "priority": "URGENT"
}
```

#### PUT /api/tasks/:id/move
**Description**: Migrates a task across columns and updates its ordering index.
**Request**:
```json
{
  "columnId": "col456",
  "order": 1
}
```
**Response**:
```json
{}
```

#### DELETE /api/tasks/:id
**Description**: Destroys a task completely.
**Request**: None
**Response**: Returns 204 No Content

### Subtask Endpoints

#### POST /api/tasks/:taskId/subtasks
**Description**: Appends a child subtask checklist item to a task parent.
**Request**:
```json
{
  "title": "Write unit tests"
}
```
**Response**:
```json
{
  "id": "sub123",
  "title": "Write unit tests",
  "completed": false
}
```

#### PUT /api/subtasks/:id
**Description**: Edits a subtask or toggles its completion status.
**Request**:
```json
{
  "completed": true
}
```
**Response**:
```json
{
  "id": "sub123",
  "completed": true
}
```

#### DELETE /api/subtasks/:id
**Description**: Removes a subtask checklist item.
**Request**: None
**Response**: Returns 204 No Content

### Label Endpoints

#### POST /api/tasks/:taskId/labels
**Description**: Creates and attaches a colorful label to a task.
**Request**:
```json
{
  "name": "Bug",
  "color": "#ef4444"
}
```
**Response**:
```json
{
  "id": "lbl123",
  "name": "Bug",
  "color": "#ef4444"
}
```

#### DELETE /api/labels/:labelId
**Description**: Drops a label from a task instance.
**Request**: None
**Response**: Returns 204 No Content

### Comment Endpoints

#### GET /api/tasks/:taskId/comments
**Description**: Lists timeline discussion comments for a particular task.
**Request**: None
**Response**:
```json
[
  {
    "id": "cmt123",
    "content": "Looking into this now.",
    "author": { "name": "Jane Doe" }
  }
]
```

#### POST /api/tasks/:taskId/comments
**Description**: Publishes a new comment. Automatically triggers mentioned notifications and realtime broadcoasts.
**Request**:
```json
{
  "content": "I fixed this in the latest PR @jane"
}
```
**Response**:
```json
{
  "id": "cmt123",
  "content": "I fixed this in the latest PR @jane"
}
```

#### PUT /api/comments/:id
**Description**: Modifies the text payload of an existing comment.
**Request**:
```json
{
  "content": "Updated comment content"
}
```
**Response**:
```json
{
  "id": "cmt123",
  "content": "Updated comment content"
}
```

#### DELETE /api/comments/:id
**Description**: Erases a comment from the task timeline.
**Request**: None
**Response**: Returns 204 No Content

### Attachment Endpoints

#### GET /api/tasks/:taskId/attachments
**Description**: Fetches all files tied to a task.
**Request**: None
**Response**:
```json
[
  {
    "id": "att123",
    "name": "screenshot.png",
    "url": "https://pub-r2-url.com/attachments/abc.png"
  }
]
```

#### GET /api/projects/:projectId/attachments
**Description**: Aggregates all uploaded files across every task within a project.
**Request**: None
**Response**:
```json
[
  {
    "id": "att123",
    "name": "screenshot.png",
    "task": { "title": "Fix login bug" }
  }
]
```

#### POST /api/tasks/:taskId/attachments
**Description**: Manually registers an attachment record (typically used when uploads bypass standard multipart flows).
**Request**:
```json
{
  "name": "design.pdf",
  "url": "https://pub-r2-url.com/attachments/xyz.pdf"
}
```
**Response**:
```json
{
  "id": "att124",
  "name": "design.pdf"
}
```

#### POST /attachments/upload
**Description**: Main multipart upload entrypoint. Handles binary validation (magic byte matching) and streams directly to Cloudflare R2 bucket.
**Request**: Multipart form data with file.
Query parameter: `taskId` (string)
**Response**:
```json
{
  "message": "Attachment uploaded successfully",
  "attachment": {
    "id": "att125",
    "name": "script.js",
    "url": "https://pub-r2-url.com/attachments/qwe.js"
  }
}
```

#### PATCH /attachments/:id
**Description**: Renames an attachment object in the database and creates a file copy internally within R2.
**Request**:
```json
{
  "name": "new_script_name.js"
}
```
**Response**:
```json
{
  "message": "Attachment renamed",
  "attachment": { "name": "new_script_name.js" }
}
```

#### DELETE /attachments/:id
**Description**: Removes an attachment database entry and dispatches a deletion command to the R2 bucket.
**Request**: None
**Response**: Returns 204 No Content

### Search & Activity Endpoints

#### GET /api/workspaces/:id/search
**Description**: Performs a global text search across projects, tasks, workspace members, and task labels.
**Request**:
Query parameter: `q` (string search term)
**Response**:
```json
{
  "tasks": [],
  "projects": [],
  "members": [],
  "labels": []
}
```

#### GET /api/workspaces/:id/activity
**Description**: Returns an ordered audit trail of actions taken inside the workspace.
**Request**: None
**Response**:
```json
[
  {
    "id": "act123",
    "type": "created_task",
    "actor": { "name": "Jane Doe" }
  }
]
```

#### GET /api/workspaces/:id/activity/unseen
**Description**: Retrieves the raw count of audit trail events the user has not viewed yet.
**Request**: None
**Response**:
```json
{
  "unseen": 5
}
```

#### POST /api/workspaces/:id/activity/seen
**Description**: Updates the cursor for the user's last viewed activity timestamp.
**Request**: None
**Response**:
```json
{
  "ok": true
}
```

### Notification Endpoints

#### GET /api/notifications
**Description**: Pulls a list of direct notifications for the logged-in user.
**Request**: None
**Response**:
```json
[
  {
    "id": "notif123",
    "title": "Jane assigned you a task",
    "read": false
  }
]
```

#### GET /api/notifications/unread-count
**Description**: Retrieves the exact number of unread notifications.
**Request**: None
**Response**:
```json
{
  "count": 2
}
```

#### POST /api/notifications/:id/read
**Description**: Marks a specific notification as resolved and read.
**Request**: None
**Response**:
```json
{
  "ok": true
}
```

#### POST /api/notifications/read-all
**Description**: Batches all current notifications for a user into a read state.
**Request**: None
**Response**:
```json
{
  "ok": true
}
```

## Contributing

Contributions make the developer community an incredible place to learn, inspire, and create. Any modifications or suggestions to improve this backend service are highly appreciated. Teams are encouraged to fork this repository, create dedicated feature branches, and submit well-documented pull requests.

## License

This project is released under the [ISC License](./package.json).

## Author

*   LinkedIn: [https://linkedin.com/in/deelolade](https://linkedin.com/in/deelolade)
*   X: [https://x.com/deelolade](https://x.com/deelolade)

---
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)
[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://dokugen.samueltuoyo.com)