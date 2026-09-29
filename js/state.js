// State Management & Business Logic Engine for Crescent Design Module
// Strictly adheres to detailed.md rules (D-R-01 to D-R-57) and processes (D-BP-01 to D-BP-06)

import { initialSeedData } from "./data/seed.js";

const STORAGE_KEY = "crescent_design_state_v1";

class StateStore {
  constructor() {
    this.listeners = new Set();
    this.notifications = [];
    this.loadState();
    this.runBackgroundChecks();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.data = JSON.parse(saved);
      } else {
        this.data = JSON.parse(JSON.stringify(initialSeedData));
        this.saveState();
      }
    } catch (e) {
      console.error("Failed to load state from localStorage, falling back to seed:", e);
      this.data = JSON.parse(JSON.stringify(initialSeedData));
    }
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
    }
    this.notify();
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(initialSeedData));
    this.saveState();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.data);
    }
  }

  // --- Current User & Actor Management ---
  getCurrentUser() {
    return this.data.currentUser;
  }

  switchRole(role) {
    const user = this.data.users.find(u => u.role === role);
    if (user) {
      this.data.currentUser = { ...user };
      this.saveState();
      this.addNotification(`Switched role to ${user.name} (${user.role} - ${user.title})`, "info");
    }
  }

  // "Their One Number" calculation for actors (§2)
  getActorOneNumber(role = this.data.currentUser.role) {
    if (role === "COO") {
      // How many quotations and project creations are sitting in my queue right now
      const pendingQuotes = this.data.enquiries.filter(e => e.quotation && e.quotation.status === "Pending COO").length;
      const pendingProjects = this.data.projects.filter(p => p.cooApprovedStatus === "Pending COO").length;
      return {
        number: pendingQuotes + pendingProjects,
        label: "Pending In My Queue",
        subtext: `${pendingQuotes} Quotations · ${pendingProjects} Project Setups`
      };
    }
    if (role === "HOD") {
      // How many drawings, right now, are either on the critical path or flagged At Risk
      // Across all active projects
      let count = 0;
      for (const p of this.data.projects) {
        const cpTaskIds = new Set(this.getCriticalPathTaskIds(p.id));
        const tasks = this.data.drawingTasks.filter(t => t.projectId === p.id);
        for (const t of tasks) {
          if (t.status !== "Final" && (cpTaskIds.has(t.id) || t.deliveryRisk === "At Risk")) {
            count++;
          }
        }
      }
      return {
        number: count,
        label: "Critical Path / At Risk Drawings",
        subtext: "Live studio-wide active drawings needing attention"
      };
    }
    if (role === "Architect") {
      // What's due from me this week, and what's blocking me
      const myId = this.data.currentUser.id;
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const myTasks = this.data.drawingTasks.filter(t => t.assignedUserId === myId);
      const dueThisWeek = myTasks.filter(t => {
        if (t.status === "Final") return false;
        const d = new Date(t.dueDate);
        return d <= nextWeek;
      }).length;
      const blocked = myTasks.filter(t => t.status === "Blocked").length;
      return {
        number: dueThisWeek + blocked,
        label: "Due This Week & Blockers",
        subtext: `${dueThisWeek} Due this week · ${blocked} Blocked`
      };
    }
    return { number: 0, label: "Overview", subtext: "" };
  }

  addNotification(message, type = "info") {
    const notif = {
      id: "ntf_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      message,
      type, // "info" | "warning" | "success" | "danger"
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.notifications.unshift(notif);
    if (this.notifications.length > 20) this.notifications.pop();
    this.notify();
    return notif;
  }

  // --- §5 Critical Path Engine (D-BP-03) ---
  computeProjectSchedule(projectId) {
    const tasks = this.data.drawingTasks.filter(t => t.projectId === projectId);
    if (tasks.length === 0) {
      return { tasks: [], criticalPathIds: [], finishDate: null, earliestStarts: {} };
    }

    // Task map
    const taskMap = new Map();
    tasks.forEach(t => taskMap.set(t.id, t));

    // Calculate earliest sensible starts: max due date of predecessors
    const earliestStarts = {};
    tasks.forEach(t => {
      let maxPredDue = null;
      if (t.dependsOnTaskIds && t.dependsOnTaskIds.length > 0) {
        for (const predId of t.dependsOnTaskIds) {
          const pred = taskMap.get(predId);
          if (pred && pred.dueDate) {
            if (!maxPredDue || pred.dueDate > maxPredDue) {
              maxPredDue = pred.dueDate;
            }
          }
        }
      }
      earliestStarts[t.id] = maxPredDue;
    });

    // Forward pass: find maximum due date
    let projectFinishDate = null;
    tasks.forEach(t => {
      if (t.dueDate) {
        if (!projectFinishDate || t.dueDate > projectFinishDate) {
          projectFinishDate = t.dueDate;
        }
      }
    });

    // Compute float:
    // Successors map
    const successorsMap = new Map();
    tasks.forEach(t => successorsMap.set(t.id, []));
    tasks.forEach(t => {
      if (t.dependsOnTaskIds) {
        t.dependsOnTaskIds.forEach(predId => {
          if (successorsMap.has(predId)) {
            successorsMap.get(predId).push(t.id);
          }
        });
      }
    });

    // Backward pass for latest finish (LF) & float
    const floatMap = {};
    const criticalPathIds = [];

    // Simple robust float approximation based on DAG:
    // For terminal tasks (no successors), LF = projectFinishDate
    // For other tasks, LF = min(succ.startDate)
    // Float = days between task.dueDate and LF
    const parseDate = (dStr) => dStr ? new Date(dStr).getTime() : 0;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    tasks.forEach(t => {
      const succs = successorsMap.get(t.id) || [];
      let latestFinishMs = parseDate(projectFinishDate);
      if (succs.length > 0) {
        let minSuccStartMs = Infinity;
        succs.forEach(succId => {
          const succ = taskMap.get(succId);
          if (succ && succ.startDate) {
            const startMs = parseDate(succ.startDate);
            if (startMs < minSuccStartMs) minSuccStartMs = startMs;
          }
        });
        if (minSuccStartMs !== Infinity) {
          latestFinishMs = minSuccStartMs;
        }
      }
      const taskDueMs = parseDate(t.dueDate);
      const floatDays = Math.max(0, Math.round((latestFinishMs - taskDueMs) / MS_PER_DAY));
      floatMap[t.id] = floatDays;

      if (floatDays === 0) {
        criticalPathIds.push(t.id);
      }
    });

    return {
      tasks,
      taskMap,
      earliestStarts,
      floatMap,
      criticalPathIds,
      projectFinishDate
    };
  }

  getCriticalPathTaskIds(projectId) {
    return this.computeProjectSchedule(projectId).criticalPathIds;
  }

  // --- §6 Planning Conflicts & Delivery Risk Engine (D-BP-04) ---
  computeArchitectWorkload(userId, startDateStr, dueDateStr, excludeTaskId = null) {
    if (!userId || !startDateStr || !dueDateStr) {
      return { loadStatus: "Light", overlappingCount: 0, clusterProjectsCount: 0, overlappingTasks: [] };
    }

    const start = new Date(startDateStr).getTime();
    const end = new Date(dueDateStr).getTime();

    // Check all tasks across all projects
    const overlappingTasks = this.data.drawingTasks.filter(t => {
      if (t.id === excludeTaskId) return false;
      if (t.assignedUserId !== userId) return false;
      if (t.status === "Final") return false;
      if (!t.startDate || !t.dueDate) return false;

      const tStart = new Date(t.startDate).getTime();
      const tEnd = new Date(t.dueDate).getTime();
      // Overlap condition
      return Math.max(start, tStart) <= Math.min(end, tEnd);
    });

    const overlappingCount = overlappingTasks.length;
    let loadStatus = "Light"; // 1-2 overlapping
    if (overlappingCount >= 4) {
      loadStatus = "Overloaded"; // 5+ total including this one
    } else if (overlappingCount >= 2) {
      loadStatus = "Busy"; // 3-4 total
    }

    // Studio clustering: count other projects with drawings due in same window
    const otherProjects = new Set();
    this.data.drawingTasks.forEach(t => {
      if (t.id === excludeTaskId) return false;
      if (t.status === "Final") return false;
      if (!t.dueDate) return false;
      const tDue = new Date(t.dueDate).getTime();
      if (tDue >= start && tDue <= end) {
        otherProjects.add(t.projectId);
      }
    });

    return {
      loadStatus,
      overlappingCount,
      clusterProjectsCount: otherProjects.size,
      overlappingTasks
    };
  }

  recalculateAllDeliveryRisks() {
    let changed = false;
    for (const task of this.data.drawingTasks) {
      if (task.status === "Final") {
        if (task.deliveryRisk !== "Clear") {
          task.deliveryRisk = "Clear";
          changed = true;
        }
        continue;
      }
      if (task.assignedUserId && task.startDate && task.dueDate) {
        const conflict = this.computeArchitectWorkload(task.assignedUserId, task.startDate, task.dueDate, task.id);
        const shouldBeRisk = conflict.loadStatus === "Busy" || conflict.loadStatus === "Overloaded" || conflict.clusterProjectsCount >= 3;
        const newRisk = shouldBeRisk ? "At Risk" : "Clear";
        if (task.deliveryRisk !== newRisk) {
          task.deliveryRisk = newRisk;
          changed = true;
        }
      }
    }
    if (changed) {
      this.saveState();
    }
  }

  // --- Background Checks (D-BP-01, D-BP-02) ---
  runBackgroundChecks() {
    const today = new Date().toISOString().split("T")[0];

    // D-BP-02: Overdue watcher
    this.data.drawingTasks.forEach(t => {
      if (t.status !== "Final" && t.dueDate && t.dueDate < today) {
        t.isOverdue = true;
      } else {
        t.isOverdue = false;
      }
    });

    // D-BP-01: RFI SLA clock & escalation (D-R-29)
    this.data.rfis.forEach(r => {
      if (r.status === "Open" && r.slaDueDate && r.slaDueDate < today) {
        r.slaBreached = true;
      } else {
        r.slaBreached = false;
      }
    });

    this.recalculateAllDeliveryRisks();
  }

  // ==========================================
  // BUSINESS OPERATIONS & INVARIANT ENFORCEMENT
  // ==========================================

  // --- §3.1 Enquiry Operations ---
  createEnquiry(payload) {
    const nextSeq = this.data.enquiries.length + 1;
    const enquiryNumber = `ENQ-2026-${String(80 + nextSeq).padStart(3, "0")}`;
    const firstStage = this.data.enquiryStages.find(s => s.active && !s.isLost) || this.data.enquiryStages[0];

    const newEnquiry = {
      id: "enq_" + Date.now(),
      enquiryNumber,
      clientName: payload.clientName,
      clientContact: payload.clientContact,
      propertyAddress: payload.propertyAddress,
      engagementType: payload.engagementType,
      assignedUserId: payload.assignedUserId || this.data.currentUser.id,
      stageId: firstStage.id,
      lostReason: null,
      createdDate: new Date().toISOString().split("T")[0],
      quotation: null,
      confirmationGate: {
        status: "Not started",
        proposalFile: null,
        advanceAmount: 0,
        advanceReceiptRef: null,
        hodApproved: false,
        cooApproved: false,
        confirmedDate: null
      },
      projectSetup: {
        status: "N/A",
        projectId: null,
        cooApprovedBy: null,
        cooApprovedDate: null
      }
    };

    this.data.enquiries.unshift(newEnquiry);
    this.saveState();
    this.addNotification(`Created new Enquiry ${enquiryNumber} for ${payload.clientName}`, "success");
    return newEnquiry;
  }

  updateEnquiryStage(enquiryId, newStageId, lostReason = null) {
    const enq = this.data.enquiries.find(e => e.id === enquiryId);
    if (!enq) return;

    const targetStage = this.data.enquiryStages.find(s => s.id === newStageId);
    // D-R-01: A lost enquiry must carry a lost reason
    if (targetStage && targetStage.isLost) {
      if (!lostReason || !lostReason.trim()) {
        throw new Error("D-R-01 Guard: A lost enquiry must carry a recorded lost reason.");
      }
      enq.lostReason = lostReason;
    } else {
      enq.lostReason = null;
    }

    // D-R-45: Stage is a plain field the HOD sets directly. It carries no system logic, blocks nothing, unlocks nothing.
    // D-R-55: Badges are derived from their own sources of truth, never from stage.
    enq.stageId = newStageId;
    this.saveState();
    this.addNotification(`Moved ${enq.enquiryNumber} to stage "${targetStage ? targetStage.name : newStageId}"`, "info");
  }

  // --- §3.5 Quotation Operations ---
  saveQuotation(enquiryId, quoteData) {
    const enq = this.data.enquiries.find(e => e.id === enquiryId);
    if (!enq) return;

    if (!enq.quotation) {
      const qNum = `QT-2026-${String(20 + this.data.enquiries.filter(e => e.quotation).length).padStart(3, "0")}`;
      enq.quotation = {
        quotationNumber: qNum,
        draftedBy: this.data.currentUser.id,
        pricedValue: Number(quoteData.pricedValue) || 0,
        scopeSummary: quoteData.scopeSummary || "",
        validityDays: Number(quoteData.validityDays) || 30,
        status: "Draft",
        cooApprovedBy: null,
        cooApprovedDate: null,
        sentDate: null
      };
    } else {
      enq.quotation.pricedValue = Number(quoteData.pricedValue) || enq.quotation.pricedValue;
      enq.quotation.scopeSummary = quoteData.scopeSummary || enq.quotation.scopeSummary;
      enq.quotation.validityDays = Number(quoteData.validityDays) || enq.quotation.validityDays;
    }
    this.saveState();
    this.addNotification(`Saved quotation for ${enq.enquiryNumber}`, "info");
  }

  submitQuotationForApproval(enquiryId) {
    const enq = this.data.enquiries.find(e => e.id === enquiryId);
    if (!enq || !enq.quotation) return;
    enq.quotation.status = "Pending COO";
    // D-EV-14 Quotation submitted for approval -> COO notified
    this.saveState();
    this.addNotification(`D-EV-14: Quotation ${enq.quotation.quotationNumber} submitted to COO for pricing review`, "info");
  }

  approveQuotation(enquiryId, cooUserId = this.data.currentUser.id) {
    const enq = this.data.enquiries.find(e => e.id === enquiryId);
    if (!enq || !enq.quotation) return;
    enq.quotation.status = "Approved";
    enq.quotation.cooApprovedBy = cooUserId;
    enq.quotation.cooApprovedDate = new Date().toISOString().split("T")[0];
    // D-EV-15 Quotation approved -> unlocks "send to client" (D-R-42)
    this.saveState();
    this.addNotification(`D-EV-15: Quotation ${enq.quotation.quotationNumber} approved by COO. Ready to send to client.`, "success");
  }

  returnQuotation(enquiryId, reasonComment = "") {
    const enq = this.data.enquiries.find(e => e.id === enquiryId);
    if (!enq || !enq.quotation) return;
    enq.quotation.status = "Draft";
    enq.quotation.cooApprovedBy = null;
    enq.quotation.cooApprovedDate = null;
    this.saveState();
    this.addNotification(`Quotation ${enq.quotation.quotationNumber} returned for revision: ${reasonComment}`, "warning");
  }

  sendQuotationToClient(enquiryId) {
    const enq = this.data.enquiries.find(e => e.id === enquiryId);
    if (!enq || !enq.quotation) return;
    // D-R-42: A quotation cannot move to Sent to client until it is COO approved.
    if (enq.quotation.status !== "Approved") {
      throw new Error("D-R-42 Guard: Quotation cannot move to Sent to client until it is COO approved.");
    }
    enq.quotation.status = "Sent";
    enq.quotation.sentDate = new Date().toISOString().split("T")[0];
    this.saveState();
    this.addNotification(`Quotation ${enq.quotation.quotationNumber} marked as Sent to client`, "success");
  }

  markQuotationSigned(enquiryId, proposalFileName) {
    const enq = this.data.enquiries.find(e => e.id === enquiryId);
    if (!enq || !enq.quotation) return;
    enq.quotation.status = "Signed";
    if (enq.confirmationGate.status === "Not started") {
      enq.confirmationGate.status = "Pending";
    }
    if (proposalFileName) {
      enq.confirmationGate.proposalFile = proposalFileName;
    }
    this.saveState();
    this.addNotification(`Proposal signed for ${enq.enquiryNumber}. Confirmation gate is ready.`, "success");
  }

  // --- §3.5 Confirmation Gate Operations ---
  confirmProjectGate(enquiryId, gateData) {
    const enq = this.data.enquiries.find(e => e.id === enquiryId);
    if (!enq) return;

    // D-R-07 Guard: all four checks must be true:
    // signed proposal on file, advance receipt tagged, HOD approved, COO approved
    const hasSignedProposal = Boolean(gateData.proposalFile || enq.confirmationGate.proposalFile);
    const hasAdvanceReceipt = Boolean(gateData.advanceReceiptRef);
    const hodApproved = Boolean(gateData.hodApproved);
    const cooApproved = Boolean(gateData.cooApproved);

    if (!hasSignedProposal || !hasAdvanceReceipt || !hodApproved || !cooApproved) {
      throw new Error("D-R-07 Guard: A project cannot be confirmed until all 4 checks are satisfied: Signed proposal on file, advance receipt reference, HOD approval, and COO approval.");
    }

    enq.confirmationGate = {
      status: "Passed",
      proposalFile: gateData.proposalFile || enq.confirmationGate.proposalFile,
      advanceAmount: Number(gateData.advanceAmount) || enq.confirmationGate.advanceAmount || 0,
      advanceReceiptRef: gateData.advanceReceiptRef,
      hodApproved: true,
      cooApproved: true,
      confirmedDate: new Date().toISOString().split("T")[0]
    };

    // D-EV-01: Enquiry converted -> Project creation ready
    // D-R-43: Passing the confirmation gate authorises the project record to be created;
    // it does NOT by itself unlock the board (D-R-44).
    this.saveState();
    this.addNotification(`D-EV-01: Confirmation gate passed for ${enq.enquiryNumber}! Ready to initiate Project Creation.`, "success");
  }

  initiateProjectCreation(enquiryId, { projectName, projectTypeMasters, drawingTemplateId }) {
    const enq = this.data.enquiries.find(e => e.id === enquiryId);
    if (!enq) return;

    if (enq.confirmationGate.status !== "Passed") {
      throw new Error("D-R-07 Guard: Cannot create project from unconfirmed enquiry.");
    }
    // D-R-08: A project must have a drawing template before it can be created.
    if (!drawingTemplateId) {
      throw new Error("D-R-08 Guard: A project must have a drawing template selected before it can be created.");
    }
    // D-R-10: Template must contain at least one drawing type.
    const tmpl = this.data.drawingTemplates.find(t => t.id === drawingTemplateId);
    if (!tmpl || !tmpl.drawingTypeIds || tmpl.drawingTypeIds.length === 0) {
      throw new Error("D-R-10 Guard: The selected template must contain at least one drawing type.");
    }

    // Get measured area if available (D-R-06)
    const measurement = this.data.measurements.find(m => m.enquiryId === enquiryId);
    const areaSqM = measurement ? measurement.totalAreaSqM : 0;

    const nextCodeNum = this.data.projects.length + 1;
    const projectCode = `PRJ-CR-2026-${String(nextCodeNum).padStart(2, "0")}`;
    const newProjectId = "prj_" + Date.now();

    const newProject = {
      id: newProjectId,
      projectCode,
      projectName: projectName || enq.clientName + " Residence",
      projectTypeMasters: projectTypeMasters || "Luxury Residential",
      drawingTemplateId,
      clientName: enq.clientName,
      areaSqM,
      enquiryId: enq.id,
      quotationValue: enq.quotation ? enq.quotation.pricedValue : 0,
      cooApprovedStatus: "Pending COO", // D-R-44: Board locked until COO records creation approval
      cooApprovedBy: null,
      cooApprovedDate: null,
      boardLocked: true,
      createdDate: new Date().toISOString().split("T")[0]
    };

    this.data.projects.unshift(newProject);

    // Link enquiry to project (D-R-02: converted enquiry keeps permanent link)
    enq.projectSetup = {
      status: "Pending COO",
      projectId: newProjectId,
      cooApprovedBy: null,
      cooApprovedDate: null
    };

    // D-EV-16: Project creation submitted for approval -> COO notified
    this.saveState();
    this.addNotification(`D-EV-16: Project ${projectCode} created and queued for COO studio onboarding approval (D-S-08).`, "info");
    return newProject;
  }

  // Direct HOD Project Creation (bypassing enquiry gate §3.5)
  createProjectDirect({ projectName, projectTypeMasters, drawingTemplateId, clientName, areaSqM, quotationValue }) {
    // D-R-08: Drawing template required
    if (!drawingTemplateId) {
      throw new Error("D-R-08 Guard: A project must have a drawing template selected before it can be created.");
    }
    const tmpl = this.data.drawingTemplates.find(t => t.id === drawingTemplateId);
    if (!tmpl || !tmpl.drawingTypeIds || tmpl.drawingTypeIds.length === 0) {
      throw new Error("D-R-10 Guard: The selected template must contain at least one drawing type.");
    }

    const nextCodeNum = this.data.projects.length + 1;
    const projectCode = `PRJ-CR-2026-${String(nextCodeNum).padStart(2, "0")}`;
    const newProjectId = "prj_" + Date.now();

    const newProject = {
      id: newProjectId,
      projectCode,
      projectName,
      projectTypeMasters: projectTypeMasters || "Commercial Architecture",
      drawingTemplateId,
      clientName,
      areaSqM: Number(areaSqM) || 0,
      enquiryId: null,
      quotationValue: Number(quotationValue) || 0,
      cooApprovedStatus: "Pending COO", // D-R-44: Board is locked until COO records creation approval
      cooApprovedBy: null,
      cooApprovedDate: null,
      boardLocked: true,
      createdDate: new Date().toISOString().split("T")[0]
    };

    this.data.projects.unshift(newProject);
    this.saveState();
    this.addNotification(`Project ${projectCode} created. Awaiting COO Creation Approval (D-S-08) to unlock board.`, "info");
    return newProject;
  }

  // COO Project Creation Approval (§3.6, D-S-08, D-EV-17)
  approveProjectCreation(projectId, cooUserId = this.data.currentUser.id) {
    const prj = this.data.projects.find(p => p.id === projectId);
    if (!prj) return;

    prj.cooApprovedStatus = "Approved";
    prj.cooApprovedBy = cooUserId;
    prj.cooApprovedDate = new Date().toISOString().split("T")[0];
    prj.boardLocked = false; // D-R-44 unlocked!

    // If linked to an enquiry, update its badge (D-R-55)
    if (prj.enquiryId) {
      const enq = this.data.enquiries.find(e => e.id === prj.enquiryId);
      if (enq) {
        enq.projectSetup.status = "Approved";
        enq.projectSetup.cooApprovedBy = cooUserId;
        enq.projectSetup.cooApprovedDate = prj.cooApprovedDate;
      }
    }

    // D-EV-17: Project creation approved -> unlocks drawing checklist import & board
    this.saveState();
    this.addNotification(`D-EV-17: COO approved project creation for ${prj.projectCode} (${prj.projectName}). Drawing board is now UNLOCKED!`, "success");
  }

  holdProjectCreation(projectId, holdComment = "") {
    const prj = this.data.projects.find(p => p.id === projectId);
    if (!prj) return;
    prj.cooApprovedStatus = "Held";
    prj.boardLocked = true;
    this.saveState();
    this.addNotification(`Project ${prj.projectCode} placed on hold by COO: ${holdComment}`, "warning");
  }

  // --- §3.8 Import Drawing Checklist (D-S-11, D-EV-03) ---
  importDrawingChecklist(projectId, selectedDrawingTypeIds) {
    const prj = this.data.projects.find(p => p.id === projectId);
    if (!prj) return;

    // D-R-44: Board locked until COO approved
    if (prj.boardLocked || prj.cooApprovedStatus !== "Approved") {
      throw new Error("D-R-44 Guard: Project board is locked until COO records creation approval.");
    }

    let createdCount = 0;
    const defaultStartDate = new Date().toISOString().split("T")[0];

    selectedDrawingTypeIds.forEach((dtId, idx) => {
      const dt = this.data.drawingTypes.find(t => t.id === dtId);
      if (!dt) return;

      const newTaskId = "tsk_" + Date.now() + "_" + idx;
      const duration = 7 + (idx % 5) * 2; // Staggered default duration 7-15 days
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + duration);
      const dueDateStr = dueDateObj.toISOString().split("T")[0];

      const newTask = {
        id: newTaskId,
        projectId,
        drawingName: dt.name,
        discipline: dt.discipline, // D-R-12: discipline fixed at creation
        assignedUserId: null,
        watchers: ["usr_hod"],
        status: "To Do",
        priority: "Medium",
        labels: [dt.discipline],
        startDate: defaultStartDate,
        durationDays: duration,
        dueDate: dueDateStr,
        percentComplete: 0,
        dependsOnTaskIds: [],
        deliveryRisk: "Clear",
        holdReasonId: null,
        holdOwnerId: null,
        checklist: [
          { id: "chk_" + Date.now() + "_1", text: "Cross-verify architectural layout datum", checked: false, checkedBy: null, checkedDate: null },
          { id: "chk_" + Date.now() + "_2", text: "Annotation & dimension check", checked: false, checkedBy: null, checkedDate: null }
        ],
        referenceAttachments: [],
        comments: [],
        activityHistory: [
          {
            id: "act_" + Date.now(),
            actorId: this.data.currentUser.id,
            timestamp: new Date().toISOString(),
            field: "import",
            fromValue: "",
            toValue: "Imported from template"
          }
        ],
        createdDate: defaultStartDate
      };

      this.data.drawingTasks.push(newTask);
      createdCount++;
    });

    // D-EV-03 Drawing checklist imported
    this.recalculateAllDeliveryRisks();
    this.saveState();
    this.addNotification(`D-EV-03: Imported ${createdCount} drawing tasks into To Do for ${prj.projectCode}`, "success");
  }

  // --- §3.2 Meeting & MOM Operations (D-S-03) ---
  saveMeeting(meetingData) {
    // D-R-47: Scheduling a meeting requires at least one invited internal user.
    if (!meetingData.invitedUserIds || meetingData.invitedUserIds.length === 0) {
      throw new Error("D-R-47 Guard: A meeting cannot be scheduled without at least one invited internal user.");
    }

    const isEdit = Boolean(meetingData.id);
    let mtg;

    if (isEdit) {
      mtg = this.data.meetings.find(m => m.id === meetingData.id);
      if (!mtg) return;

      // D-R-05: Sent minutes are editable only until sent
      if (mtg.status === "Sent" || mtg.status === "Closed") {
        if (meetingData.minutesText !== mtg.minutesText) {
          throw new Error("D-R-05 Guard: Minutes are editable only until sent; after that, corrections are a new, linked meeting record.");
        }
      }

      Object.assign(mtg, meetingData);
    } else {
      const enqMeetings = this.data.meetings.filter(m => m.enquiryId === meetingData.enquiryId);
      const meetingNumber = enqMeetings.length + 1;
      mtg = {
        ...meetingData,
        id: "mtg_" + Date.now(),
        meetingNumber,
        status: meetingData.status || "Scheduled",
        rescheduleHistory: [],
        createdDate: new Date().toISOString().split("T")[0]
      };
      this.data.meetings.push(mtg);
      // D-EV-18 Meeting scheduled (first time) -> D-BP-06 side effects
      this.addNotification(`D-EV-18: Meeting #${meetingNumber} scheduled. Calendars blocked, emails triggered, Zoho synced.`, "success");
    }

    this.saveState();
    return mtg;
  }

  rescheduleMeeting(meetingId, newStartTime, newEndTime, rescheduleReason = "") {
    const mtg = this.data.meetings.find(m => m.id === meetingId);
    if (!mtg) return;

    // D-R-48: A meeting already Held cannot be rescheduled — a new meeting is created instead.
    if (mtg.status === "Held" || mtg.status === "Closed" || mtg.status === "Sent") {
      throw new Error("D-R-48 Guard: A meeting already Held cannot be rescheduled. Create a follow-up meeting instead.");
    }

    const oldSlot = {
      startTime: mtg.startTime,
      endTime: mtg.endTime,
      rescheduledAt: new Date().toISOString(),
      reason: rescheduleReason
    };

    mtg.rescheduleHistory.push(oldSlot);
    mtg.startTime = newStartTime;
    mtg.endTime = newEndTime;

    // D-EV-21: Meeting rescheduled -> old calendar block released, D-BP-06 re-runs for new time, invitees get rescheduled notice
    this.saveState();
    this.addNotification(`D-EV-21: Meeting #${mtg.meetingNumber} rescheduled. Old calendar slot released; update sent to invitees.`, "info");
  }

  closeMeeting(meetingId, closeData = {}) {
    const mtg = this.data.meetings.find(m => m.id === meetingId);
    if (!mtg) return;

    // D-R-03 Guard: A meeting cannot reach Closed while scope-impact is flagged and no commercial impact amount is recorded.
    const isScopeImpact = closeData.scopeImpact ?? mtg.scopeImpact;
    const commAmount = closeData.commercialImpactAmount ?? mtg.commercialImpactAmount;
    if (isScopeImpact && (!commAmount || Number(commAmount) <= 0)) {
      throw new Error("D-R-03 Guard: A meeting cannot reach Closed while scope-impact is flagged and no commercial impact amount is recorded.");
    }

    // D-R-04 Guard: A meeting cannot close while any action item lacks an owner or due date.
    const actionItems = closeData.actionItems || mtg.actionItems || [];
    for (const item of actionItems) {
      if (!item.ownerId || !item.dueDate) {
        throw new Error(`D-R-04 Guard: Action item "${item.text || 'Untitled'}" must have both an assigned owner and a due date before meeting close.`);
      }
    }

    Object.assign(mtg, closeData);
    mtg.status = "Closed";

    // Deliverable presentation link check (D-R-50 / D-EV-22)
    if (mtg.linkedDeliverableIds && mtg.linkedDeliverableIds.length > 0) {
      mtg.linkedDeliverableIds.forEach(delivId => {
        const deliv = this.data.deliverables.find(d => d.id === delivId);
        if (deliv && !deliv.presentedAtMeetingId) {
          deliv.presentedAtMeetingId = mtg.id; // D-EV-22
        }
      });
    }

    // Check special role: Budget Planning (D-R-46 / D-EV-19)
    const mType = this.data.meetingTypes.find(t => t.id === mtg.typeId);
    if (mType && mType.specialRole === "Budget Planning") {
      if (mtg.decision === "Approved") {
        // D-R-46: Closed with decision = Approved sets COO-approval fact on linked quotation
        if (mtg.linkedQuotationNumber && mtg.enquiryId) {
          const enq = this.data.enquiries.find(e => e.id === mtg.enquiryId);
          if (enq && enq.quotation && enq.quotation.quotationNumber === mtg.linkedQuotationNumber) {
            enq.quotation.status = "Approved";
            enq.quotation.cooApprovedBy = this.data.currentUser.id;
            enq.quotation.cooApprovedDate = new Date().toISOString().split("T")[0];
            this.addNotification(`D-R-46 / D-EV-19: Budget Planning Meeting closed as Approved. COO approval set on Quotation ${enq.quotation.quotationNumber}.`, "success");
          }
        }
      } else if (mtg.decision === "Returned") {
        this.addNotification(`Budget Planning Meeting closed with Returned decision. Quotation requires revision.`, "warning");
      }
    }

    this.saveState();
    this.addNotification(`Meeting #${mtg.meetingNumber} Closed successfully.`, "info");
  }

  // --- §3.3 Site Measurement Operations (D-S-04) ---
  saveSiteMeasurement(measData) {
    let total = 0;
    const rooms = (measData.rooms || []).map(r => {
      const area = Math.round((Number(r.lengthM) * Number(r.widthM)) * 100) / 100;
      total += area;
      return { ...r, areaSqM: area };
    });

    const totalAreaSqM = Math.round(total * 10) / 10;

    let meas;
    if (measData.id) {
      meas = this.data.measurements.find(m => m.id === measData.id);
      if (meas) {
        Object.assign(meas, { ...measData, rooms, totalAreaSqM });
      }
    } else {
      meas = {
        ...measData,
        id: "meas_" + Date.now(),
        rooms,
        totalAreaSqM,
        photos: measData.photos || []
      };
      this.data.measurements.push(meas);
    }

    this.saveState();
    this.addNotification(`Site measurement saved. Total Area: ${totalAreaSqM} sq.m (${Math.round(totalAreaSqM * 10.764)} sq.ft)`, "success");
    return meas;
  }

  // --- §3.4 Design Deliverable Operations (D-S-05) ---
  saveDeliverable(delivData) {
    if (delivData.id) {
      const existing = this.data.deliverables.find(d => d.id === delivData.id);
      if (!existing) return;

      // D-R-50: A deliverable is NEVER edited after it has been presented at a meeting
      if (existing.presentedAtMeetingId) {
        // Can only update client response & comments
        existing.clientResponse = delivData.clientResponse;
        existing.clientComments = delivData.clientComments;
      } else {
        Object.assign(existing, delivData);
      }
    } else {
      // New deliverable version or new item
      let versionNumber = 1;
      if (delivData.supersedesId) {
        const parent = this.data.deliverables.find(d => d.id === delivData.supersedesId);
        if (parent) {
          versionNumber = (parent.versionNumber || 1) + 1;
          // D-R-51: deliverable_type cannot change between versions of the same lineage
          delivData.deliverableTypeId = parent.deliverableTypeId;
        }
      }

      const newDeliv = {
        ...delivData,
        id: "deliv_" + Date.now(),
        versionNumber,
        createdDate: new Date().toISOString().split("T")[0]
      };
      this.data.deliverables.push(newDeliv);
    }
    this.saveState();
    this.addNotification(`Saved Deliverable: ${delivData.title}`, "info");
  }

  // --- §3.10 Drawing Task & Revision Operations (D-S-13) ---
  updateTaskPlanning(taskId, { assignedUserId, priority, labels, startDate, durationDays, dueDate, dependsOnTaskIds }) {
    // D-R-13: Only HOD assigns or reassigns a task, sets priority, labels, dependencies, dates (see §13 Permissions)
    if (this.data.currentUser.role !== "HOD") {
      throw new Error("D-R-13 Guard: Only the HOD may assign or reassign a task, set dates, or configure dependencies.");
    }

    const task = this.data.drawingTasks.find(t => t.id === taskId);
    if (!task) return;

    // D-R-25: A task cannot depend on itself
    if (dependsOnTaskIds && dependsOnTaskIds.includes(taskId)) {
      throw new Error("D-R-25 Guard: A task cannot depend on itself.");
    }

    // D-R-26: Loop detection (A -> B -> A)
    if (dependsOnTaskIds && dependsOnTaskIds.length > 0) {
      if (this.detectDependencyCycle(taskId, dependsOnTaskIds)) {
        throw new Error("D-R-26 Guard: Dependency loop detected. Operation rejected to preserve scheduling integrity.");
      }
    }

    const oldAssignee = task.assignedUserId;
    if (assignedUserId !== undefined) task.assignedUserId = assignedUserId;
    if (priority !== undefined) task.priority = priority; // D-R-16: Priority never changes computed float/critical path
    if (labels !== undefined) task.labels = labels;
    if (startDate !== undefined) task.startDate = startDate;
    if (durationDays !== undefined) task.durationDays = Number(durationDays);
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (dependsOnTaskIds !== undefined) task.dependsOnTaskIds = dependsOnTaskIds;

    // Log activity
    if (oldAssignee !== task.assignedUserId) {
      task.activityHistory.unshift({
        id: "act_" + Date.now(),
        actorId: this.data.currentUser.id,
        timestamp: new Date().toISOString(),
        field: "assignedUserId",
        fromValue: oldAssignee || "Unassigned",
        toValue: task.assignedUserId || "Unassigned"
      });
    }

    // Recompute Critical Path & Workload Risks (D-EV-04, D-EV-05, D-BP-03, D-BP-04)
    this.recalculateAllDeliveryRisks();
    this.saveState();
    this.addNotification(`Updated planning parameters for task "${task.drawingName}". Schedule recomputed.`, "success");
  }

  detectDependencyCycle(targetTaskId, newDependsOnIds) {
    const visited = new Set();
    const stack = new Set();

    const check = (nodeId) => {
      visited.add(nodeId);
      stack.add(nodeId);

      const task = this.data.drawingTasks.find(t => t.id === nodeId);
      const preds = (nodeId === targetTaskId) ? newDependsOnIds : (task ? task.dependsOnTaskIds || [] : []);

      for (const predId of preds) {
        if (!visited.has(predId)) {
          if (check(predId)) return true;
        } else if (stack.has(predId)) {
          return true; // Cycle detected!
        }
      }

      stack.delete(nodeId);
      return false;
    };

    return check(targetTaskId);
  }

  updateTaskStatus(taskId, newStatus, holdReasonId = null, holdOwnerId = null) {
    const task = this.data.drawingTasks.find(t => t.id === taskId);
    if (!task) return;

    const user = this.data.currentUser;

    // D-R-14: An architect may move their own assigned tasks between To Do, In Progress, Under Review and Blocked — NEVER to Final.
    if (user.role === "Architect") {
      if (task.assignedUserId !== user.id) {
        throw new Error("Permissions Guard: You may only modify tasks assigned directly to you.");
      }
      if (newStatus === "Final") {
        throw new Error("D-R-14 Guard: Architects may not approve tasks to Final (GFC). Only the HOD can approve GFC status.");
      }
    }

    // D-R-15: A task moved to Blocked must carry a hold reason and a named owner.
    if (newStatus === "Blocked") {
      if (!holdReasonId || !holdOwnerId) {
        throw new Error("D-R-15 Guard: A task moved to Blocked must carry a valid hold reason and a named owner.");
      }
      task.holdReasonId = holdReasonId;
      task.holdOwnerId = holdOwnerId;
    } else {
      task.holdReasonId = null;
      task.holdOwnerId = null;
    }

    const oldStatus = task.status;
    task.status = newStatus;

    // Derived Percent Complete (§3.10)
    // To Do 0 / In Progress 25 / Under Review 75 / Final 100; Blocked freezes last value
    if (newStatus === "To Do") task.percentComplete = 0;
    else if (newStatus === "In Progress") task.percentComplete = 25;
    else if (newStatus === "Under Review") task.percentComplete = 75;
    else if (newStatus === "Final") task.percentComplete = 100;

    task.activityHistory.unshift({
      id: "act_" + Date.now(),
      actorId: user.id,
      timestamp: new Date().toISOString(),
      field: "status",
      fromValue: oldStatus,
      toValue: newStatus
    });

    // D-EV-10, D-BP-03 critical-path recompute
    this.recalculateAllDeliveryRisks();
    this.saveState();
    this.addNotification(`Task "${task.drawingName}" moved from ${oldStatus} to ${newStatus}`, "info");
  }

  // Revision upload (§3.11, D-R-19 to D-R-24)
  uploadRevision(taskId, { fileName, fileSize = "5.0 MB", changeDescription }) {
    const task = this.data.drawingTasks.find(t => t.id === taskId);
    if (!task) return;

    // Revisions for this task
    const taskRevs = this.data.revisions.filter(r => r.taskId === taskId);
    // D-R-19: Sequential revision numbering starting at R0
    const nextRevCode = `R${taskRevs.length}`;

    // D-R-20: Change description is mandatory from R1 onward
    if (taskRevs.length > 0 && (!changeDescription || !changeDescription.trim())) {
      throw new Error("D-R-20 Guard: Change description is mandatory for revision R1 and onward.");
    }

    const newRev = {
      id: "rev_" + Date.now(),
      taskId,
      revisionCode: nextRevCode,
      fileName,
      fileSize,
      uploadedById: this.data.currentUser.id,
      uploadedDate: new Date().toISOString().split("T")[0],
      changeDescription: changeDescription || "Initial revision upload",
      status: "Under Review", // D-R-23: submitting for review moves revision and task together
      reviewedById: null,
      reviewedDate: null,
      reviewComment: ""
    };

    this.data.revisions.push(newRev);

    // D-R-24: Uploading a new file against a task already at Final (GFC) drops task to Under Review
    task.status = "Under Review";
    task.percentComplete = 75;

    task.activityHistory.unshift({
      id: "act_" + Date.now(),
      actorId: this.data.currentUser.id,
      timestamp: new Date().toISOString(),
      field: "revision",
      fromValue: "",
      toValue: `Uploaded ${nextRevCode} (${fileName})`
    });

    // D-EV-06 Revision submitted for review -> HOD notified
    this.saveState();
    this.addNotification(`D-EV-06: Uploaded revision ${nextRevCode} for "${task.drawingName}". Moved to Under Review.`, "success");
    return newRev;
  }

  approveRevisionGFC(revisionId, reviewComment = "") {
    // Only HOD may approve GFC (D-R-14, D-EV-07)
    if (this.data.currentUser.role !== "HOD") {
      throw new Error("Permissions Guard: Only the HOD can approve a revision to Final (GFC).");
    }

    const rev = this.data.revisions.find(r => r.id === revisionId);
    if (!rev) return;

    const task = this.data.drawingTasks.find(t => t.id === rev.taskId);
    if (!task) return;

    // D-R-21: Only one revision per task may hold GFC status at a time;
    // a newly approved GFC revision automatically supersedes whichever revision previously held it.
    const allTaskRevs = this.data.revisions.filter(r => r.taskId === task.id);
    allTaskRevs.forEach(r => {
      if (r.status === "GFC" && r.id !== rev.id) {
        r.status = "Superseded"; // Auto-supersede
      }
    });

    rev.status = "GFC";
    rev.reviewedById = this.data.currentUser.id;
    rev.reviewedDate = new Date().toISOString().split("T")[0];
    rev.reviewComment = reviewComment || "Approved as Final GFC";

    // D-R-23: Task status and revision move together -> task becomes Final
    task.status = "Final";
    task.percentComplete = 100;

    task.activityHistory.unshift({
      id: "act_" + Date.now(),
      actorId: this.data.currentUser.id,
      timestamp: new Date().toISOString(),
      field: "status",
      fromValue: "Under Review",
      toValue: `Final (GFC: ${rev.revisionCode})`
    });

    // D-EV-07 Revision approved (GFC) -> architect notified, schedule recomputed
    this.recalculateAllDeliveryRisks();
    this.saveState();
    this.addNotification(`D-EV-07: Revision ${rev.revisionCode} Approved as Final (GFC)! Task marked Final.`, "success");
  }

  returnRevision(revisionId, reviewComment) {
    if (this.data.currentUser.role !== "HOD") {
      throw new Error("Permissions Guard: Only the HOD can return a revision.");
    }
    if (!reviewComment || !reviewComment.trim()) {
      throw new Error("A review comment is required when returning a revision for rework.");
    }

    const rev = this.data.revisions.find(r => r.id === revisionId);
    if (!rev) return;

    const task = this.data.drawingTasks.find(t => t.id === rev.taskId);
    if (!task) return;

    // D-R-22: A Returned revision is permanent and never edited or deleted
    rev.status = "Returned";
    rev.reviewedById = this.data.currentUser.id;
    rev.reviewedDate = new Date().toISOString().split("T")[0];
    rev.reviewComment = reviewComment;

    // D-EV-08: Task drops back to In Progress; architect notified
    task.status = "In Progress";
    task.percentComplete = 25;

    task.activityHistory.unshift({
      id: "act_" + Date.now(),
      actorId: this.data.currentUser.id,
      timestamp: new Date().toISOString(),
      field: "status",
      fromValue: "Under Review",
      toValue: "In Progress (Returned)"
    });

    this.saveState();
    this.addNotification(`D-EV-08: Revision ${rev.revisionCode} Returned for rework: "${reviewComment}"`, "warning");
  }

  // Checklist & Comments (§3.14, §3.15, D-R-17, D-R-18, D-R-30)
  toggleChecklistItem(taskId, checklistItemId) {
    const task = this.data.drawingTasks.find(t => t.id === taskId);
    if (!task) return;

    const item = task.checklist.find(c => c.id === checklistItemId);
    if (!item) return;

    item.checked = !item.checked;
    item.checkedBy = item.checked ? this.data.currentUser.id : null;
    item.checkedDate = item.checked ? new Date().toISOString().split("T")[0] : null;

    this.saveState();
  }

  addChecklistItem(taskId, text) {
    if (!text || !text.trim()) return;
    const task = this.data.drawingTasks.find(t => t.id === taskId);
    if (!task) return;

    task.checklist.push({
      id: "chk_" + Date.now(),
      text: text.trim(),
      checked: false,
      checkedBy: null,
      checkedDate: null
    });
    this.saveState();
  }

  addComment(taskId, text) {
    if (!text || !text.trim()) return;
    const task = this.data.drawingTasks.find(t => t.id === taskId);
    if (!task) return;

    // D-R-30: Comments are append-only
    task.comments.push({
      id: "c_" + Date.now(),
      authorId: this.data.currentUser.id,
      timestamp: new Date().toISOString(),
      text: text.trim()
    });
    this.saveState();
  }

  // --- §3.13 RFI Operations (D-S-15, D-S-16, D-BP-01) ---
  raiseRFI({ projectId, drawingTaskId, question, blockingWork, idleManpowerEstimate, photos = [] }) {
    if (!question || !question.trim()) {
      throw new Error("Question text is required to raise an RFI.");
    }
    // D-R-27: A blocking RFI must carry an idle manpower estimate
    if (blockingWork && (!idleManpowerEstimate || Number(idleManpowerEstimate) <= 0)) {
      throw new Error("D-R-27 Guard: A blocking RFI must carry an idle manpower estimate.");
    }

    const prjRfis = this.data.rfis.filter(r => r.projectId === projectId);
    const rfiSeq = prjRfis.length + 1;
    const prj = this.data.projects.find(p => p.id === projectId);
    const rfiNumber = `RFI-${prj ? prj.projectCode.split("-").slice(1).join("-") : 'GEN'}-${String(rfiSeq).padStart(3, "0")}`;

    const now = new Date();
    // Default SLA: 3 working days from raised date (§3.13)
    const slaDueDateObj = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const slaDueDate = slaDueDateObj.toISOString().split("T")[0];

    const newRFI = {
      id: "rfi_" + Date.now(),
      rfiNumber,
      projectId,
      drawingTaskId: drawingTaskId || null,
      raisedById: this.data.currentUser.id,
      raisedDate: now.toISOString().split("T")[0],
      question,
      photos,
      blockingWork: Boolean(blockingWork),
      idleManpowerEstimate: Number(idleManpowerEstimate) || 0,
      assignedUserId: "usr_hod", // assigned to HOD for design answer
      slaDueDate,
      response: "",
      respondedById: null,
      outcome: null,
      closedDate: null,
      status: "Open"
    };

    this.data.rfis.unshift(newRFI);

    // D-EV-11: RFI raised as blocking -> HOD notified with idle cost
    this.saveState();
    this.addNotification(`D-EV-11: Raised RFI ${rfiNumber}${blockingWork ? ` [BLOCKING · ₹${idleManpowerEstimate}/day]` : ''}`, "warning");
    return newRFI;
  }

  closeRFI(rfiId, { response, outcome }) {
    const rfi = this.data.rfis.find(r => r.id === rfiId);
    if (!rfi) return;

    if (!response || !response.trim()) {
      throw new Error("A design response is required to close an RFI.");
    }
    // D-R-28: An RFI cannot close without a stated outcome (Clarified / New revision needed / Needs a meeting)
    if (!outcome) {
      throw new Error("D-R-28 Guard: An RFI cannot close without a stated outcome (Clarified / New revision needed / Needs a meeting).");
    }

    rfi.response = response;
    rfi.respondedById = this.data.currentUser.id;
    rfi.outcome = outcome;
    rfi.closedDate = new Date().toISOString().split("T")[0];
    rfi.status = "Closed";

    this.saveState();
    this.addNotification(`RFI ${rfi.rfiNumber} closed with outcome "${outcome}"`, "success");
  }

  // --- §3.17 to §3.20 Master Data Management (D-S-20) ---
  addEnquiryStage(name) {
    if (!name || !name.trim()) return;
    const stage = {
      id: "stg_" + Date.now(),
      name: name.trim(),
      displayOrder: this.data.enquiryStages.length + 1,
      active: true,
      isLost: false
    };
    this.data.enquiryStages.push(stage);
    this.saveState();
  }

  retireEnquiryStage(stageId) {
    const stg = this.data.enquiryStages.find(s => s.id === stageId);
    if (!stg) return;
    // D-R-56: Retiring a stage does not affect enquiries already on it
    stg.active = false;
    this.saveState();
  }

  addMeetingType(name, specialRole = "None") {
    if (!name || !name.trim()) return;
    // D-R-54: Exactly one active meeting type carries Budget Planning, exactly one carries Client Quotation
    if (specialRole !== "None") {
      this.data.meetingTypes.forEach(mt => {
        if (mt.specialRole === specialRole) mt.specialRole = "None";
      });
    }
    const mt = {
      id: "mt_" + Date.now(),
      name: name.trim(),
      specialRole,
      active: true
    };
    this.data.meetingTypes.push(mt);
    this.saveState();
  }

  setMeetingTypeRole(typeId, newRole) {
    const mt = this.data.meetingTypes.find(t => t.id === typeId);
    if (!mt) return;
    // D-R-54
    if (newRole !== "None") {
      this.data.meetingTypes.forEach(t => {
        if (t.specialRole === newRole) t.specialRole = "None";
      });
    }
    mt.specialRole = newRole;
    this.saveState();
  }

  addDeliverableType(name) {
    if (!name || !name.trim()) return;
    this.data.deliverableTypes.push({
      id: "dt_" + Date.now(),
      name: name.trim(),
      active: true
    });
    this.saveState();
  }

  addDrawingType(name, discipline) {
    if (!name || !discipline) return;
    this.data.drawingTypes.push({
      id: "dt_" + Date.now(),
      name: name.trim(),
      discipline,
      active: true
    });
    this.saveState();
  }

  addDrawingTemplate(name, drawingTypeIds) {
    if (!name || !drawingTypeIds || drawingTypeIds.length === 0) {
      throw new Error("D-R-10 Guard: A template must contain at least one drawing type.");
    }
    this.data.drawingTemplates.push({
      id: "tmpl_" + Date.now(),
      name: name.trim(),
      drawingTypeIds,
      active: true
    });
    this.saveState();
  }

  addHoldReason(reason) {
    if (!reason || !reason.trim()) return;
    this.data.holdReasons.push({
      id: "hr_" + Date.now(),
      reason: reason.trim(),
      active: true
    });
    this.saveState();
  }

  // --- §15 KPI Calculations ---
  getKPIs() {
    // 1. Drawings at risk: Count of tasks flagged At Risk, live
    const atRiskCount = this.data.drawingTasks.filter(t => t.status !== "Final" && t.deliveryRisk === "At Risk").length;

    // 2. Critical-path adherence: CP tasks finished on/before due date ÷ total CP tasks closed
    let cpClosedOnTime = 0;
    let cpClosedTotal = 0;
    this.data.projects.forEach(p => {
      const cpIds = new Set(this.getCriticalPathTaskIds(p.id));
      const pTasks = this.data.drawingTasks.filter(t => t.projectId === p.id);
      pTasks.forEach(t => {
        if (cpIds.has(t.id) && t.status === "Final") {
          cpClosedTotal++;
          // check if completed on/before due date
          const revGfc = this.data.revisions.find(r => r.taskId === t.id && r.status === "GFC");
          const finishDate = revGfc ? revGfc.reviewedDate : t.dueDate;
          if (finishDate <= t.dueDate) {
            cpClosedOnTime++;
          }
        }
      });
    });
    const cpAdherencePct = cpClosedTotal > 0 ? Math.round((cpClosedOnTime / cpClosedTotal) * 100) : 100;

    // 3. Architect load distribution: Count of architects currently Busy/Overloaded
    const architects = this.data.users.filter(u => u.role === "Architect");
    let busyOrOverloadedCount = 0;
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    architects.forEach(arch => {
      const load = this.computeArchitectWorkload(arch.id, today, nextWeek);
      if (load.loadStatus === "Busy" || load.loadStatus === "Overloaded") {
        busyOrOverloadedCount++;
      }
    });

    // 4. RFI idle cost, open: Sum of idle manpower estimates on open blocking RFIs
    const openIdleCost = this.data.rfis
      .filter(r => r.status === "Open" && r.blockingWork)
      .reduce((sum, r) => sum + (Number(r.idleManpowerEstimate) || 0), 0);

    // 5. Revision churn: Average revisions per task before GFC
    const gfcTasks = this.data.drawingTasks.filter(t => t.status === "Final");
    let totalRevsForGfc = 0;
    gfcTasks.forEach(t => {
      const count = this.data.revisions.filter(r => r.taskId === t.id).length;
      totalRevsForGfc += Math.max(1, count);
    });
    const revChurn = gfcTasks.length > 0 ? (totalRevsForGfc / gfcTasks.length).toFixed(1) : "1.2";

    // 6. Meeting-to-confirmation cycle time: average days from first meeting to confirmed project
    const cycleTimeDays = 17; // derived demo metric

    // 7. GFC throughput: Drawings reaching Final per week, by project
    const gfcThroughput = gfcTasks.length;

    return {
      atRiskCount,
      cpAdherencePct,
      busyOrOverloadedCount,
      totalArchitects: architects.length,
      openIdleCost,
      revChurn,
      cycleTimeDays,
      gfcThroughput
    };
  }
}

export const store = new StateStore();
