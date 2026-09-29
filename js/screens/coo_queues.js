// Screens D-S-06 (Quotation Review - COO) and D-S-08 (Project Creation Approval - COO)
// Strictly enforces D-R-42, D-R-43, D-R-44, D-EV-15, D-EV-17

import { store } from "../state.js";
import { renderQuotationBadge } from "./enquiries.js";

// D-S-06 Quotation Review (COO Queue)
export function renderQuotationReview(container) {
  const state = store.data;
  const isCOO = state.currentUser.role === "COO";

  // Filter quotations pending COO review
  const pendingEnquiries = state.enquiries.filter(e => e.quotation && e.quotation.status === "Pending COO");
  const otherQuotations = state.enquiries.filter(e => e.quotation && e.quotation.status !== "Pending COO" && e.quotation.status !== "Draft");

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>
          <span>D-S-06 · Quotation Review Queue (COO)</span>
        </h1>
        <p class="page-description">
          COO Gate 1: Commercial pricing control. Approving a quotation unlocks "Send to Client" on D-S-02 (D-R-42). No off-the-record quotes.
        </p>
      </div>
      <div class="page-actions">
        ${!isCOO ? `
          <button class="btn btn-warning btn-sm" id="btn-switch-to-coo">Switch Role to COO to Approve</button>
        ` : `
          <span class="status-badge badge-quot-approved">Logged in as COO (${state.currentUser.name})</span>
        `}
      </div>
    </div>

    ${!isCOO ? `
      <div class="alert-banner warning">
        <strong>Actor Guard (§2, §13):</strong> You are currently viewing as <strong>${state.currentUser.role}</strong>. Only the COO has authority to approve or return quotations at Gate 1.
      </div>
    ` : ''}

    <h2 style="font-family:var(--font-heading); font-size:18px; margin-bottom:14px; color:#ffffff;">
      Pending COO Review (${pendingEnquiries.length})
    </h2>

    <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:36px;">
      ${pendingEnquiries.map(enq => {
        const q = enq.quotation;
        const drafter = state.users.find(u => u.id === q.draftedBy);
        return `
          <div style="background:var(--bg-card); border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:22px; box-shadow:var(--shadow-md);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <div>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
                  <strong style="font-family:var(--font-mono); color:var(--brand-gold); font-size:15px;">${q.quotationNumber}</strong>
                  <span class="status-badge badge-quot-pending">⏳ Pending COO Approval</span>
                  <span style="font-size:12px; color:var(--text-dim);">Linked Enquiry: <a href="#/enquiry/${enq.id}" style="color:#818cf8; text-decoration:underline;">${enq.enquiryNumber}</a></span>
                </div>
                <h3 style="font-size:18px; font-weight:700; color:#ffffff;">${enq.clientName}</h3>
                <p style="font-size:13px; color:var(--text-muted);">${enq.propertyAddress}</p>
              </div>

              <div style="text-align:right;">
                <div style="font-size:11px; text-transform:uppercase; color:var(--text-dim); font-weight:700;">Priced Commercial Value</div>
                <div style="font-family:var(--font-heading); font-size:26px; font-weight:800; color:var(--brand-gold);">
                  ₹${(q.pricedValue || 0).toLocaleString('en-IN')}
                </div>
                <div style="font-size:12px; color:var(--text-dim);">Validity: ${q.validityDays} days</div>
              </div>
            </div>

            <div style="background:var(--bg-input); padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:16px;">
              <strong style="font-size:12.5px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Scope Summary:</strong>
              <p style="font-size:14px; color:var(--text-main); margin-top:4px; line-height:1.5;">${q.scopeSummary}</p>
              <div style="font-size:12px; color:var(--text-dim); margin-top:8px;">Drafted by: ${drafter ? drafter.name : 'HOD'}</div>
            </div>

            <div style="display:flex; justify-content:flex-end; align-items:center; gap:12px;">
              <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/enquiry/${enq.id}'">View Full Enquiry MOMs</button>
              ${isCOO ? `
                <button class="btn btn-danger btn-return-quote" data-enquiry-id="${enq.id}">Return with Comments (D-EV-15)</button>
                <button class="btn btn-success btn-approve-quote" data-enquiry-id="${enq.id}">Approve Quotation (D-EV-15)</button>
              ` : `
                <button class="btn btn-secondary" disabled>COO Approval Required</button>
              `}
            </div>
          </div>
        `;
      }).join("")}

      ${pendingEnquiries.length === 0 ? `
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:40px; text-align:center; color:var(--text-muted);">
          ✓ All quotations reviewed. No quotations currently pending COO approval.
        </div>
      ` : ''}
    </div>

    <!-- Approved / Sent Quotations History -->
    <h2 style="font-family:var(--font-heading); font-size:16px; margin-bottom:12px; color:#ffffff;">
      Reviewed Quotations (${otherQuotations.length})
    </h2>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Quotation #</th>
            <th>Client</th>
            <th>Priced Value</th>
            <th>Status</th>
            <th>COO Approved Date</th>
            <th>Sent Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${otherQuotations.map(enq => `
            <tr>
              <td><strong style="font-family:var(--font-mono); color:var(--brand-gold);">${enq.quotation.quotationNumber}</strong></td>
              <td>${enq.clientName}</td>
              <td>₹${(enq.quotation.pricedValue || 0).toLocaleString('en-IN')}</td>
              <td>${renderQuotationBadge(enq.quotation.status)}</td>
              <td>${enq.quotation.cooApprovedDate || '—'}</td>
              <td>${enq.quotation.sentDate || '—'}</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/enquiry/${enq.id}'">View</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  // Attach actions
  document.getElementById("btn-switch-to-coo")?.addEventListener("click", () => {
    store.switchRole("COO");
    renderQuotationReview(container);
  });

  container.querySelectorAll(".btn-approve-quote").forEach(btn => {
    btn.addEventListener("click", () => {
      const enqId = btn.getAttribute("data-enquiry-id");
      if (confirm("Confirm COO approval of this quotation? This unlocks sending the proposal to client (D-R-42).")) {
        store.approveQuotation(enqId);
        renderQuotationReview(container);
      }
    });
  });

  container.querySelectorAll(".btn-return-quote").forEach(btn => {
    btn.addEventListener("click", () => {
      const enqId = btn.getAttribute("data-enquiry-id");
      const comment = prompt("Enter feedback comments for the HOD to revise quotation:");
      if (comment) {
        store.returnQuotation(enqId, comment);
        renderQuotationReview(container);
      }
    });
  });
}

// D-S-08 Project Creation Approval (COO Queue)
export function renderProjectCreationApproval(container) {
  const state = store.data;
  const isCOO = state.currentUser.role === "COO";

  // Filter projects pending COO creation approval
  const pendingProjects = state.projects.filter(p => p.cooApprovedStatus === "Pending COO");
  const approvedProjects = state.projects.filter(p => p.cooApprovedStatus === "Approved");
  const heldProjects = state.projects.filter(p => p.cooApprovedStatus === "Held");

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>
          <span>D-S-08 · Project Creation Approval (COO)</span>
        </h1>
        <p class="page-description">
          COO Gate 2: Studio Onboarding Authorization. Answers "Can the studio take this project on now?"
          Approving unlocks the drawing board and checklist import (D-R-44, D-EV-17).
        </p>
      </div>
      <div class="page-actions">
        ${!isCOO ? `
          <button class="btn btn-warning btn-sm" id="btn-switch-to-coo-proj">Switch Role to COO</button>
        ` : `
          <span class="status-badge badge-setup-approved">Logged in as COO (${state.currentUser.name})</span>
        `}
      </div>
    </div>

    ${!isCOO ? `
      <div class="alert-banner warning">
        <strong>Actor Guard (§2, §13):</strong> You are currently viewing as <strong>${state.currentUser.role}</strong>. Only the COO has authority to approve project creation and unlock drawing boards.
      </div>
    ` : ''}

    <h2 style="font-family:var(--font-heading); font-size:18px; margin-bottom:14px; color:#ffffff;">
      Pending Studio Creation Approval (${pendingProjects.length})
    </h2>

    <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:36px;">
      ${pendingProjects.map(prj => {
        const tmpl = state.drawingTemplates.find(t => t.id === prj.drawingTemplateId);
        return `
          <div style="background:var(--bg-card); border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:22px; box-shadow:var(--shadow-md);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <div>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
                  <strong style="font-family:var(--font-mono); color:var(--brand-gold); font-size:15px;">${prj.projectCode}</strong>
                  <span class="status-badge badge-setup-pending">⏳ Board Locked (Pending COO)</span>
                  <span style="font-size:12px; color:var(--text-dim);">${prj.projectTypeMasters}</span>
                </div>
                <h3 style="font-size:18px; font-weight:700; color:#ffffff;">${prj.projectName}</h3>
                <p style="font-size:13px; color:var(--text-muted);">Client: <strong>${prj.clientName}</strong></p>
              </div>

              <div style="text-align:right;">
                <div style="font-size:11px; text-transform:uppercase; color:var(--text-dim); font-weight:700;">Contract / Quotation Value</div>
                <div style="font-family:var(--font-heading); font-size:24px; font-weight:800; color:var(--brand-gold);">
                  ₹${(prj.quotationValue || 0).toLocaleString('en-IN')}
                </div>
                <div style="font-size:12px; color:var(--text-dim);">
                  Surveyed Area: <strong>${prj.areaSqM} sq.m</strong> (~${Math.round(prj.areaSqM * 10.764)} sq.ft)
                </div>
              </div>
            </div>

            <div style="background:var(--bg-input); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:12px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Drawing Template Selected (D-R-08):</span>
                <div style="font-weight:600; color:#ffffff;">${tmpl ? tmpl.name : 'None'} (${tmpl && tmpl.drawingTypeIds ? tmpl.drawingTypeIds.length : 0} drawing types ready for import)</div>
              </div>
              <div>
                <span style="font-size:12px; color:var(--text-dim);">Created Date: ${prj.createdDate}</span>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; align-items:center; gap:12px;">
              ${isCOO ? `
                <button class="btn btn-warning btn-hold-project" data-project-id="${prj.id}">Hold Creation</button>
                <button class="btn btn-success btn-approve-project" data-project-id="${prj.id}">Approve Creation & Unlock Board (D-EV-17)</button>
              ` : `
                <button class="btn btn-secondary" disabled>COO Creation Approval Required</button>
              `}
            </div>
          </div>
        `;
      }).join("")}

      ${pendingProjects.length === 0 ? `
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:40px; text-align:center; color:var(--text-muted);">
          ✓ All project creation requests approved. No projects pending onboarding approval.
        </div>
      ` : ''}
    </div>

    <!-- Active Projects Already Approved by COO -->
    <h2 style="font-family:var(--font-heading); font-size:16px; margin-bottom:12px; color:#ffffff;">
      Approved & Unlocked Projects (${approvedProjects.length})
    </h2>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Project Code</th>
            <th>Project Name</th>
            <th>Client</th>
            <th>Area</th>
            <th>Quotation Value</th>
            <th>COO Approved Date</th>
            <th>Board Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${approvedProjects.map(prj => `
            <tr>
              <td><strong style="font-family:var(--font-mono); color:var(--brand-gold);">${prj.projectCode}</strong></td>
              <td><strong>${prj.projectName}</strong></td>
              <td>${prj.clientName}</td>
              <td>${prj.areaSqM} m²</td>
              <td>₹${(prj.quotationValue || 0).toLocaleString('en-IN')}</td>
              <td>${prj.cooApprovedDate}</td>
              <td><span class="status-badge badge-setup-approved">✓ Unlocked</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/drawing-board/${prj.id}'">Open Board (D-S-12)</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  // Attach actions
  document.getElementById("btn-switch-to-coo-proj")?.addEventListener("click", () => {
    store.switchRole("COO");
    renderProjectCreationApproval(container);
  });

  container.querySelectorAll(".btn-approve-project").forEach(btn => {
    btn.addEventListener("click", () => {
      const prjId = btn.getAttribute("data-project-id");
      if (confirm("Confirm COO Project Creation Approval? This unlocks the drawing board, import checklist, and task assignment (D-R-44).")) {
        store.approveProjectCreation(prjId);
        renderProjectCreationApproval(container);
      }
    });
  });

  container.querySelectorAll(".btn-hold-project").forEach(btn => {
    btn.addEventListener("click", () => {
      const prjId = btn.getAttribute("data-project-id");
      const comment = prompt("Enter reason to place project creation on hold:");
      if (comment) {
        store.holdProjectCreation(prjId, comment);
        renderProjectCreationApproval(container);
      }
    });
  });
}
