<div align="center">

  <img src="https://github.com/user-attachments/assets/813cdbe5-7016-47fc-ba96-7fb0396a6ebb" width="200" />

  # 🟣 AstrixChat
  **Real-Time, AI-Assisted Communication Platform**

  <p>
    <a href="#-key-features">Key Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-performance--scalability">Benchmarks</a> •
    <a href="#-system-design">Architecture</a>
  </p>

  ![Status](https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge&logo=git)
  ![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
  ![Node](https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js)

  <br>

  <p align="center">
    <i>
      "Most chat apps focus on features. AstrixChat focuses on reliability, scalability, <br>
      and meaningful AI integration—making global communication natural and accessible."
    </i>
  </p>
</div>

---

## 🚀 Overview

**AstrixChat** is a real-time messaging platform designed to remove language barriers and enable seamless global communication using WebSockets and AI-assisted translation. The system prioritizes **low latency**, **high concurrency**, and **practical AI integration** over demo-level gimmicks.

## 📸 Interface & Features

### 💬 Real-Time AI Translation
> Low-latency, bi-directional messaging where each participant views messages in their preferred language. Context is preserved, and the backend is optimized for high concurrency.

| **Real-Time Translation** | **Dual-Language View** |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/c0701428-ea95-4cfb-820f-dbbfd1a412df" width="100%"> | <img src="https://github.com/user-attachments/assets/bad16de7-8d7c-4c11-9914-5c27816ed4ef" width="100%"> |

### 🤖 Chat with AI (@ash)
> An intelligent assistant available directly inside conversations. Handles language correction, rephrasing, and context-aware assistance without breaking the chat flow.

| **Prompting AI** | **AI Response** |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/4f751624-38b6-48e7-8027-c023df2db371" width="100%"> | <img src="https://github.com/user-attachments/assets/f2292666-cccc-451d-bd4a-2f4609db1a45" width="100%"> |

<br>

## 🎙️ Voice-to-Voice Pipelines
**Audio → Text → Translation → Audio**

Users can send voice messages which are processed, translated, and delivered back as voice output in the recipient's language.

<div align="center">
  <a href="https://github.com/user-attachments/assets/12b0f441-9071-4409-85ae-22b15fdec93a">
    <img src="https://github.com/user-attachments/assets/813cdbe5-7016-47fc-ba96-7fb0396a6ebb" width="80%" alt="Watch Demo Video" />
    <br>
    <i>▶️ Click to Watch Demo</i>
  </a>
</div>

---

## ⚡ Performance & Scalability

We take engineering seriously. The system has been rigorously tested using **Autocannon**.

* **1,700+ requests/sec** sustained message ingestion on a single server.
* **Sub-60ms** write latency under load.
* **Zero errors** during benchmark stress testing.
* **Optimized MongoDB** compound indexing to resolve bottlenecks.

| **Login Load Test** | **Message Ingestion Test** |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/406c7101-3d9b-4af1-be7d-1eab64e4706d" width="100%"> | <img src="https://github.com/user-attachments/assets/49313158-4410-4d7f-b116-eff27a299416" width="100%"> |

---

## 🛠 Tech Stack

### **Frontend**
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

### **Backend**
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

### **Database & AI**
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![OpenAI](https://img.shields.io/badge/LLM_Integration-412991?style=for-the-badge&logo=openai&logoColor=white)

---

## 🧠 System Design & Security

### **Highlights**
* **Event-Driven Architecture:** Uses WebSocket layers for efficient concurrency handling.
* **Optimistic UI:** AI pipelines mask processing delays, making the app feel instant.
* **Separation of Concerns:** Clear split between REST APIs and real-time channels.

### **Security**
* 🔐 **Bcrypt Hashing** for secure authentication.
* 🛡️ **Prioritized Security** over raw login throughput (intentional trade-off).
* 🚫 **Non-Blocking Flows** ensures auth doesn't stop real-time messaging.

---

## 📂 Project Structure

```bash
astrixchat/
├── client/        # Frontend (React / Next.js)
├── server/        # Backend (Node.js, WebSockets)
└── README.md

<div align="center">

👤 Author

Bishwajit Sharma


Full-Stack Developer focused on real-time systems, performance, and scalable web architecture.

LinkedIn • GitHub

</div>

