<p align="center">
  <img src="https://github.com/user-attachments/assets/813cdbe5-7016-47fc-ba96-7fb0396a6ebb" width="90%" />
</p>

🟣 AstrixChat

    Real-Time, AI-Assisted Communication Platform

    AstrixChat is a real-time messaging platform designed to remove language barriers and enable seamless global communication using WebSockets and AI-assisted translation.

    The system focuses on low latency, high concurrency, and practical AI integration rather than demo-level features.

🚀 Key Features

💬 Real-Time Messaging with AI-Assisted Translation

Low-latency, bi-directional messaging using WebSockets (Socket.IO)

Messages are translated in real time between users speaking different languages

Each participant views messages in their preferred language

Original message context is preserved internally for accuracy

Optimized event-driven Node.js backend designed for high concurrency


![Real-Time Translation Chat](https://github.com/user-attachments/assets/c0701428-ea95-4cfb-820f-dbbfd1a412df)

![Dual-Language Conversation](https://github.com/user-attachments/assets/bad16de7-8d7c-4c11-9914-5c27816ed4ef)


🎙 Voice-to-Voice Translation

Users can send voice messages

Audio is processed, translated, and delivered back as voice output

Supports audio → text → translation → audio pipelines


[![AstrixChat Demo](https://github.com/user-attachments/assets/813cdbe5-7016-47fc-ba96-7fb0396a6ebb)](https://github.com/user-attachments/assets/12b0f441-9071-4409-85ae-22b15fdec93a)


🤖 Chat with AI (@ash)

AI assistant available directly inside conversations using @ash

Supports:

Language correction

Message rephrasing

Context-aware assistance

Designed to assist users without interrupting real-time flow


![Chat with AI - Prompt](https://github.com/user-attachments/assets/4f751624-38b6-48e7-8027-c023df2db371)

![Chat with AI - Response](https://github.com/user-attachments/assets/f2292666-cccc-451d-bd4a-2f4609db1a45)


⚡ Performance & Scalability

Sustained 1,700+ requests/sec for message ingestion during controlled load testing on a single server

Observed sub-60ms write latency under load

Resolved database bottlenecks using MongoDB compound indexing

Benchmarked using Autocannon with zero errors


![Load Test Results - Login](https://github.com/user-attachments/assets/406c7101-3d9b-4af1-be7d-1eab64e4706d)

![Load Test Results - Message Ingestion](https://github.com/user-attachments/assets/49313158-4410-4d7f-b116-eff27a299416)


🔐 Security Considerations

Secure authentication using bcrypt hashing

Intentional trade-off: security prioritized over raw login throughput

Event-driven design prevents blocking critical real-time flows


🧠 System Design Highlights

Event-driven WebSocket layer for efficient concurrency handling

Clear separation of REST APIs and real-time channels

Optimized data flow to minimize processing latency

AI pipelines designed to mask processing delays using optimistic UI updates


📌 (Architecture diagram coming soon)

🛠 Tech Stack

Frontend

React

Next.js

Tailwind CSS

Backend

Node.js

Express

Socket.IO

Database

MongoDB (Mongoose)

AI & Tooling

LLM-based translation & language processing

Autocannon (Load Testing)

Git & GitHub

📂 Project Structure
astrixchat/
├── client/        # Frontend (React / Next.js)
├── server/        # Backend (Node.js, WebSockets)
└── README.md

🎯 Why AstrixChat?

Most chat apps focus on features.
AstrixChat focuses on reliability, scalability, and meaningful AI integration—making global communication natural and accessible.

📌 Status

Core messaging & AI pipelines implemented

Load tested & benchmarked

Actively evolving architecture

👤 Author

Bishwajit Sharma
Full-Stack Developer focused on real-time systems, performance, and scalable web architecture.
