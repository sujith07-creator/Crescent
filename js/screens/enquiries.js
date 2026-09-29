// Screens D-S-01 (Enquiry Board), D-S-02 (Enquiry Detail),
// D-S-03 (Meeting MOM), D-S-04 (Site Measurement), D-S-05 (Deliverable), D-S-07 (Confirmation Gate)

import { store } from "../state.js";

export function renderEnquiryBoard(container, options = {}) {
  const state = store.data;
  const isListView = options.listView || false;

  const activeStages = state.enquiryStages
    .filter(s => s.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>
          <span>D-S-01 · Enquiry Board</span>
        </h1>
        <p class="page-description">Pre-project client journey tracked across HOD-configurable stages. Status badges are derived and independent of stages.</p>
      </div>
      <div class="page-actions">
        <div class="role-switcher-container">
          <button class="role-btn ${!isListView ? 'active' : ''}" id="toggle-board-view">Board View</button>
          <button class="role-btn ${isListView ? 'active' : ''}" id="toggle-list-view">List View</button>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-board-settings">
          ⚙️ Board Columns
        </button>
        <button class="btn btn-primary" id="btn-new-enquiry">
          + New Enquiry
        </button>
      </div>
    </div>

    ${!isListView ? `
      <div class="kanban-board-container" id="enquiry-kanban">
        ${activeStages.map(stage => {
          const stageEnquiries = state.enquiries.filter(e => e.stageId === stage.id);
          return `
            <div class="kanban-column" data-stage-id="${stage.id}">
              <div class="kanban-column-header">
                <div class="column-title-group">
                  <span class="column-title">${stage.name}</span>
                  <span class="column-count">${stageEnquiries.length}</span>
                </div>
              </div>
              <div class="kanban-column-body">
                ${stageEnquiries.map(enq => renderEnquiryCard(enq, state)).join("")}
                ${stageEnquiries.length === 0 ? `<div style="text-align:center; padding:30px 10px; color:var(--text-dim); font-size:12px;">No enquiries in this stage</div>` : ''}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    ` : `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Enquiry #</th>
              <th>Client</th>
              <th>Property / Scope</th>
              <th>Assigned Architect</th>
              <th>Stage (Configurable)</th>
              <th>Quotation Status</th>
              <th>Confirmation Gate</th>
              <th>Project Setup</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.enquiries.map(enq => {
              const stage = state.enquiryStages.find(s => s.id === enq.stageId);
              const architect = state.users.find(u => u.id === enq.assignedUserId);
              return `
                <tr>
                  <td><strong style="font-family:var(--font-mono); color:var(--brand-gold);">${enq.enquiryNumber}</strong></td>
                  <td><strong>${enq.clientName}</strong></td>
                  <td><span style="font-size:12px; color:var(--text-muted);">${enq.engagementType}</span></td>
                  <td>${architect ? architect.name : 'Unassigned'}</td>
                  <td><span class="status-badge" style="background:var(--bg-elevated);">${stage ? stage.name : '—'}</span></td>
                  <td>${renderQuotationBadge(enq.quotation ? enq.quotation.status : 'None')}</td>
                  <td>${renderConfirmationBadge(enq.confirmationGate.status)}</td>
                  <td>${renderProjectSetupBadge(enq.projectSetup.status)}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/enquiry/${enq.id}'">Open D-S-02</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `}
  `;

  // Attach handlers
  document.getElementById("toggle-board-view")?.addEventListener("click", () => renderEnquiryBoard(container, { listView: false }));
  document.getElementById("toggle-list-view")?.addEventListener("click", () => renderEnquiryBoard(container, { listView: true }));
  document.getElementById("btn-new-enquiry")?.addEventListener("click", openNewEnquiryModal);
  document.getElementById("btn-board-settings")?.addEventListener("click", () => {
    window.location.hash = "#/master-data?tab=enquiryStages";
  });

  // Card click navigation
  container.querySelectorAll(".kanban-card[data-enquiry-id]").forEach(card => {
    card.addEventListener("click", (e) => {
      // Don't trigger if clicked on a direct select dropdown
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
      const enqId = card.getAttribute("data-enquiry-id");
      window.location.hash = `#/enquiry/${enqId}`;
    });
  });

  // Stage change select
  container.querySelectorAll(".stage-quick-select").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const enqId = sel.getAttribute("data-enquiry-id");
      const targetStageId = sel.value;
      const targetStage = state.enquiryStages.find(s => s.id === targetStageId);
      if (targetStage && targetStage.isLost) {
        const reason = prompt("D-R-01 Guard: Please record the lost reason for this enquiry:");
        if (!reason) {
          sel.value = sel.getAttribute("data-current-stage");
          return;
        }
        try {
          store.updateEnquiryStage(enqId, targetStageId, reason);
        } catch (err) {
          alert(err.message);
        }
      } else {
        store.updateEnquiryStage(enqId, targetStageId);
      }
    });
  });
}

function renderEnquiryCard(enq, state) {
  const architect = state.users.find(u => u.id === enq.assignedUserId);
  const nextMeeting = state.meetings
    .filter(m => m.enquiryId === enq.id && (m.status === 'Scheduled' || m.status === 'Minutes drafted'))
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];

  const mType = nextMeeting ? state.meetingTypes.find(t => t.id === nextMeeting.typeId) : null;

  return `
    <div class="kanban-card" data-enquiry-id="${enq.id}">
      <div class="card-top-row">
        <span style="font-family:var(--font-mono); font-size:11.5px; font-weight:700; color:var(--brand-gold);">${enq.enquiryNumber}</span>
        <select class="stage-quick-select" data-enquiry-id="${enq.id}" data-current-stage="${enq.stageId}" style="font-size:11px; padding:2px 6px;">
          ${state.enquiryStages.filter(s => s.active).map(s => `
            <option value="${s.id}" ${s.id === enq.stageId ? 'selected' : ''}>${s.name}</option>
          `).join("")}
        </select>
      </div>

      <div class="card-title">${enq.clientName}</div>
      <div class="card-subtitle">${enq.propertyAddress}</div>

      <div style="font-size:11.5px; color:var(--text-dim); margin-bottom:8px;">
        ${nextMeeting ? `📅 Next: <strong>Meeting #${nextMeeting.meetingNumber}</strong> (${mType ? mType.name : 'Meeting'}) on ${nextMeeting.startTime.replace("T", " ")}` : '📅 No upcoming meetings'}
      </div>

      <!-- §3.1 Always-Visible Status Badges (Derived, Independent of Stage - D-R-55) -->
      <div class="card-badges-row">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:10.5px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Quotation:</span>
          ${renderQuotationBadge(enq.quotation ? enq.quotation.status : 'None')}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:10.5px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Confirmation:</span>
          ${renderConfirmationBadge(enq.confirmationGate.status)}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:10.5px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Project Setup:</span>
          ${renderProjectSetupBadge(enq.projectSetup.status)}
        </div>
      </div>

      <div class="card-meta-footer">
        <div class="card-assignee">
          <span>👤 ${architect ? architect.name.split(" ")[1] || architect.name : 'Unassigned'}</span>
        </div>
        <span style="color:var(--primary); font-weight:600;">View Detail →</span>
      </div>
    </div>
  `;
}

export function renderQuotationBadge(status) {
  if (status === "Pending COO") return `<span class="status-badge badge-quot-pending">⏳ Pending COO</span>`;
  if (status === "Approved") return `<span class="status-badge badge-quot-approved">✓ Approved</span>`;
  if (status === "Sent") return `<span class="status-badge badge-quot-sent">✉ Sent to Client</span>`;
  if (status === "Signed") return `<span class="status-badge badge-quot-signed">★ Signed Proposal</span>`;
  if (status === "Draft") return `<span class="status-badge badge-quot-draft">Draft</span>`;
  return `<span class="status-badge badge-quot-draft">None</span>`;
}

export function renderConfirmationBadge(status) {
  if (status === "Passed") return `<span class="status-badge badge-conf-passed">✓ Passed</span>`;
  if (status === "Pending") return `<span class="status-badge badge-conf-pending">⏳ Pending Checks</span>`;
  return `<span class="status-badge badge-conf-notstarted">Not started</span>`;
}

export function renderProjectSetupBadge(status) {
  if (status === "Approved") return `<span class="status-badge badge-setup-approved">✓ Approved</span>`;
  if (status === "Pending COO") return `<span class="status-badge badge-setup-pending">⏳ Pending COO</span>`;
  return `<span class="status-badge badge-setup-na">N/A</span>`;
}

// D-S-02 Enquiry Detail Screen
export function renderEnquiryDetail(container, enquiryId) {
  const state = store.data;
  const enq = state.enquiries.find(e => e.id === enquiryId);
  if (!enq) {
    container.innerHTML = `<div class="page-container"><p>Enquiry not found.</p></div>`;
    return;
  }

  const architect = state.users.find(u => u.id === enq.assignedUserId);
  const stage = state.enquiryStages.find(s => s.id === enq.stageId);

  // Gather chronological stream of events: meetings, measurements, deliverables, quotation
  const streamItems = [];

  // Meetings
  state.meetings.filter(m => m.enquiryId === enq.id).forEach(m => {
    const mType = state.meetingTypes.find(t => t.id === m.typeId);
    streamItems.push({
      type: "meeting",
      date: m.startTime,
      sortDate: new Date(m.startTime).getTime(),
      title: `Meeting #${m.meetingNumber} — ${mType ? mType.name : 'Meeting'}`,
      data: m,
      badge: m.status
    });
  });

  // Measurements
  state.measurements.filter(m => m.enquiryId === enq.id).forEach(meas => {
    streamItems.push({
      type: "measurement",
      date: meas.measuredDate,
      sortDate: new Date(meas.measuredDate).getTime(),
      title: `Site Measurement Survey (${meas.totalAreaSqM} sq.m / ~${Math.round(meas.totalAreaSqM * 10.764)} sq.ft)`,
      data: meas,
      badge: "Measured"
    });
  });

  // Deliverables
  state.deliverables.filter(d => d.enquiryId === enq.id).forEach(deliv => {
    const dType = state.deliverableTypes.find(t => t.id === deliv.deliverableTypeId);
    streamItems.push({
      type: "deliverable",
      date: deliv.createdDate,
      sortDate: new Date(deliv.createdDate).getTime(),
      title: `${dType ? dType.name : 'Deliverable'} v${deliv.versionNumber} — ${deliv.title}`,
      data: deliv,
      badge: deliv.clientResponse || (deliv.presentedAtMeetingId ? "Presented (Pending Response)" : "Drafted")
    });
  });

  // Quotation
  if (enq.quotation) {
    streamItems.push({
      type: "quotation",
      date: enq.quotation.sentDate || enq.createdDate,
      sortDate: new Date(enq.quotation.sentDate || enq.createdDate).getTime(),
      title: `Quotation ${enq.quotation.quotationNumber} (₹${(enq.quotation.pricedValue || 0).toLocaleString('en-IN')})`,
      data: enq.quotation,
      badge: enq.quotation.status
    });
  }

  // Sort chronological
  streamItems.sort((a, b) => b.sortDate - a.sortDate);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
          <a href="#/enquiries" class="btn btn-secondary btn-sm">← Back to Board</a>
          <span style="font-family:var(--font-mono); color:var(--brand-gold); font-weight:700;">${enq.enquiryNumber}</span>
          <span class="status-badge" style="background:var(--bg-elevated);">${stage ? stage.name : ''}</span>
        </div>
        <h1>${enq.clientName}</h1>
        <p class="page-description">${enq.propertyAddress} · ${enq.engagementType}</p>
      </div>

      <div class="page-actions">
        <button class="btn btn-secondary" id="btn-schedule-meeting">+ Schedule Meeting</button>
        <button class="btn btn-secondary" id="btn-add-measurement">+ Site Measurement</button>
        <button class="btn btn-secondary" id="btn-upload-deliverable">+ Upload Deliverable</button>
      </div>
    </div>

    <!-- §14 D-S-02: Three Status Badges Pinned At The Top -->
    <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:18px 24px; margin-bottom:28px; display:flex; justify-content:space-around; align-items:center; flex-wrap:wrap; gap:20px;">
      <div style="display:flex; flex-direction:column; gap:6px;">
        <span style="font-size:11px; text-transform:uppercase; color:var(--text-dim); font-weight:700;">1. Quotation Status</span>
        <div style="display:flex; align-items:center; gap:10px;">
          ${renderQuotationBadge(enq.quotation ? enq.quotation.status : 'None')}
          <button class="btn btn-outline btn-sm" id="btn-manage-quotation">Manage Quote</button>
        </div>
      </div>

      <div style="height:40px; width:1px; background:var(--border-subtle);"></div>

      <div style="display:flex; flex-direction:column; gap:6px;">
        <span style="font-size:11px; text-transform:uppercase; color:var(--text-dim); font-weight:700;">2. Confirmation Gate (§3.5, D-R-07)</span>
        <div style="display:flex; align-items:center; gap:10px;">
          ${renderConfirmationBadge(enq.confirmationGate.status)}
          <button class="btn btn-outline btn-sm" id="btn-open-conf-gate">Open Gate D-S-07</button>
        </div>
      </div>

      <div style="height:40px; width:1px; background:var(--border-subtle);"></div>

      <div style="display:flex; flex-direction:column; gap:6px;">
        <span style="font-size:11px; text-transform:uppercase; color:var(--text-dim); font-weight:700;">3. Project Setup Status (§3.6, D-R-44)</span>
        <div style="display:flex; align-items:center; gap:10px;">
          ${renderProjectSetupBadge(enq.projectSetup.status)}
          ${enq.confirmationGate.status === "Passed" && enq.projectSetup.status === "N/A" ? `
            <button class="btn btn-primary btn-sm" id="btn-initiate-project">Create Project</button>
          ` : ''}
          ${enq.projectSetup.projectId ? `
            <button class="btn btn-outline btn-sm" onclick="window.location.hash='#/drawing-board/${enq.projectSetup.projectId}'">Go To Project</button>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Mixed Chronological Timeline (§14 D-S-02) -->
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:28px;">
      <div>
        <h2 style="font-family:var(--font-heading); font-size:18px; margin-bottom:16px;">
          Chronological Engagement Timeline
        </h2>
        <div class="timeline-stream">
          ${streamItems.map(item => `
            <div class="timeline-event-item">
              <div class="timeline-event-dot">
                ${item.type === 'meeting' ? '📅' : item.type === 'measurement' ? '📐' : item.type === 'deliverable' ? '🎨' : '📄'}
              </div>
              <div class="timeline-event-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                  <strong style="color:#ffffff; font-size:14px;">${item.title}</strong>
                  <span class="status-badge" style="background:var(--bg-elevated);">${item.badge}</span>
                </div>
                <div style="font-size:12px; color:var(--text-dim); margin-bottom:8px;">Date: ${item.date}</div>

                ${renderTimelineItemContent(item)}
              </div>
            </div>
          `).join("")}
          ${streamItems.length === 0 ? `<p style="color:var(--text-muted);">No recorded meetings or deliverables yet. Use the actions above to schedule a meeting or upload a deliverable.</p>` : ''}
        </div>
      </div>

      <!-- Sidebar Info -->
      <div>
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:20px; margin-bottom:20px;">
          <h3 style="font-size:14px; font-weight:700; color:#ffffff; margin-bottom:12px;">Enquiry Master Details</h3>
          <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
            <div>
              <span style="color:var(--text-dim);">Client Contact:</span>
              <div>${enq.clientContact}</div>
            </div>
            <div>
              <span style="color:var(--text-dim);">Lead Architect:</span>
              <div>${architect ? architect.name : 'Unassigned'}</div>
            </div>
            <div>
              <span style="color:var(--text-dim);">Created Date:</span>
              <div>${enq.createdDate}</div>
            </div>
            ${enq.lostReason ? `
              <div class="alert-banner danger" style="margin-top:10px;">
                <strong>Lost Reason:</strong> ${enq.lostReason}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach buttons
  document.getElementById("btn-schedule-meeting")?.addEventListener("click", () => openMeetingModal({ enquiryId: enq.id }));
  document.getElementById("btn-add-measurement")?.addEventListener("click", () => openSiteMeasurementModal({ enquiryId: enq.id }));
  document.getElementById("btn-upload-deliverable")?.addEventListener("click", () => openDeliverableModal({ enquiryId: enq.id }));
  document.getElementById("btn-manage-quotation")?.addEventListener("click", () => openQuotationModal(enq));
  document.getElementById("btn-open-conf-gate")?.addEventListener("click", () => openConfirmationGateModal(enq));
  document.getElementById("btn-initiate-project")?.addEventListener("click", () => openInitiateProjectModal(enq));

  // Edit meeting triggers
  container.querySelectorAll(".btn-edit-meeting").forEach(btn => {
    btn.addEventListener("click", () => {
      const mtgId = btn.getAttribute("data-meeting-id");
      const mtg = state.meetings.find(m => m.id === mtgId);
      if (mtg) openMeetingModal(mtg);
    });
  });

  // Reschedule meeting triggers
  container.querySelectorAll(".btn-reschedule-meeting").forEach(btn => {
    btn.addEventListener("click", () => {
      const mtgId = btn.getAttribute("data-meeting-id");
      const mtg = state.meetings.find(m => m.id === mtgId);
      if (mtg) openRescheduleModal(mtg);
    });
  });

  // Client response triggers
  container.querySelectorAll(".btn-record-deliv-response").forEach(btn => {
    btn.addEventListener("click", () => {
      const delivId = btn.getAttribute("data-deliv-id");
      const deliv = state.deliverables.find(d => d.id === delivId);
      if (deliv) openDeliverableModal(deliv);
    });
  });
}

function renderTimelineItemContent(item) {
  if (item.type === 'meeting') {
    const m = item.data;
    return `
      <div style="font-size:13px; color:var(--text-muted); margin-bottom:8px;">
        <strong>Agenda:</strong> ${m.agenda || 'N/A'}<br>
        ${m.minutesText ? `<strong>Minutes:</strong> ${m.minutesText}<br>` : ''}
        ${m.decisions ? `<strong>Decisions:</strong> ${m.decisions}<br>` : ''}
        ${m.scopeImpact ? `<span style="color:var(--color-danger); font-weight:700;">⚠ Scope Impact Flagged: ₹${(m.commercialImpactAmount || 0).toLocaleString('en-IN')}</span><br>` : ''}
        ${m.actionItems && m.actionItems.length > 0 ? `
          <div style="margin-top:6px; background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:4px;">
            <strong>Action Items (${m.actionItems.length}):</strong>
            <ul style="margin-left:18px; margin-top:4px;">
              ${m.actionItems.map(a => `<li>${a.text} (Owner: ${a.ownerId}, Due: ${a.dueDate}) [${a.status}]</li>`).join("")}
            </ul>
          </div>
        ` : ''}
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-secondary btn-sm btn-edit-meeting" data-meeting-id="${m.id}">Edit / Minutes MOM</button>
        ${m.status === 'Scheduled' ? `
          <button class="btn btn-outline btn-sm btn-reschedule-meeting" data-meeting-id="${m.id}">Reschedule (D-R-48)</button>
        ` : ''}
      </div>
    `;
  }
  if (item.type === 'measurement') {
    const meas = item.data;
    return `
      <div style="font-size:13px; color:var(--text-muted);">
        <p>${meas.rooms ? meas.rooms.length : 0} rooms surveyed. Total Area: <strong>${meas.totalAreaSqM} sq.m</strong></p>
        <p style="margin-top:4px; font-style:italic;">"${meas.siteConditionNotes || 'No notes'}"</p>
      </div>
    `;
  }
  if (item.type === 'deliverable') {
    const deliv = item.data;
    return `
      <div style="font-size:13px; color:var(--text-muted);">
        <p>Files: <strong>${deliv.files ? deliv.files.join(", ") : 'None'}</strong></p>
        ${deliv.clientComments ? `<p style="margin-top:4px;">Client Feedback: <em>"${deliv.clientComments}"</em></p>` : ''}
        <button class="btn btn-outline btn-sm btn-record-deliv-response" data-deliv-id="${deliv.id}" style="margin-top:8px;">
          ${deliv.clientResponse ? 'Update Feedback' : 'Record Client Feedback'}
        </button>
      </div>
    `;
  }
  if (item.type === 'quotation') {
    const q = item.data;
    return `
      <div style="font-size:13px; color:var(--text-muted);">
        <p><strong>Scope:</strong> ${q.scopeSummary}</p>
        <p><strong>Priced Value:</strong> ₹${(q.pricedValue || 0).toLocaleString('en-IN')} (Validity: ${q.validityDays} days)</p>
        ${q.cooApprovedDate ? `<p style="color:var(--color-success);">✓ COO Approved on ${q.cooApprovedDate}</p>` : ''}
      </div>
    `;
  }
  return '';
}

// ==========================================
// MODALS FOR ENQUIRY JOURNEY
// ==========================================

export function openNewEnquiryModal() {
  const modalRoot = document.getElementById("modal-root");
  const architects = store.data.users.filter(u => u.role === "Architect" || u.role === "HOD");

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">+ New Client Enquiry</div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="new-enquiry-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Client Name <span class="required">*</span></label>
              <input type="text" id="enq-client-name" placeholder="e.g. Vikram & Radhika Birla" required>
            </div>
            <div class="form-group">
              <label class="form-label">Client Contact Details <span class="required">*</span></label>
              <input type="text" id="enq-client-contact" placeholder="+91 98... · email@client.com" required>
            </div>
            <div class="form-group">
              <label class="form-label">Property Address / Location <span class="required">*</span></label>
              <input type="text" id="enq-property-address" placeholder="e.g. Plot 42, Mandwa Coastal Road, Alibaug" required>
            </div>
            <div class="form-group">
              <label class="form-label">Engagement Type Sought</label>
              <input type="text" id="enq-engagement-type" placeholder="e.g. Turnkey Architecture & Interior Design">
            </div>
            <div class="form-group">
              <label class="form-label">Assigned Architect / Lead</label>
              <select id="enq-assigned-user">
                ${architects.map(a => `<option value="${a.id}">${a.name} (${a.title})</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Enquiry</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("new-enquiry-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    store.createEnquiry({
      clientName: document.getElementById("enq-client-name").value,
      clientContact: document.getElementById("enq-client-contact").value,
      propertyAddress: document.getElementById("enq-property-address").value,
      engagementType: document.getElementById("enq-engagement-type").value,
      assignedUserId: document.getElementById("enq-assigned-user").value
    });
    modalRoot.innerHTML = "";
    window.location.hash = "#/enquiries";
  });
}

// §14 D-S-03 Meeting / MOM Editor Modal
export function openMeetingModal(initialData = {}) {
  const modalRoot = document.getElementById("modal-root");
  const state = store.data;
  const isEdit = Boolean(initialData.id);

  const meetingTypes = state.meetingTypes.filter(t => t.active);
  const internalUsers = state.users;
  const deliverables = state.deliverables.filter(d => d.enquiryId === initialData.enquiryId);
  const enq = state.enquiries.find(e => e.id === initialData.enquiryId);

  const defaultTypeId = initialData.typeId || (meetingTypes[0] ? meetingTypes[0].id : "");
  const selectedType = meetingTypes.find(t => t.id === defaultTypeId);

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div class="modal-title">
            D-S-03 · ${isEdit ? `Meeting #${initialData.meetingNumber} MOM Editor` : 'Schedule Meeting'}
          </div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="meeting-editor-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Meeting Type (from Master D-S-20) <span class="required">*</span></label>
                <select id="mtg-type-id" required>
                  ${meetingTypes.map(t => `
                    <option value="${t.id}" ${t.id === defaultTypeId ? 'selected' : ''}>
                      ${t.name} ${t.specialRole !== 'None' ? `[Special Role: ${t.specialRole}]` : ''}
                    </option>
                  `).join("")}
                </select>
                <span class="form-help">D-R-49: Non-flagged meeting types may be used any number of times in any sequence.</span>
              </div>

              <div class="form-group">
                <label class="form-label">Mode</label>
                <select id="mtg-mode">
                  <option value="Office" ${initialData.mode === 'Office' ? 'selected' : ''}>Office</option>
                  <option value="Site" ${initialData.mode === 'Site' ? 'selected' : ''}>Site</option>
                  <option value="Video" ${initialData.mode === 'Video' ? 'selected' : ''}>Video Conference</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Start Time <span class="required">*</span></label>
                <input type="datetime-local" id="mtg-start" value="${initialData.startTime || '2026-09-28T10:00'}" required>
              </div>

              <div class="form-group">
                <label class="form-label">End Time <span class="required">*</span></label>
                <input type="datetime-local" id="mtg-end" value="${initialData.endTime || '2026-09-28T11:30'}" required>
              </div>
            </div>

            <!-- D-R-47: Mandatory Internal User Invitees (at least one required) -->
            <div class="form-group">
              <label class="form-label">Invited Internal Users <span class="required">* (D-R-47: At least one required)</span></label>
              <div style="display:flex; flex-wrap:wrap; gap:10px; background:var(--bg-input); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                ${internalUsers.map(u => {
                  const isChecked = (initialData.invitedUserIds || [state.currentUser.id]).includes(u.id);
                  return `
                    <label style="display:flex; align-items:center; gap:6px; font-size:12.5px; cursor:pointer;">
                      <input type="checkbox" name="invited_users" value="${u.id}" ${isChecked ? 'checked' : ''}>
                      <span>${u.name} (${u.role})</span>
                    </label>
                  `;
                }).join("")}
              </div>
              <span class="form-help">Triggers D-BP-06 calendar blocks, notifications and Zoho sync for each invitee.</span>
            </div>

            <!-- Optional Linked Deliverables (D-R-52) -->
            <div class="form-group">
              <label class="form-label">Linked Deliverables (Optional — any deliverable to any meeting)</label>
              <select id="mtg-linked-delivs" multiple style="height:70px;">
                ${deliverables.map(d => `
                  <option value="${d.id}" ${(initialData.linkedDeliverableIds || []).includes(d.id) ? 'selected' : ''}>
                    ${d.title} (v${d.versionNumber})
                  </option>
                `).join("")}
              </select>
            </div>

            <!-- Special Role Panel: Budget Planning or Client Quotation (§3.18, D-R-46) -->
            <div id="special-role-panel" style="display:${selectedType && selectedType.specialRole !== 'None' ? 'block' : 'none'}; background:rgba(99, 102, 241, 0.1); border:1px solid rgba(99, 102, 241, 0.3); border-radius:var(--radius-sm); padding:14px; margin-bottom:16px;">
              <h4 style="color:#ffffff; font-size:13px; font-weight:700; margin-bottom:8px;">
                Special Role Behavior: <span id="special-role-name">${selectedType ? selectedType.specialRole : ''}</span>
              </h4>
              <div class="form-group">
                <label class="form-label">Linked Quotation</label>
                <input type="text" id="mtg-linked-quote" value="${initialData.linkedQuotationNumber || (enq && enq.quotation ? enq.quotation.quotationNumber : '')}" placeholder="e.g. QT-2026-019">
              </div>

              ${selectedType && selectedType.specialRole === 'Budget Planning' ? `
                <div class="form-group">
                  <label class="form-label">COO Approval Decision (D-R-46)</label>
                  <select id="mtg-coo-decision">
                    <option value="">-- No Decision Yet --</option>
                    <option value="Approved" ${initialData.decision === 'Approved' ? 'selected' : ''}>Approved (Sets COO Quotation Approval)</option>
                    <option value="Returned" ${initialData.decision === 'Returned' ? 'selected' : ''}>Returned (Revises draft)</option>
                  </select>
                </div>
              ` : ''}
            </div>

            <div class="form-group">
              <label class="form-label">Agenda</label>
              <textarea id="mtg-agenda" rows="2">${initialData.agenda || ''}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Minutes Text (MOM)</label>
              <textarea id="mtg-minutes" rows="3" placeholder="Key topics and discussion points...">${initialData.minutesText || ''}</textarea>
              <span class="form-help">D-R-05: Sent minutes are immutable.</span>
            </div>

            <div class="form-group">
              <label class="form-label">Key Decisions</label>
              <textarea id="mtg-decisions" rows="2">${initialData.decisions || ''}</textarea>
            </div>

            <!-- Scope Impact Guard (D-R-03) -->
            <div style="background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:14px; margin-bottom:16px;">
              <label style="display:flex; align-items:center; gap:8px; font-weight:700; color:#ffffff; cursor:pointer;">
                <input type="checkbox" id="mtg-scope-impact" ${initialData.scopeImpact ? 'checked' : ''}>
                <span>Flag Scope Impact (D-R-03 Guard)</span>
              </label>
              <div id="scope-impact-amount-group" style="display:${initialData.scopeImpact ? 'block' : 'none'}; margin-top:10px;">
                <label class="form-label">Commercial Impact Amount (₹) <span class="required">* (Mandatory if scope impact flagged)</span></label>
                <input type="number" id="mtg-commercial-amount" value="${initialData.commercialImpactAmount || ''}" placeholder="e.g. 350000">
                <span class="form-help" style="color:var(--color-danger);">D-R-03: Meeting close is blocked if scope-impact is flagged without a commercial value.</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="mtg-status">
                <option value="Scheduled" ${initialData.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                <option value="Held" ${initialData.status === 'Held' ? 'selected' : ''}>Held</option>
                <option value="Minutes drafted" ${initialData.status === 'Minutes drafted' ? 'selected' : ''}>Minutes drafted</option>
                <option value="Sent" ${initialData.status === 'Sent' ? 'selected' : ''}>Sent</option>
                <option value="Closed" ${initialData.status === 'Closed' ? 'selected' : ''}>Closed (Guards enforced)</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Meeting</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Dynamic Type switcher
  document.getElementById("mtg-type-id")?.addEventListener("change", (e) => {
    const t = meetingTypes.find(type => type.id === e.target.value);
    const panel = document.getElementById("special-role-panel");
    const roleName = document.getElementById("special-role-name");
    if (t && t.specialRole !== "None") {
      panel.style.display = "block";
      roleName.textContent = t.specialRole;
    } else {
      panel.style.display = "none";
    }
  });

  // Scope impact toggle
  document.getElementById("mtg-scope-impact")?.addEventListener("change", (e) => {
    document.getElementById("scope-impact-amount-group").style.display = e.target.checked ? "block" : "none";
  });

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");

  document.getElementById("meeting-editor-form")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const checkedInvitees = Array.from(document.querySelectorAll('input[name="invited_users"]:checked')).map(el => el.value);

    // Guard D-R-47
    if (checkedInvitees.length === 0) {
      alert("D-R-47 Guard: A meeting cannot be scheduled without at least one invited internal user.");
      return;
    }

    const isScopeImpact = document.getElementById("mtg-scope-impact").checked;
    const commAmount = Number(document.getElementById("mtg-commercial-amount")?.value) || 0;
    const status = document.getElementById("mtg-status").value;

    // Guard D-R-03 if trying to close
    if (status === "Closed" && isScopeImpact && commAmount <= 0) {
      alert("D-R-03 Guard: A meeting cannot reach Closed while scope-impact is flagged and no commercial impact amount is recorded.");
      return;
    }

    const meetingData = {
      ...(initialData || {}),
      enquiryId: initialData.enquiryId,
      typeId: document.getElementById("mtg-type-id").value,
      mode: document.getElementById("mtg-mode").value,
      startTime: document.getElementById("mtg-start").value,
      endTime: document.getElementById("mtg-end").value,
      invitedUserIds: checkedInvitees,
      linkedDeliverableIds: Array.from(document.getElementById("mtg-linked-delivs").selectedOptions).map(o => o.value),
      linkedQuotationNumber: document.getElementById("mtg-linked-quote")?.value || null,
      decision: document.getElementById("mtg-coo-decision")?.value || null,
      agenda: document.getElementById("mtg-agenda").value,
      minutesText: document.getElementById("mtg-minutes").value,
      decisions: document.getElementById("mtg-decisions").value,
      scopeImpact: isScopeImpact,
      commercialImpactAmount: commAmount,
      status
    };

    try {
      if (status === "Closed") {
        store.closeMeeting(initialData.id || meetingData.id, meetingData);
      } else {
        store.saveMeeting(meetingData);
      }
      modalRoot.innerHTML = "";
      if (initialData.enquiryId) {
        renderEnquiryDetail(document.getElementById("main-content"), initialData.enquiryId);
      }
    } catch (err) {
      alert(err.message);
    }
  });
}

// Reschedule Meeting Modal (D-S-03, D-R-48, D-EV-21)
export function openRescheduleModal(meeting) {
  const modalRoot = document.getElementById("modal-root");

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">Reschedule Meeting #${meeting.meetingNumber} (D-R-48)</div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="reschedule-form">
          <div class="modal-body">
            <div class="alert-banner info">
              D-R-48 / D-EV-21: Releases old calendar slot, sends "Rescheduled" update to invitees, and saves old slot to permanent history.
            </div>

            <div style="background:var(--bg-input); padding:12px; border-radius:var(--radius-sm); margin-bottom:16px;">
              <span style="font-size:11px; text-transform:uppercase; color:var(--text-dim); font-weight:700;">Current Scheduled Slot:</span>
              <div style="color:var(--color-danger); font-weight:600; margin-top:2px;">
                ${meeting.startTime.replace("T", " ")} to ${meeting.endTime.replace("T", " ")}
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">New Start Time <span class="required">*</span></label>
                <input type="datetime-local" id="resched-start" value="${meeting.startTime}" required>
              </div>
              <div class="form-group">
                <label class="form-label">New End Time <span class="required">*</span></label>
                <input type="datetime-local" id="resched-end" value="${meeting.endTime}" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Reason for Rescheduling</label>
              <input type="text" id="resched-reason" placeholder="e.g. Client requested evening slot">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-warning">Confirm Reschedule (D-EV-21)</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("reschedule-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      store.rescheduleMeeting(
        meeting.id,
        document.getElementById("resched-start").value,
        document.getElementById("resched-end").value,
        document.getElementById("resched-reason").value
      );
      modalRoot.innerHTML = "";
      if (meeting.enquiryId) {
        renderEnquiryDetail(document.getElementById("main-content"), meeting.enquiryId);
      }
    } catch (err) {
      alert(err.message);
    }
  });
}

// §14 D-S-04 Site Measurement Modal
export function openSiteMeasurementModal({ enquiryId, projectId = null }) {
  const modalRoot = document.getElementById("modal-root");

  let rooms = [
    { name: "Living / Salon", lengthM: 10.0, widthM: 6.5 },
    { name: "Master Suite", lengthM: 6.5, widthM: 5.5 }
  ];

  function calculateTotal() {
    return rooms.reduce((sum, r) => sum + (Number(r.lengthM) * Number(r.widthM)), 0);
  }

  function renderRoomsList() {
    const listEl = document.getElementById("meas-rooms-list");
    if (!listEl) return;
    listEl.innerHTML = rooms.map((r, idx) => `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
        <input type="text" value="${r.name}" placeholder="Room Name" style="flex:2;" onchange="window.updateRoomName(${idx}, this.value)">
        <input type="number" step="0.1" value="${r.lengthM}" placeholder="Length (m)" style="flex:1;" onchange="window.updateRoomLength(${idx}, this.value)">
        <span>×</span>
        <input type="number" step="0.1" value="${r.widthM}" placeholder="Width (m)" style="flex:1;" onchange="window.updateRoomWidth(${idx}, this.value)">
        <span style="font-family:var(--font-mono); font-size:12px; width:70px; text-align:right;">
          ${(Number(r.lengthM) * Number(r.widthM)).toFixed(2)} m²
        </span>
        <button type="button" class="btn btn-outline btn-sm" onclick="window.removeRoom(${idx})">✕</button>
      </div>
    `).join("");

    const tot = calculateTotal();
    document.getElementById("meas-total-area").textContent = `${tot.toFixed(2)} sq.m (~${Math.round(tot * 10.764)} sq.ft)`;
  }

  window.updateRoomName = (i, val) => { rooms[i].name = val; };
  window.updateRoomLength = (i, val) => { rooms[i].lengthM = Number(val); renderRoomsList(); };
  window.updateRoomWidth = (i, val) => { rooms[i].widthM = Number(val); renderRoomsList(); };
  window.removeRoom = (i) => { rooms.splice(i, 1); renderRoomsList(); };

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div class="modal-title">D-S-04 · Site Measurement Survey</div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="site-meas-form">
          <div class="modal-body">
            <div class="alert-banner info">
              D-R-06: The total area produced here becomes the project's canonical area figure on confirmation.
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Measured Date</label>
                <input type="date" id="meas-date" value="2026-09-25" required>
              </div>
              <div class="form-group">
                <label class="form-label">Measured By</label>
                <select id="meas-by">
                  ${store.data.users.map(u => `<option value="${u.id}">${u.name}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <label class="form-label">Room-wise Dimensions (Length × Width in meters)</label>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-add-room">+ Add Room</button>
              </div>
              <div id="meas-rooms-list"></div>
              <div style="display:flex; justify-content:flex-end; align-items:center; gap:10px; margin-top:12px; padding-top:12px; border-top:1px solid var(--border-subtle);">
                <strong>Total Computed Area:</strong>
                <span id="meas-total-area" style="font-family:var(--font-heading); font-size:18px; color:var(--brand-gold); font-weight:800;">
                  0.00 sq.m
                </span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Site Condition Notes</label>
              <textarea id="meas-notes" rows="2" placeholder="Obstructions, boundary setbacks, soil conditions..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Measurement (D-R-06)</button>
          </div>
        </form>
      </div>
    </div>
  `;

  renderRoomsList();

  document.getElementById("btn-add-room")?.addEventListener("click", () => {
    rooms.push({ name: `Room ${rooms.length + 1}`, lengthM: 5.0, widthM: 4.0 });
    renderRoomsList();
  });

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("site-meas-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    store.saveSiteMeasurement({
      enquiryId,
      projectId,
      measuredDate: document.getElementById("meas-date").value,
      measuredBy: document.getElementById("meas-by").value,
      rooms,
      siteConditionNotes: document.getElementById("meas-notes").value
    });
    modalRoot.innerHTML = "";
    if (enquiryId) renderEnquiryDetail(document.getElementById("main-content"), enquiryId);
  });
}

// §14 D-S-05 Design Deliverable Modal
export function openDeliverableModal(initialData = {}) {
  const modalRoot = document.getElementById("modal-root");
  const state = store.data;
  const isEdit = Boolean(initialData.id);

  const deliverableTypes = state.deliverableTypes.filter(t => t.active);
  const meetings = state.meetings.filter(m => m.enquiryId === initialData.enquiryId);

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">D-S-05 · Design Deliverable ${isEdit ? `(v${initialData.versionNumber})` : ''}</div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="deliv-form">
          <div class="modal-body">
            ${isEdit && initialData.presentedAtMeetingId ? `
              <div class="alert-banner warning">
                D-R-50: This deliverable has been presented at Meeting #${meetings.find(m=>m.id===initialData.presentedAtMeetingId)?.meetingNumber || ''}. Its title and files are LOCKED to preserve what was shown. Use "Create New Version" for revisions.
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label">Deliverable Type <span class="required">*</span></label>
              <select id="deliv-type-id" ${isEdit ? 'disabled' : ''}>
                ${deliverableTypes.map(t => `
                  <option value="${t.id}" ${t.id === initialData.deliverableTypeId ? 'selected' : ''}>${t.name}</option>
                `).join("")}
              </select>
              <span class="form-help">D-R-51: Deliverable type is fixed across its version lineage.</span>
            </div>

            <div class="form-group">
              <label class="form-label">Title <span class="required">*</span></label>
              <input type="text" id="deliv-title" value="${initialData.title || ''}" placeholder="e.g. Concept Mood Board" ${isEdit && initialData.presentedAtMeetingId ? 'readonly' : ''} required>
            </div>

            <div class="form-group">
              <label class="form-label">Attached File(s)</label>
              <input type="text" id="deliv-files" value="${initialData.files ? initialData.files.join(", ") : 'Concept_Design_v1.pdf'}" ${isEdit && initialData.presentedAtMeetingId ? 'readonly' : ''}>
            </div>

            <div class="form-group">
              <label class="form-label">Presented At Meeting (Optional — D-R-52)</label>
              <select id="deliv-meeting-id">
                <option value="">-- Not Yet Presented --</option>
                ${meetings.map(m => `
                  <option value="${m.id}" ${m.id === initialData.presentedAtMeetingId ? 'selected' : ''}>
                    Meeting #${m.meetingNumber} (${m.startTime.replace("T", " ")})
                  </option>
                `).join("")}
              </select>
            </div>

            <!-- Client Response (opens once presented) -->
            <div style="background:var(--bg-input); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-top:14px;">
              <div class="form-group">
                <label class="form-label">Client Response (D-EV-22)</label>
                <select id="deliv-client-response">
                  <option value="">-- Awaiting Client Response --</option>
                  <option value="Accepted" ${initialData.clientResponse === 'Accepted' ? 'selected' : ''}>Accepted</option>
                  <option value="Accepted with changes" ${initialData.clientResponse === 'Accepted with changes' ? 'selected' : ''}>Accepted with changes</option>
                  <option value="Rejected" ${initialData.clientResponse === 'Rejected' ? 'selected' : ''}>Rejected</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Client Comments</label>
                <textarea id="deliv-client-comments" rows="2" placeholder="Record client feedback...">${initialData.clientComments || ''}</textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Deliverable</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("deliv-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    store.saveDeliverable({
      ...(initialData || {}),
      enquiryId: initialData.enquiryId,
      deliverableTypeId: document.getElementById("deliv-type-id").value,
      title: document.getElementById("deliv-title").value,
      files: document.getElementById("deliv-files").value.split(",").map(f => f.trim()),
      presentedAtMeetingId: document.getElementById("deliv-meeting-id").value || null,
      clientResponse: document.getElementById("deliv-client-response").value || null,
      clientComments: document.getElementById("deliv-client-comments").value || ""
    });
    modalRoot.innerHTML = "";
    if (initialData.enquiryId) renderEnquiryDetail(document.getElementById("main-content"), initialData.enquiryId);
  });
}

// Quotation Modal (Drafting & Submitting)
export function openQuotationModal(enq) {
  const modalRoot = document.getElementById("modal-root");
  const q = enq.quotation || {};

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">Quotation & Proposal — ${enq.enquiryNumber}</div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="quote-form">
          <div class="modal-body">
            <div class="alert-banner info">
              D-R-42: Quotation cannot move to Sent to client until it is COO approved (via D-S-06 queue or Budget Planning meeting approval).
            </div>

            <div class="form-group">
              <label class="form-label">Quotation Number</label>
              <input type="text" value="${q.quotationNumber || 'Auto-generated'}" disabled>
            </div>

            <div class="form-group">
              <label class="form-label">Priced Value (₹) <span class="required">*</span></label>
              <input type="number" id="quote-price" value="${q.pricedValue || 15000000}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Scope Summary <span class="required">*</span></label>
              <textarea id="quote-scope" rows="3" required placeholder="Detailed architecture, structural, MEP and turnkey interior scope...">${q.scopeSummary || ''}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Validity (Days)</label>
              <input type="number" id="quote-validity" value="${q.validityDays || 30}">
            </div>

            <div style="background:var(--bg-input); padding:12px; border-radius:var(--radius-sm); margin-top:14px;">
              <strong>Current Status: </strong> ${renderQuotationBadge(q.status || 'Draft')}
              ${q.cooApprovedDate ? `<p style="color:var(--color-success); font-size:12px; margin-top:4px;">Approved by COO on ${q.cooApprovedDate}</p>` : ''}
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Close</button>
            <button type="submit" class="btn btn-secondary">Save Draft</button>
            ${q.status !== 'Approved' && q.status !== 'Sent' && q.status !== 'Signed' ? `
              <button type="button" class="btn btn-primary" id="btn-submit-coo">Submit for COO Approval (D-EV-14)</button>
            ` : ''}
            ${q.status === 'Approved' ? `
              <button type="button" class="btn btn-success" id="btn-send-client">Send to Client (D-R-42)</button>
            ` : ''}
            ${q.status === 'Sent' ? `
              <button type="button" class="btn btn-purple" id="btn-mark-signed">Mark Signed (Proposal)</button>
            ` : ''}
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");

  document.getElementById("quote-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    store.saveQuotation(enq.id, {
      pricedValue: document.getElementById("quote-price").value,
      scopeSummary: document.getElementById("quote-scope").value,
      validityDays: document.getElementById("quote-validity").value
    });
    modalRoot.innerHTML = "";
    renderEnquiryDetail(document.getElementById("main-content"), enq.id);
  });

  document.getElementById("btn-submit-coo")?.addEventListener("click", () => {
    store.saveQuotation(enq.id, {
      pricedValue: document.getElementById("quote-price").value,
      scopeSummary: document.getElementById("quote-scope").value,
      validityDays: document.getElementById("quote-validity").value
    });
    store.submitQuotationForApproval(enq.id);
    modalRoot.innerHTML = "";
    renderEnquiryDetail(document.getElementById("main-content"), enq.id);
  });

  document.getElementById("btn-send-client")?.addEventListener("click", () => {
    try {
      store.sendQuotationToClient(enq.id);
      modalRoot.innerHTML = "";
      renderEnquiryDetail(document.getElementById("main-content"), enq.id);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById("btn-mark-signed")?.addEventListener("click", () => {
    const filename = prompt("Enter Signed Proposal File Name:", "Signed_Proposal_" + enq.enquiryNumber + ".pdf");
    if (filename) {
      store.markQuotationSigned(enq.id, filename);
      modalRoot.innerHTML = "";
      renderEnquiryDetail(document.getElementById("main-content"), enq.id);
    }
  });
}

// §14 D-S-07 Confirmation Gate Modal
export function openConfirmationGateModal(enq) {
  const modalRoot = document.getElementById("modal-root");
  const gate = enq.confirmationGate || {};

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">D-S-07 · Project Confirmation Gate</div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="conf-gate-form">
          <div class="modal-body">
            <div class="alert-banner info">
              D-R-07 Guard: All 4 checks must be satisfied to pass confirmation and authorize project creation:
              Signed proposal on file, advance receipt reference, HOD approval, and COO approval.
            </div>

            <div style="background:var(--bg-input); padding:16px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:14px;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">1. Signed Proposal File <span class="required">*</span></label>
                <input type="text" id="gate-proposal-file" value="${gate.proposalFile || (enq.quotation && enq.quotation.status === 'Signed' ? 'Signed_Proposal.pdf' : '')}" placeholder="Signed_Proposal.pdf" required>
              </div>

              <div class="form-grid" style="margin-bottom:0;">
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">2. Advance Amount (₹)</label>
                  <input type="number" id="gate-advance-amount" value="${gate.advanceAmount || (enq.quotation ? Math.round(enq.quotation.pricedValue * 0.1) : 1000000)}" required>
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">Advance Receipt Ref <span class="required">*</span></label>
                  <input type="text" id="gate-advance-ref" value="${gate.advanceReceiptRef || 'HDFC-NEFT-202609001'}" placeholder="e.g. HDFC-NEFT-2026..." required>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:8px; padding-top:10px; border-top:1px solid var(--border-subtle);">
                <label style="display:flex; align-items:center; gap:8px; font-weight:600; cursor:pointer;">
                  <input type="checkbox" id="gate-hod-approval" ${gate.hodApproved || store.data.currentUser.role === 'HOD' ? 'checked' : ''}>
                  <span>3. HOD Approval Check</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; font-weight:600; cursor:pointer;">
                  <input type="checkbox" id="gate-coo-approval" ${gate.cooApproved || store.data.currentUser.role === 'COO' ? 'checked' : ''}>
                  <span>4. COO Approval Check</span>
                </label>
              </div>
            </div>

            <p style="font-size:12px; color:var(--text-dim); margin-top:10px;">
              D-R-43: Passing this confirmation gate authorizes the project record to be created, but does not unlock the board until the COO approves project setup (D-S-08).
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-success">Confirm Deal (D-R-07)</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("conf-gate-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      store.confirmProjectGate(enq.id, {
        proposalFile: document.getElementById("gate-proposal-file").value,
        advanceAmount: document.getElementById("gate-advance-amount").value,
        advanceReceiptRef: document.getElementById("gate-advance-ref").value,
        hodApproved: document.getElementById("gate-hod-approval").checked,
        cooApproved: document.getElementById("gate-coo-approval").checked
      });
      modalRoot.innerHTML = "";
      renderEnquiryDetail(document.getElementById("main-content"), enq.id);
    } catch (err) {
      alert(err.message);
    }
  });
}

// Initiate Project Creation from Enquiry
export function openInitiateProjectModal(enq) {
  const modalRoot = document.getElementById("modal-root");
  const templates = store.data.drawingTemplates.filter(t => t.active);

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">Initiate Project Creation from ${enq.enquiryNumber}</div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="initiate-project-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Project Name <span class="required">*</span></label>
              <input type="text" id="init-prj-name" value="${enq.clientName} Residence" required>
            </div>

            <div class="form-group">
              <label class="form-label">Project Type (from Masters)</label>
              <input type="text" id="init-prj-type" value="Luxury Residential Villa">
            </div>

            <div class="form-group">
              <label class="form-label">Drawing Template Library <span class="required">* (D-R-08, D-R-10)</span></label>
              <select id="init-prj-template" required>
                ${templates.map(t => `
                  <option value="${t.id}">${t.name} (${t.drawingTypeIds ? t.drawingTypeIds.length : 0} drawings)</option>
                `).join("")}
              </select>
            </div>

            <div class="alert-banner warning">
              D-R-44: Once created, the project's drawing board remains locked until the COO records Project Creation Approval in the COO Queue (D-S-08).
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Project (D-EV-16)</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("initiate-project-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const prj = store.initiateProjectCreation(enq.id, {
        projectName: document.getElementById("init-prj-name").value,
        projectTypeMasters: document.getElementById("init-prj-type").value,
        drawingTemplateId: document.getElementById("init-prj-template").value
      });
      modalRoot.innerHTML = "";
      window.location.hash = `#/projects`;
    } catch (err) {
      alert(err.message);
    }
  });
}
