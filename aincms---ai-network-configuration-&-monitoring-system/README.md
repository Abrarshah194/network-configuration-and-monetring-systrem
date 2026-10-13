# AI-Powered Network Configuration and Monitoring System (AINCMS)

**University Final Year Project (FYP) — Computer Science / Computer Networks**

---

## 1. Executive Summary

**AINCMS** is an enterprise-grade, full-stack network configuration, deterministic simulation, and real-time telemetry monitoring platform designed to eliminate the need for expensive physical networking hardware or proprietary Cisco IOS licensing images.

The platform provides a dual-mode operational architecture:
- **MODE A — Autonomous Deterministic Simulation (Default)**: Runs completely out-of-the-box without Docker, hardware, or external services. Implements an LCG-seeded state engine that calculates ARP tables, 802.1Q VLAN trunking, OSPF Area 0 convergence, Spanning-Tree loop detection, link bandwidth, and packet loss.
- **MODE B — Optional Local Virtual Lab Bridge**: Pre-configured adapter layer ready to interface with local Docker daemons, Containerlab (v0.48+), and FRRouting (FRR 9.1) via an authenticated reverse Python bridge.

Integrated into the system is a **Server-Side Gemini 3.8 Flash AI Copilot** that reviews running configurations, diagnoses synthetic faults, analyzes traffic spikes, and recommends certified remediation procedures.

---

## 2. Key Features

- **Interactive Topology Canvas (@xyflow/react)**:
  - Drag-and-drop nodes (Routers, L2/L3 Switches, Firewalls, Servers, Client Hosts).
  - Connect interfaces with automatic port detection and live animated packet flows.
  - Real-time link health visualization (Active = Blue, Degraded = Amber, Cut = Red).
  - Graph cycle / Spanning-Tree loop detection and isolated node alerts.
  - JSON topology import/export.

- **Deterministic Simulation Core**:
  - Seeded Linear Congruential Generator (LCG) ensuring 100% reproducible academic experiments.
  - Virtual clock controls: Pause, Resume, Reset, and Single-Step execution.
  - Real-time latency, jitter, buffer drops, and protocol composition (HTTPS, DNS, SSH, OSPF, ICMP).

- **Network Configuration Workspace**:
  - Cisco IOS / FRR syntax editor with pre-commit validation.
  - Running-config vs candidate buffer side-by-side diff viewer.
  - NVRAM write memory (`copy running-config startup-config`).
  - Audited historical snapshots with one-click atomic rollback.

- **Rule-Based Automation Center**:
  - Multi-step declarative workflows (VLAN provisioning, static route injection, administrative interface toggle, configuration drift auto-remediation).
  - 4-phase safety lifecycle: Validation -> Dry-Run Preview -> Explicit Confirmation -> Result Verification.

- **Fault Detection & Injection Engine**:
  - Real-time threshold monitoring (CPU > 85%, packet loss > 10%, latency > 100ms, link cuts).
  - Interactive fault injector to test incident response and automated recovery policies.

- **Diagnostic Packet Tools**:
  - Built-in interactive ICMP Ping and hop-by-hop Traceroute tool reflecting actual simulated link states.

- **Guided FYP Academic Labs**:
  - 6 interactive guided exercises covering VLAN 802.1Q trunking, SVI inter-VLAN routing, static routing, OSPF Area 0, ACL security filtering, and failover recovery.
  - Automated test evaluation validating device configurations.

- **Server-Side Gemini 3.8 Flash Copilot**:
  - Secure server-side `@google/genai` integration with zero frontend API key exposure.
  - Contextual awareness of active alerts, link states, and running configurations.
  - Built-in intelligent rule-based heuristic fallback if offline.

- **Enterprise Role-Based Access Control (RBAC)**:
  - Super Administrator, Network Administrator, and Read-Only Viewer.
  - Complete security audit trail logging every commit and command.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, @xyflow/react |
| **Backend** | Node.js, Express, TypeScript (`tsx`), REST APIs |
| **Simulation** | Seeded LCG Engine, Deterministic Virtual Clock, Graph Cycle Detection |
| **AI Copilot** | Google Gemini API (`gemini-3.8-flash`) via `@google/genai` TypeScript SDK |
| **Virtual Lab Bridge** | Containerlab, FRRouting (FRR), Python 3 Netmiko Adapter |
| **Testing** | Automated Unit & Integration Suite (`test/system-verification.ts`) |

---

## 4. Quick Start & Execution

### Prerequisites
- Node.js 20+ installed
- npm installed

### Running the Full-Stack Application
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npx tsx test/system-verification.ts

# 3. Start development server (serves frontend and backend on port 3000)
npm run dev
```

Open your browser to `http://localhost:3000`.

---

## 5. Mathematical Formulation of Deterministic Simulation

To satisfy rigorous academic evaluation criteria, state changes avoid non-deterministic `Math.random()` calls:

1. **Linear Congruential Generator (LCG)**:
   $$X_{n+1} = (a \cdot X_n + c) \pmod{m}$$
   *Parameters:* $a = 9301$, $c = 49297$, $m = 233280$, $\text{Seed} = 42$.

2. **Simulated Link Latency $L(t)$**:
   $$L(t) = L_{\text{base}} + \sin(\omega t + \phi) \cdot A_{\text{jitter}} + \Delta_{\text{degradation}}$$

---

## 6. Academic Defense & Viva Q&A Guide

- **Q: Does this require physical networking hardware?**
  *A:* No. AINCMS was explicitly engineered so researchers and students can complete all routing, switching, ACL, and fault recovery experiments in Mode A without hardware or proprietary licenses.
- **Q: How does the AI Copilot remain safe?**
  *A:* Gemini 3.8 Flash operates in an advisory role with read-only context. It has no direct shell access; configuration updates require human validation, dry-run diff review, and manual administrative confirmation.
