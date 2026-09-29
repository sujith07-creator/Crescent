// Main Application Router & Shell Controller
// Crescent Design — Design Module (Strictly adhering to detailed.md)

import { store } from "./state.js";
import { renderEnquiryBoard, renderEnquiryDetail } from "./screens/enquiries.js";
import { renderQuotationReview, renderProjectCreationApproval } from "./screens/coo_queues.js";
import { renderProjectsList, renderDrawingBoard, renderProjectTimeline } from "./screens/projects.js";
import { renderRFILog } from "./screens/rfis.js";
import { renderMyTasks, renderProjectDashboard, renderStudioWorkload, renderReportsDashboard } from "./screens/views.js";
import { renderMasterData } from "./screens/master_data.js";

// Global Toast Display
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'danger' ? '✕' : 'ℹ'}</span>
    <div style="flex:1;">${message}</div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(30px)";
    toast.style.transition = "all 200ms ease";
    setTimeout(() => toast.remove(), 200);
  }, 4000);
}

// Router Logic
function router() {
  const hash = window.location.hash || "#/enquiries";
  const contentEl = document.getElementById("main-content");
  const breadcrumbEl = document.getElementById("breadcrumb-current");

  // Update nav item active classes
  document.querySelectorAll(".nav-item").forEach(item => {
    const route = item.getAttribute("data-route");
    if (route === "#/dashboard" && (hash === "#/dashboard" || hash.startsWith("#/project-dashboard"))) {
      item.classList.add("active");
    } else if (hash.startsWith(route)) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Dynamic routing
  if (hash === "#/enquiries" || hash === "#" || hash === "") {
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-01 · Enquiry Board";
    renderEnquiryBoard(contentEl);
  } else if (hash.startsWith("#/enquiry/")) {
    const enqId = hash.replace("#/enquiry/", "");
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-02 · Enquiry Detail";
    renderEnquiryDetail(contentEl, enqId);
  } else if (hash === "#/quotation-reviews") {
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-06 · Quotation Review Queue (COO)";
    renderQuotationReview(contentEl);
  } else if (hash === "#/project-creation-approvals") {
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-08 · Project Creation Approval (COO)";
    renderProjectCreationApproval(contentEl);
  } else if (hash === "#/projects") {
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-09 · Projects";
    renderProjectsList(contentEl);
  } else if (hash.startsWith("#/drawing-board/")) {
    const prjId = hash.replace("#/drawing-board/", "");
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-12 · Drawing Board";
    renderDrawingBoard(contentEl, prjId);
  } else if (hash.startsWith("#/timeline/")) {
    const prjId = hash.replace("#/timeline/", "");
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-14 · Project Timeline & Gantt";
    renderProjectTimeline(contentEl, prjId);
  } else if (hash === "#/dashboard" || hash.startsWith("#/project-dashboard/")) {
    const prjId = hash.startsWith("#/project-dashboard/") 
      ? hash.replace("#/project-dashboard/", "") 
      : (store.data.projects[0] ? store.data.projects[0].id : null);
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-18 · Project Dashboard";
    renderProjectDashboard(contentEl, prjId);
  } else if (hash === "#/rfis") {
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-15 · RFI Log";
    renderRFILog(contentEl);
  } else if (hash === "#/my-tasks") {
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-17 · My Tasks";
    renderMyTasks(contentEl);
  } else if (hash === "#/studio-workload") {
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-19 · Studio Workload";
    renderStudioWorkload(contentEl);
  } else if (hash === "#/reports") {
    if (breadcrumbEl) breadcrumbEl.textContent = "§15 · Reports & KPIs";
    renderReportsDashboard(contentEl);
  } else if (hash.startsWith("#/master-data")) {
    if (breadcrumbEl) breadcrumbEl.textContent = "D-S-20 · Manage Master Data";
    const urlParams = new URLSearchParams(hash.split("?")[1] || "");
    const tab = urlParams.get("tab") || "drawingTypes";
    renderMasterData(contentEl, tab);
  } else {
    window.location.hash = "#/enquiries";
  }

  updateHeaderWidgets();
}

// Update "Their One Number" and Profile widgets (§2)
function updateHeaderWidgets() {
  const user = store.getCurrentUser();
  const oneNum = store.getActorOneNumber(user.role);

  // Update role buttons
  document.querySelectorAll(".role-btn[data-role]").forEach(btn => {
    if (btn.getAttribute("data-role") === user.role) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Actor One Number Widget
  const numValEl = document.getElementById("one-number-val");
  const numLabelEl = document.getElementById("one-number-label");
  const numSubtextEl = document.getElementById("one-number-subtext");

  if (numValEl) numValEl.textContent = oneNum.number;
  if (numLabelEl) numLabelEl.textContent = oneNum.label;
  if (numSubtextEl) numSubtextEl.textContent = oneNum.subtext;

  // Profile badge
  const userAvatar = document.getElementById("user-avatar-initial");
  const userName = document.getElementById("user-display-name");
  const userRole = document.getElementById("user-display-role");

  if (userAvatar) userAvatar.textContent = user.name.charAt(0);
  if (userName) userName.textContent = user.name;
  if (userRole) userRole.textContent = `${user.role} · ${user.title}`;

  // Update Badges on Sidebar
  const state = store.data;
  const pendingQuotes = state.enquiries.filter(e => e.quotation && e.quotation.status === "Pending COO").length;
  const pendingPrjs = state.projects.filter(p => p.cooApprovedStatus === "Pending COO").length;
  const atRiskCount = state.drawingTasks.filter(t => t.status !== "Final" && t.deliveryRisk === "At Risk").length;
  const openRfis = state.rfis.filter(r => r.status === "Open").length;

  const quoteBadge = document.getElementById("nav-badge-quotes");
  const prjApprBadge = document.getElementById("nav-badge-prjs");
  const riskBadge = document.getElementById("nav-badge-risk");
  const rfiBadge = document.getElementById("nav-badge-rfis");

  if (quoteBadge) quoteBadge.textContent = pendingQuotes > 0 ? pendingQuotes : '';
  if (prjApprBadge) prjApprBadge.textContent = pendingPrjs > 0 ? pendingPrjs : '';
  if (riskBadge) riskBadge.textContent = atRiskCount > 0 ? atRiskCount : '';
  if (rfiBadge) rfiBadge.textContent = openRfis > 0 ? openRfis : '';
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
  // Listen for state changes
  store.subscribe((state) => {
    updateHeaderWidgets();
  });

  // Notifications handler
  let lastNotifCount = store.notifications.length;
  setInterval(() => {
    if (store.notifications.length > lastNotifCount) {
      const newNotif = store.notifications[0];
      showToast(newNotif.message, newNotif.type);
      lastNotifCount = store.notifications.length;
    }
  }, 300);

  // Role Switcher buttons
  document.querySelectorAll(".role-btn[data-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      const role = btn.getAttribute("data-role");
      store.switchRole(role);
      router();
    });
  });

  // Nav link clicks
  document.querySelectorAll(".nav-item[data-route]").forEach(item => {
    item.addEventListener("click", () => {
      const route = item.getAttribute("data-route");
      window.location.hash = route;
    });
  });

  // Reset Data to seed
  document.getElementById("btn-reset-seed")?.addEventListener("click", () => {
    if (confirm("Reset all project, enquiry, and drawing state back to initial seed data from detailed.md?")) {
      store.resetToDefault();
      showToast("Reset state to seed data (Appendix A & B)", "info");
      router();
    }
  });

  // Hash change
  window.addEventListener("hashchange", router);

  // Initial render
  router();
});
