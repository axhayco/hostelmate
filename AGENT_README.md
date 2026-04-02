# 🤖 HostelMate Digital Assistant: Technical Overview

The HostelMate Digital Assistant is a local, context-aware AI agent designed to provide instant support to students and hostel owners without requiring external API dependencies.

## 🏗️ Architecture
- **Component Shell:** `AgentControlPlane.tsx`
- **Context Injection:** Consumes `useAuth` and `useHostelContext` to adapt its behavior.
- **Response Engine:** A local keyword-matching engine with a state machine for multi-turn flows.

## 🛠️ Key Skills
- **Students:** Electricity balance, Mess menus, Leave requests, Vacancy checks.
- **Owners:** Occupancy stats, Revenue tracking, Pending leave management, Broadcasts.

## 🔄 Conversation Flow
1. **Greeting:** Automatic context-based greeting.
2. **Detection:** Intent mapping via keywords.
3. **Gathering:** State-based data collection (e.g., asking for room numbers).
4. **Action:** Confirmation-guarded high-impact actions.

## 🚀 Benefits
- **Instant Response:** Zero network latency.
- **Privacy:** All logic stays on the client.
- **Cost:** No API token usage.
