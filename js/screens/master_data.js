// Screen D-S-20 Manage Master Data (6 Tabs)
// Strictly follows D-R-09, D-R-10, D-R-54, D-R-56, D-R-57

import { store } from "../state.js";

export function renderMasterData(container, activeTab = "drawingTypes") {
  const state = store.data;
  const isHOD = state.currentUser.role === "HOD";

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>
          <span>D-S-20 · Manage Master Data</span>
        </h1>
        <p class="page-description">
          Six foundational masters governing Drawing Types, Templates, Hold Reasons, Enquiry Stages, Meeting Types, and Deliverables.
        </p>
      </div>
      <div class="page-actions">
        ${!isHOD ? `
          <div class="alert-banner warning" style="margin-bottom:0; padding:6px 12px;">
            HOD-only access for modifying master lists (§13). Viewing as ${state.currentUser.role}.
          </div>
        ` : ''}
      </div>
    </div>

    <!-- 6 Tabs Header -->
    <div class="tabs-header">
      <button class="tab-btn ${activeTab === 'drawingTypes' ? 'active' : ''}" data-tab="drawingTypes">
        1. Drawing Types (Appendix A)
      </button>
      <button class="tab-btn ${activeTab === 'drawingTemplates' ? 'active' : ''}" data-tab="drawingTemplates">
        2. Drawing Templates (Appendix B)
      </button>
      <button class="tab-btn ${activeTab === 'holdReasons' ? 'active' : ''}" data-tab="holdReasons">
        3. Hold Reasons (§3.9)
      </button>
      <button class="tab-btn ${activeTab === 'enquiryStages' ? 'active' : ''}" data-tab="enquiryStages">
        4. Enquiry Stages (§3.17)
      </button>
      <button class="tab-btn ${activeTab === 'meetingTypes' ? 'active' : ''}" data-tab="meetingTypes">
        5. Meeting Types (§3.18, D-R-54)
      </button>
      <button class="tab-btn ${activeTab === 'deliverableTypes' ? 'active' : ''}" data-tab="deliverableTypes">
        6. Deliverable Types (§3.19)
      </button>
    </div>

    <!-- Tab Content Container -->
    <div id="master-tab-content"></div>
  `;

  // Render active tab content
  const tabContentEl = document.getElementById("master-tab-content");
  if (activeTab === "drawingTypes") renderDrawingTypesTab(tabContentEl);
  else if (activeTab === "drawingTemplates") renderDrawingTemplatesTab(tabContentEl);
  else if (activeTab === "holdReasons") renderHoldReasonsTab(tabContentEl);
  else if (activeTab === "enquiryStages") renderEnquiryStagesTab(tabContentEl);
  else if (activeTab === "meetingTypes") renderMeetingTypesTab(tabContentEl);
  else if (activeTab === "deliverableTypes") renderDeliverableTypesTab(tabContentEl);

  // Tab switching
  container.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      renderMasterData(container, tab);
    });
  });
}

// Tab 1: Drawing Types (Appendix A)
function renderDrawingTypesTab(container) {
  const state = store.data;
  const isHOD = state.currentUser.role === "HOD";

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-size:16px; font-weight:700; color:#ffffff;">Drawing Type Library (${state.drawingTypes.length})</h3>
        <p style="font-size:12.5px; color:var(--text-dim);">D-R-09: Retiring a drawing type does not affect any existing project.</p>
      </div>
      ${isHOD ? `
        <button class="btn btn-primary btn-sm" id="btn-add-drawing-type">+ Add Drawing Type</button>
      ` : ''}
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Discipline</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${state.drawingTypes.map(dt => `
            <tr>
              <td><strong>${dt.name}</strong></td>
              <td><span class="status-badge" style="background:var(--bg-elevated);">${dt.discipline}</span></td>
              <td>${dt.active ? '<span style="color:var(--color-success);">Active</span>' : '<span style="color:var(--text-dim);">Retired</span>'}</td>
              <td>
                ${isHOD && dt.active ? `
                  <button class="btn btn-outline btn-sm btn-retire-dt" data-dt-id="${dt.id}">Retire (D-R-09)</button>
                ` : '—'}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("btn-add-drawing-type")?.addEventListener("click", () => {
    const name = prompt("Enter Drawing Type Name (e.g. Roof beam layout):");
    if (!name) return;
    const discipline = prompt("Enter Discipline (Architectural, Structural, Mechanical, Electrical, Plumbing, Landscape, Interior Design, As-Built):", "Architectural");
    if (discipline) {
      store.addDrawingType(name, discipline);
      renderDrawingTypesTab(container);
    }
  });

  container.querySelectorAll(".btn-retire-dt").forEach(btn => {
    btn.addEventListener("click", () => {
      const dtId = btn.getAttribute("data-dt-id");
      const dt = state.drawingTypes.find(t => t.id === dtId);
      if (dt) {
        dt.active = false;
        store.saveState();
        renderDrawingTypesTab(container);
      }
    });
  });
}

// Tab 2: Drawing Templates (Appendix B)
function renderDrawingTemplatesTab(container) {
  const state = store.data;
  const isHOD = state.currentUser.role === "HOD";

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-size:16px; font-weight:700; color:#ffffff;">Starter Drawing Templates (${state.drawingTemplates.length})</h3>
        <p style="font-size:12.5px; color:var(--text-dim);">D-R-10: A template must contain at least one drawing type before it can be used to create a project.</p>
      </div>
      ${isHOD ? `
        <button class="btn btn-primary btn-sm" id="btn-add-template">+ Add Template</button>
      ` : ''}
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:20px;">
      ${state.drawingTemplates.map(tmpl => {
        const types = state.drawingTypes.filter(dt => (tmpl.drawingTypeIds || []).includes(dt.id));
        return `
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <div>
                <h4 style="font-size:16px; font-weight:700; color:#ffffff;">${tmpl.name}</h4>
                <div style="font-size:12px; color:var(--text-dim);">${types.length} Drawing Types Included</div>
              </div>
              <span class="status-badge" style="background:var(--color-success-bg); color:var(--color-success);">Active</span>
            </div>

            <div style="max-height:200px; overflow-y:auto; background:var(--bg-input); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); font-size:12px; display:flex; flex-direction:column; gap:4px;">
              ${types.map(t => `<div>• <strong>${t.discipline}:</strong> ${t.name}</div>`).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  document.getElementById("btn-add-template")?.addEventListener("click", () => {
    const name = prompt("Enter Template Name (e.g. Interior Fitout Starter):");
    if (!name) return;
    const defaultIds = state.drawingTypes.slice(0, 5).map(t => t.id);
    try {
      store.addDrawingTemplate(name, defaultIds);
      renderDrawingTemplatesTab(container);
    } catch (err) {
      alert(err.message);
    }
  });
}

// Tab 3: Hold Reasons (§3.9)
function renderHoldReasonsTab(container) {
  const state = store.data;
  const isHOD = state.currentUser.role === "HOD";

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-size:16px; font-weight:700; color:#ffffff;">Hold Reasons (§3.9)</h3>
        <p style="font-size:12.5px; color:var(--text-dim);">Mandatory options when moving any drawing task to Blocked status (D-R-15).</p>
      </div>
      ${isHOD ? `
        <button class="btn btn-primary btn-sm" id="btn-add-hold-reason">+ Add Hold Reason</button>
      ` : ''}
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Hold Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${state.holdReasons.map(hr => `
            <tr>
              <td><strong>${hr.reason}</strong></td>
              <td>${hr.active ? '<span style="color:var(--color-success);">Active</span>' : '<span style="color:var(--text-dim);">Retired</span>'}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("btn-add-hold-reason")?.addEventListener("click", () => {
    const reason = prompt("Enter new Hold Reason:");
    if (reason) {
      store.addHoldReason(reason);
      renderHoldReasonsTab(container);
    }
  });
}

// Tab 4: Enquiry Stages (§3.17)
function renderEnquiryStagesTab(container) {
  const state = store.data;
  const isHOD = state.currentUser.role === "HOD";

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-size:16px; font-weight:700; color:#ffffff;">Enquiry Stages (§3.17)</h3>
        <p style="font-size:12.5px; color:var(--text-dim);">
          HOD-configurable board columns. D-R-45: Stage carries no system logic, blocks nothing, and unlocks nothing.
        </p>
      </div>
      ${isHOD ? `
        <button class="btn btn-primary btn-sm" id="btn-add-stage">+ Add Board Stage</button>
      ` : ''}
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Stage Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.enquiryStages.map(stg => `
            <tr>
              <td><strong style="font-family:var(--font-mono); color:var(--brand-gold);">${stg.displayOrder}</strong></td>
              <td><strong>${stg.name}</strong> ${stg.isLost ? '<span class="status-badge" style="background:var(--color-danger-bg); color:var(--color-danger);">Lost Column (D-R-01)</span>' : ''}</td>
              <td>${stg.active ? '<span style="color:var(--color-success);">Active</span>' : '<span style="color:var(--text-dim);">Retired (D-R-56)</span>'}</td>
              <td>
                ${isHOD && stg.active && !stg.isLost ? `
                  <button class="btn btn-outline btn-sm btn-retire-stage" data-stg-id="${stg.id}">Retire</button>
                ` : '—'}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("btn-add-stage")?.addEventListener("click", () => {
    const name = prompt("Enter new Enquiry Stage Name:");
    if (name) {
      store.addEnquiryStage(name);
      renderEnquiryStagesTab(container);
    }
  });

  container.querySelectorAll(".btn-retire-stage").forEach(btn => {
    btn.addEventListener("click", () => {
      const stgId = btn.getAttribute("data-stg-id");
      store.retireEnquiryStage(stgId);
      renderEnquiryStagesTab(container);
    });
  });
}

// Tab 5: Meeting Types (§3.18, D-R-54)
function renderMeetingTypesTab(container) {
  const state = store.data;
  const isHOD = state.currentUser.role === "HOD";

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-size:16px; font-weight:700; color:#ffffff;">Meeting Types (§3.18, D-R-54)</h3>
        <p style="font-size:12.5px; color:var(--text-dim);">
          D-R-54: Exactly one active type holds Budget Planning (triggers COO approval D-R-46) and exactly one holds Client Quotation.
        </p>
      </div>
      ${isHOD ? `
        <button class="btn btn-primary btn-sm" id="btn-add-meeting-type">+ Add Meeting Type</button>
      ` : ''}
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Meeting Type Name</th>
            <th>Special Role (§3.18)</th>
            <th>Role Behavior</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.meetingTypes.map(mt => `
            <tr>
              <td><strong>${mt.name}</strong></td>
              <td>
                ${mt.specialRole === 'Budget Planning' ? `
                  <span class="status-badge" style="background:var(--color-purple-bg); color:#c084fc; font-weight:700;">★ Budget Planning</span>
                ` : mt.specialRole === 'Client Quotation' ? `
                  <span class="status-badge" style="background:var(--primary-light); color:#818cf8; font-weight:700;">★ Client Quotation</span>
                ` : `
                  <span style="color:var(--text-dim); font-size:12px;">None (Unflagged label)</span>
                `}
              </td>
              <td style="font-size:12px; color:var(--text-muted);">
                ${mt.specialRole === 'Budget Planning' ? 'Closed with "Approved" sets COO approval on linked quotation (D-R-46).' :
                  mt.specialRole === 'Client Quotation' ? 'Client presentation of approved proposal.' :
                  'Uncapped, unordered, unpaired label (D-R-49).'}
              </td>
              <td>
                ${isHOD ? `
                  <select class="sel-meeting-role" data-type-id="${mt.id}" style="font-size:11px; padding:3px 6px;">
                    <option value="None" ${mt.specialRole === 'None' ? 'selected' : ''}>Role: None</option>
                    <option value="Budget Planning" ${mt.specialRole === 'Budget Planning' ? 'selected' : ''}>Role: Budget Planning</option>
                    <option value="Client Quotation" ${mt.specialRole === 'Client Quotation' ? 'selected' : ''}>Role: Client Quotation</option>
                  </select>
                ` : '—'}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("btn-add-meeting-type")?.addEventListener("click", () => {
    const name = prompt("Enter Meeting Type Name (e.g. Structural Peer Review):");
    if (name) {
      store.addMeetingType(name);
      renderMeetingTypesTab(container);
    }
  });

  container.querySelectorAll(".sel-meeting-role").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const typeId = sel.getAttribute("data-type-id");
      const role = sel.value;
      store.setMeetingTypeRole(typeId, role);
      renderMeetingTypesTab(container);
    });
  });
}

// Tab 6: Deliverable Types (§3.19, D-R-57)
function renderDeliverableTypesTab(container) {
  const state = store.data;
  const isHOD = state.currentUser.role === "HOD";

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-size:16px; font-weight:700; color:#ffffff;">Deliverable Types (§3.19)</h3>
        <p style="font-size:12.5px; color:var(--text-dim);">
          Labels for presentation assets (Mood Board, Scheme Plan, 3D Render). D-R-52: Any deliverable may link to any meeting.
        </p>
      </div>
      ${isHOD ? `
        <button class="btn btn-primary btn-sm" id="btn-add-deliv-type">+ Add Deliverable Type</button>
      ` : ''}
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Type Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${state.deliverableTypes.map(dt => `
            <tr>
              <td><strong>${dt.name}</strong></td>
              <td>${dt.active ? '<span style="color:var(--color-success);">Active</span>' : '<span style="color:var(--text-dim);">Retired (D-R-57)</span>'}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("btn-add-deliv-type")?.addEventListener("click", () => {
    const name = prompt("Enter Deliverable Type Name (e.g. Walkthrough Animation):");
    if (name) {
      store.addDeliverableType(name);
      renderDeliverableTypesTab(container);
    }
  });
}
