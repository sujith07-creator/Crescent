// Screens D-S-09 (Projects List), D-S-10 (New Project), D-S-11 (Import Checklist),
// D-S-12 (Project Drawing Board), D-S-13 (Drawing Task Detail), D-S-14 (Project Timeline/Gantt)

import { store } from "../state.js";

// §14 D-S-09 Projects List
export function renderProjectsList(container) {
  const state = store.data;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>
          <span>D-S-09 · Projects</span>
        </h1>
        <p class="page-description">
          All active projects with progress, computed finish date, critical path chain, and at-risk counts.
        </p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="btn-create-direct-project">+ New Project (D-S-10)</button>
      </div>
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Project Code</th>
            <th>Project Name</th>
            <th>Client</th>
            <th>Area</th>
            <th>Progress</th>
            <th>Finish Date (Derived)</th>
            <th>Critical Path</th>
            <th>At Risk</th>
            <th>Board Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.projects.map(prj => {
            const sched = store.computeProjectSchedule(prj.id);
            const pTasks = state.drawingTasks.filter(t => t.projectId === prj.id);
            const finalTasks = pTasks.filter(t => t.status === "Final");
            const progressPct = pTasks.length > 0 ? Math.round((finalTasks.length / pTasks.length) * 100) : 0;
            const atRiskCount = pTasks.filter(t => t.status !== "Final" && t.deliveryRisk === "At Risk").length;
            const isBoardLocked = prj.boardLocked || prj.cooApprovedStatus !== "Approved";

            return `
              <tr>
                <td><strong style="font-family:var(--font-mono); color:var(--brand-gold);">${prj.projectCode}</strong></td>
                <td>
                  <strong>${prj.projectName}</strong>
                  <div style="font-size:12px; color:var(--text-dim);">${prj.projectTypeMasters}</div>
                </td>
                <td>${prj.clientName}</td>
                <td>${prj.areaSqM} m²</td>
                <td style="width:160px;">
                  <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                    <span>${progressPct}%</span>
                    <span>${finalTasks.length}/${pTasks.length} GFC</span>
                  </div>
                  <div style="height:6px; background:var(--bg-elevated); border-radius:3px; overflow:hidden;">
                    <div style="height:100%; width:${progressPct}%; background:${progressPct === 100 ? 'var(--color-success)' : 'var(--primary)'}; border-radius:3px;"></div>
                  </div>
                </td>
                <td>
                  <span style="font-family:var(--font-mono); font-weight:600;">
                    ${sched.projectFinishDate || '—'}
                  </span>
                </td>
                <td>
                  <span class="ribbon-critical-path">${sched.criticalPathIds.length} Tasks</span>
                </td>
                <td>
                  ${atRiskCount > 0 ? `<span class="ribbon-at-risk">⚠ ${atRiskCount} At Risk</span>` : `<span style="color:var(--color-success); font-size:12px;">✓ Clear</span>`}
                </td>
                <td>
                  ${isBoardLocked ? `
                    <span class="status-badge badge-setup-pending">🔒 Locked (Pending COO)</span>
                  ` : `
                    <span class="status-badge badge-setup-approved">✓ Unlocked</span>
                  `}
                </td>
                <td>
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/drawing-board/${prj.id}'">Board (D-S-12)</button>
                    <button class="btn btn-outline btn-sm" onclick="window.location.hash='#/timeline/${prj.id}'">Gantt (D-S-14)</button>
                    <button class="btn btn-outline btn-sm" onclick="window.location.hash='#/project-dashboard/${prj.id}'">Dashboard</button>
                  </div>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("btn-create-direct-project")?.addEventListener("click", openNewProjectModal);
}

// §14 D-S-10 New Project Modal
export function openNewProjectModal() {
  const modalRoot = document.getElementById("modal-root");
  const templates = store.data.drawingTemplates.filter(t => t.active);

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">D-S-10 · New Project (Direct Creation)</div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="new-project-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Project Name <span class="required">*</span></label>
              <input type="text" id="prj-name" placeholder="e.g. Skyline Towers Penthouse" required>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Client Name <span class="required">*</span></label>
                <input type="text" id="prj-client" placeholder="e.g. Oberoi Developers" required>
              </div>
              <div class="form-group">
                <label class="form-label">Project Type (Masters)</label>
                <input type="text" id="prj-type" value="Commercial Architecture">
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Surveyed Area (sq.m)</label>
                <input type="number" id="prj-area" value="500">
              </div>
              <div class="form-group">
                <label class="form-label">Contract / Quotation Value (₹)</label>
                <input type="number" id="prj-quote-val" value="18000000">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Drawing Template (Master D-S-20) <span class="required">* (D-R-08, D-R-10)</span></label>
              <select id="prj-template" required>
                ${templates.map(t => `<option value="${t.id}">${t.name} (${t.drawingTypeIds ? t.drawingTypeIds.length : 0} drawing types)</option>`).join("")}
              </select>
            </div>

            <div class="alert-banner warning">
              D-R-44 Guard: Project board will be created locked until COO records creation approval in D-S-08.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Project Record</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("new-project-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      store.createProjectDirect({
        projectName: document.getElementById("prj-name").value,
        clientName: document.getElementById("prj-client").value,
        projectTypeMasters: document.getElementById("prj-type").value,
        areaSqM: document.getElementById("prj-area").value,
        quotationValue: document.getElementById("prj-quote-val").value,
        drawingTemplateId: document.getElementById("prj-template").value
      });
      modalRoot.innerHTML = "";
      renderProjectsList(document.getElementById("main-content"));
    } catch (err) {
      alert(err.message);
    }
  });
}

// §14 D-S-11 Import Drawing Checklist Modal
export function openImportChecklistModal(projectId) {
  const modalRoot = document.getElementById("modal-root");
  const state = store.data;
  const prj = state.projects.find(p => p.id === projectId);
  if (!prj) return;

  // D-R-44 Guard
  if (prj.boardLocked || prj.cooApprovedStatus !== "Approved") {
    alert("D-R-44 Guard: Drawing checklist cannot be imported because this project board is locked awaiting COO Creation Approval (D-S-08).");
    return;
  }

  const tmpl = state.drawingTemplates.find(t => t.id === prj.drawingTemplateId) || state.drawingTemplates[0];
  const templateDrawingTypes = (tmpl && tmpl.drawingTypeIds) ? state.drawingTypes.filter(dt => tmpl.drawingTypeIds.includes(dt.id)) : state.drawingTypes;

  // Group by discipline
  const grouped = {};
  templateDrawingTypes.forEach(dt => {
    if (!grouped[dt.discipline]) grouped[dt.discipline] = [];
    grouped[dt.discipline].push(dt);
  });

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div class="modal-title">D-S-11 · Import Drawing Checklist (${tmpl ? tmpl.name : 'Template'})</div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="import-checklist-form">
          <div class="modal-body">
            <p style="color:var(--text-muted); font-size:13px; margin-bottom:14px;">
              Pre-checked drawings from template <strong>${tmpl ? tmpl.name : ''}</strong>. Adjust selection before importing into <strong>To Do</strong> tasks for ${prj.projectCode}.
            </p>

            <div style="max-height:420px; overflow-y:auto; padding-right:8px;">
              ${Object.entries(grouped).map(([discipline, items]) => `
                <div style="margin-bottom:16px; background:var(--bg-input); padding:12px 16px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                  <div style="font-weight:700; color:var(--brand-gold); margin-bottom:8px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">
                    ${discipline} (${items.length})
                  </div>
                  <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
                    ${items.map(dt => `
                      <label style="display:flex; align-items:center; gap:8px; font-size:12.5px; cursor:pointer;">
                        <input type="checkbox" name="import_drawing" value="${dt.id}" checked>
                        <span>${dt.name}</span>
                      </label>
                    `).join("")}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Import Selected Tasks (D-EV-03)</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("import-checklist-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const selectedIds = Array.from(document.querySelectorAll('input[name="import_drawing"]:checked')).map(el => el.value);
    if (selectedIds.length === 0) {
      alert("Please select at least one drawing type to import.");
      return;
    }
    store.importDrawingChecklist(projectId, selectedIds);
    modalRoot.innerHTML = "";
    renderDrawingBoard(document.getElementById("main-content"), projectId);
  });
}

// §14 D-S-12 Project Drawing Board (5 columns: To Do / In Progress / Under Review / Blocked / Final)
export function renderDrawingBoard(container, projectId) {
  const state = store.data;
  const prj = state.projects.find(p => p.id === projectId);
  if (!prj) {
    container.innerHTML = `<div class="page-container"><p>Project not found.</p></div>`;
    return;
  }

  const isBoardLocked = prj.boardLocked || prj.cooApprovedStatus !== "Approved";
  const sched = store.computeProjectSchedule(prj.id);
  const cpSet = new Set(sched.criticalPathIds);

  const columns = [
    { id: "To Do", name: "To Do" },
    { id: "In Progress", name: "In Progress" },
    { id: "Under Review", name: "Under Review" },
    { id: "Blocked", name: "Blocked" },
    { id: "Final", name: "Final (GFC)" }
  ];

  const tasks = state.drawingTasks.filter(t => t.projectId === prj.id);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
          <a href="#/projects" class="btn btn-secondary btn-sm">← Projects</a>
          <span style="font-family:var(--font-mono); color:var(--brand-gold); font-weight:700;">${prj.projectCode}</span>
          ${isBoardLocked ? `
            <span class="status-badge badge-setup-pending">🔒 Board Locked (Pending COO Gate D-S-08)</span>
          ` : `
            <span class="status-badge badge-setup-approved">✓ Unlocked</span>
          `}
        </div>
        <h1>${prj.projectName} · Drawing Production Board</h1>
        <p class="page-description">
          Client: ${prj.clientName} · Area: ${prj.areaSqM} m² · Derived Project Finish Date: <strong style="color:var(--text-main); font-family:var(--font-mono);">${sched.projectFinishDate || 'TBD'}</strong>
        </p>
      </div>

      <div class="page-actions">
        ${!isBoardLocked ? `
          <button class="btn btn-secondary" id="btn-open-import">📥 Import Checklist (D-S-11)</button>
        ` : `
          <button class="btn btn-warning" onclick="window.location.hash='#/project-creation-approvals'">Unlock in COO Queue (D-S-08)</button>
        `}
        <button class="btn btn-outline" onclick="window.location.hash='#/timeline/${prj.id}'">Gantt Timeline (D-S-14)</button>
        <button class="btn btn-outline" onclick="window.location.hash='#/project-dashboard/${prj.id}'">Dashboard (D-S-18)</button>
      </div>
    </div>

    ${isBoardLocked ? `
      <div class="alert-banner warning" style="margin-bottom:24px;">
        <strong>D-R-44 Guard:</strong> This project's board is locked until the COO records creation approval. Checklist import and task planning are disabled until approval is recorded in D-S-08.
      </div>
    ` : ''}

    <!-- Live Board Filter Bar -->
    <div style="display:flex; gap:12px; margin-bottom:20px; align-items:center; flex-wrap:wrap; background:var(--bg-card); padding:10px 16px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
      <span style="font-size:12px; text-transform:uppercase; color:var(--text-dim); font-weight:700;">Filters:</span>
      <select id="board-filter-discipline" style="font-size:12px; padding:4px 8px;">
        <option value="">All Disciplines</option>
        <option value="Architectural">Architectural</option>
        <option value="Structural">Structural</option>
        <option value="Mechanical">Mechanical</option>
        <option value="Electrical">Electrical</option>
        <option value="Plumbing">Plumbing</option>
      </select>

      <select id="board-filter-risk" style="font-size:12px; padding:4px 8px;">
        <option value="">All Delivery Risks</option>
        <option value="At Risk">At Risk Only</option>
        <option value="Clear">Clear Only</option>
      </select>

      <select id="board-filter-cp" style="font-size:12px; padding:4px 8px;">
        <option value="">All Tasks</option>
        <option value="critical">Critical Path Only (0d Float)</option>
      </select>

      <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
        <span class="ribbon-critical-path">${sched.criticalPathIds.length} on Critical Path</span>
        <span class="ribbon-at-risk">${tasks.filter(t => t.deliveryRisk === "At Risk" && t.status !== "Final").length} At Risk</span>
      </div>
    </div>

    <!-- 5-Column Drawing Kanban -->
    <div class="kanban-board-container" id="drawing-board-kanban">
      ${columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return `
          <div class="kanban-column" data-status-col="${col.id}">
            <div class="kanban-column-header">
              <div class="column-title-group">
                <span class="column-title">${col.name}</span>
                <span class="column-count">${colTasks.length}</span>
              </div>
            </div>
            <div class="kanban-column-body" id="col-body-${col.id.replace(/\s+/g, '')}">
              ${colTasks.map(t => renderDrawingCard(t, state, cpSet.has(t.id), sched.floatMap[t.id])).join("")}
              ${colTasks.length === 0 ? `<div style="text-align:center; padding:30px 10px; color:var(--text-dim); font-size:12px;">No drawings</div>` : ''}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  document.getElementById("btn-open-import")?.addEventListener("click", () => openImportChecklistModal(prj.id));

  // Card click -> Open Task Detail (D-S-13)
  container.querySelectorAll(".drawing-kanban-card").forEach(card => {
    card.addEventListener("click", () => {
      const taskId = card.getAttribute("data-task-id");
      openTaskDetailModal(taskId);
    });
  });

  // Filter handlers
  const filterDisc = document.getElementById("board-filter-discipline");
  const filterRisk = document.getElementById("board-filter-risk");
  const filterCP = document.getElementById("board-filter-cp");

  const applyFilters = () => {
    const disc = filterDisc.value;
    const risk = filterRisk.value;
    const cp = filterCP.value;

    container.querySelectorAll(".drawing-kanban-card").forEach(card => {
      const tDisc = card.getAttribute("data-discipline");
      const tRisk = card.getAttribute("data-risk");
      const isCP = card.getAttribute("data-is-cp") === "true";

      let show = true;
      if (disc && tDisc !== disc) show = false;
      if (risk && tRisk !== risk) show = false;
      if (cp === "critical" && !isCP) show = false;

      card.style.display = show ? "block" : "none";
    });
  };

  filterDisc?.addEventListener("change", applyFilters);
  filterRisk?.addEventListener("change", applyFilters);
  filterCP?.addEventListener("change", applyFilters);
}

function renderDrawingCard(task, state, isCriticalPath, floatDays = 0) {
  const architect = state.users.find(u => u.id === task.assignedUserId);
  const revs = state.revisions.filter(r => r.taskId === task.id);
  const currentGfc = revs.find(r => r.status === "GFC");

  return `
    <div class="kanban-card drawing-kanban-card" data-task-id="${task.id}" data-discipline="${task.discipline}" data-risk="${task.deliveryRisk}" data-is-cp="${isCriticalPath}">
      <div class="card-top-row">
        <span class="status-badge" style="background:var(--bg-elevated); font-size:10px;">${task.discipline}</span>
        <span class="priority-pill priority-${task.priority}">${task.priority}</span>
      </div>

      <div class="card-title">${task.drawingName}</div>

      <!-- Critical Path & Risk Badges -->
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
        ${isCriticalPath ? `<span class="ribbon-critical-path">★ Critical Path · 0d Float</span>` : `<span style="font-size:11px; color:var(--text-dim);">${floatDays}d float</span>`}
        ${task.deliveryRisk === 'At Risk' ? `<span class="ribbon-at-risk">⚠ At Risk</span>` : ''}
        ${task.isOverdue ? `<span class="status-badge" style="background:var(--color-danger-bg); color:var(--color-danger);">Overdue</span>` : ''}
      </div>

      <!-- Progress & GFC Revision tag -->
      <div style="font-size:11.5px; color:var(--text-dim); margin-bottom:6px;">
        ${task.status === 'Final' ? `
          <span style="color:var(--color-success); font-weight:700;">✓ GFC: ${currentGfc ? currentGfc.revisionCode : 'Final'}</span>
        ` : `
          <span>Due: <strong>${task.dueDate || 'Unset'}</strong> (${task.durationDays}d)</span>
        `}
      </div>

      <div class="card-meta-footer">
        <div class="card-assignee">
          <span>👤 ${architect ? architect.name.split(" ")[1] || architect.name : 'Unassigned'}</span>
        </div>
        <span style="color:var(--primary); font-size:11.5px; font-weight:600;">Detail →</span>
      </div>
    </div>
  `;
}

// §14 D-S-13 Drawing Task Detail Modal (The Richest Screen)
export function openTaskDetailModal(taskId) {
  const modalRoot = document.getElementById("modal-root");
  const state = store.data;
  const task = state.drawingTasks.find(t => t.id === taskId);
  if (!task) return;

  const prj = state.projects.find(p => p.id === task.projectId);
  const sched = store.computeProjectSchedule(task.projectId);
  const isCriticalPath = sched.criticalPathIds.includes(task.id);
  const floatDays = sched.floatMap[task.id] ?? 0;
  const earliestSensibleStart = sched.earliestStarts[task.id];

  // Conflict calculation live (§6)
  const conflict = store.computeArchitectWorkload(task.assignedUserId, task.startDate, task.dueDate, task.id);

  // Available predecessors for dependencies (excluding self)
  const projectTasks = state.drawingTasks.filter(t => t.projectId === task.projectId && t.id !== task.id);

  const revisions = state.revisions.filter(r => r.taskId === task.id);
  const isHOD = state.currentUser.role === "HOD";
  const isAssignee = state.currentUser.id === task.assignedUserId;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog modal-xl">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="modal-title">D-S-13 · Drawing Task Detail</div>
            <span class="status-badge" style="background:var(--bg-elevated);">${task.discipline} (Fixed, D-R-12)</span>
            ${isCriticalPath ? `<span class="ribbon-critical-path">★ Critical Path</span>` : `<span style="font-size:12px; color:var(--text-dim);">${floatDays}d Float</span>`}
            ${task.deliveryRisk === 'At Risk' ? `<span class="ribbon-at-risk">⚠ At Risk</span>` : ''}
          </div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>

        <div class="modal-body" style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
          <!-- Left Column: Planning, Status, Live Conflict, Revisions -->
          <div>
            <!-- Status Track (§4.3) -->
            <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:12px; text-transform:uppercase; color:var(--text-dim); font-weight:700;">Status Progression Track:</span>
                <span style="font-weight:700; color:#ffffff;">${task.percentComplete}% Complete</span>
              </div>
              <div style="display:flex; gap:8px;">
                ${['To Do', 'In Progress', 'Under Review', 'Blocked', 'Final'].map(st => {
                  const isCurrent = task.status === st;
                  return `
                    <button class="btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-outline'} btn-change-status" data-target-status="${st}" style="flex:1;">
                      ${st}
                    </button>
                  `;
                }).join("")}
              </div>
              ${task.status === 'Blocked' ? `
                <div class="alert-banner danger" style="margin-top:12px; margin-bottom:0;">
                  <strong>D-R-15 Blocked:</strong> Reason: "${state.holdReasons.find(h=>h.id===task.holdReasonId)?.reason || 'Hold'}" · Owner: ${state.users.find(u=>u.id===task.holdOwnerId)?.name || 'Unassigned'}
                </div>
              ` : ''}
            </div>

            <!-- Task Name & Planning Form (HOD Only for planning, D-R-13) -->
            <form id="task-planning-form">
              <div class="form-group">
                <label class="form-label">Drawing Name</label>
                <input type="text" id="task-name" value="${task.drawingName}" readonly>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Assigned Architect <span class="required">* (D-R-13: HOD only)</span></label>
                  <select id="task-assigned-user" ${!isHOD ? 'disabled' : ''}>
                    <option value="">-- Unassigned --</option>
                    ${state.users.filter(u => u.role === 'Architect' || u.role === 'HOD').map(u => `
                      <option value="${u.id}" ${u.id === task.assignedUserId ? 'selected' : ''}>${u.name} (${u.role})</option>
                    `).join("")}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Priority (Triage aid only, D-R-16)</label>
                  <select id="task-priority" ${!isHOD ? 'disabled' : ''}>
                    <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
                    <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="High" ${task.priority === 'High' ? 'selected' : ''}>High</option>
                    <option value="Urgent" ${task.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
                  </select>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Start Date</label>
                  <input type="date" id="task-start-date" value="${task.startDate || ''}" ${!isHOD ? 'disabled' : ''}>
                  ${earliestSensibleStart && task.startDate && task.startDate < earliestSensibleStart ? `
                    <span class="form-help" style="color:var(--color-warning);">
                      ⚠ Warning: Start date is earlier than earliest sensible start (${earliestSensibleStart}) from predecessors.
                    </span>
                  ` : ''}
                </div>

                <div class="form-group">
                  <label class="form-label">Duration (Days)</label>
                  <input type="number" id="task-duration" value="${task.durationDays || 7}" ${!isHOD ? 'disabled' : ''}>
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Due Date</label>
                  <input type="date" id="task-due-date" value="${task.dueDate || ''}" ${!isHOD ? 'disabled' : ''}>
                </div>
              </div>

              <!-- Dependencies / Predecessors (§5, D-R-25, D-R-26) -->
              <div class="form-group">
                <label class="form-label">Predecessors (Tasks that must finish before this starts)</label>
                <select id="task-depends-on" multiple style="height:80px;" ${!isHOD ? 'disabled' : ''}>
                  ${projectTasks.map(pt => `
                    <option value="${pt.id}" ${(task.dependsOnTaskIds || []).includes(pt.id) ? 'selected' : ''}>
                      ${pt.drawingName} (${pt.discipline}) — Due: ${pt.dueDate} [${pt.status}]
                    </option>
                  `).join("")}
                </select>
                <span class="form-help">D-R-25/26: Loops and self-dependencies are strictly rejected on save.</span>
              </div>

              ${isHOD ? `
                <div style="display:flex; justify-content:flex-end; margin-bottom:20px;">
                  <button type="submit" class="btn btn-primary btn-sm">Update Planning & Recalculate (D-EV-05)</button>
                </div>
              ` : ''}
            </form>

            <!-- LIVE Planning Conflict & Workload Panel (§6, D-BP-04) -->
            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:16px; margin-bottom:24px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="font-size:13px; color:#ffffff;">Live Workload Conflict & Risk Monitor (§6)</strong>
                <span class="status-badge" style="background:${conflict.loadStatus === 'Overloaded' ? 'var(--color-danger-bg)' : conflict.loadStatus === 'Busy' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)'}; color:${conflict.loadStatus === 'Overloaded' ? 'var(--color-danger)' : conflict.loadStatus === 'Busy' ? 'var(--color-warning)' : 'var(--color-success)'};">
                  Architect Load: ${conflict.loadStatus}
                </span>
              </div>
              <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:8px;">
                Assigned architect has <strong>${conflict.overlappingCount}</strong> other overlapping tasks in this window.
                Studio clustering: <strong>${conflict.clusterProjectsCount}</strong> other projects with drawings due in this timeframe.
              </p>
              ${conflict.loadStatus !== 'Light' ? `
                <div class="alert-banner warning" style="margin-bottom:0; font-size:12px;">
                  Saving with Busy or Overloaded status auto-flags this task as <strong>At Risk</strong> (D-EV-09).
                </div>
              ` : ''}
            </div>

            <!-- §3.11 Formal Revision History (R0, R1... D-R-19 to D-R-24) -->
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h3 style="font-size:15px; font-weight:700; color:#ffffff;">Formal Revisions (${revisions.length})</h3>
                <button class="btn btn-secondary btn-sm" id="btn-upload-revision">+ Upload Revision (D-EV-06)</button>
              </div>

              <div style="display:flex; flex-direction:column; gap:10px;">
                ${revisions.map(rev => {
                  const uploader = state.users.find(u => u.id === rev.uploadedById);
                  const reviewer = state.users.find(u => u.id === rev.reviewedById);
                  return `
                    <div style="background:var(--bg-input); padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                        <div>
                          <strong style="font-family:var(--font-mono); color:var(--brand-gold); font-size:14px;">${rev.revisionCode}</strong>
                          <span style="font-size:13px; font-weight:600; color:#ffffff; margin-left:8px;">${rev.fileName}</span>
                          <span style="font-size:11.5px; color:var(--text-dim); margin-left:6px;">(${rev.fileSize})</span>
                        </div>
                        <div>
                          ${renderRevisionStatusBadge(rev.status)}
                        </div>
                      </div>

                      <div style="font-size:12.5px; color:var(--text-muted); margin-bottom:6px;">
                        <strong>Change:</strong> ${rev.changeDescription}
                      </div>

                      <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; color:var(--text-dim);">
                        <span>Uploaded by ${uploader ? uploader.name : 'Architect'} on ${rev.uploadedDate}</span>
                        ${rev.reviewedDate ? `<span>Reviewed by ${reviewer ? reviewer.name : 'HOD'} on ${rev.reviewedDate}</span>` : ''}
                      </div>

                      ${rev.reviewComment ? `
                        <div style="font-size:12px; color:var(--brand-gold); margin-top:6px; font-style:italic;">
                          Review note: "${rev.reviewComment}"
                        </div>
                      ` : ''}

                      <!-- HOD Review Controls (D-EV-07, D-EV-08, D-R-21) -->
                      ${isHOD && rev.status === 'Under Review' ? `
                        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border-subtle);">
                          <button class="btn btn-danger btn-sm btn-return-rev" data-rev-id="${rev.id}">Return for Rework (D-EV-08)</button>
                          <button class="btn btn-success btn-sm btn-approve-gfc" data-rev-id="${rev.id}">Approve to Final GFC (D-EV-07)</button>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join("")}

                ${revisions.length === 0 ? `<p style="font-size:12px; color:var(--text-dim);">No file revisions uploaded yet.</p>` : ''}
              </div>
            </div>
          </div>

          <!-- Right Column: Checklists, Append-Only Comments, Activity Log -->
          <div style="display:flex; flex-direction:column; gap:20px;">
            <!-- Checklist (§3.15, D-R-17) -->
            <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <strong style="font-size:13px; color:#ffffff;">Checklist (${task.checklist.filter(c=>c.checked).length}/${task.checklist.length})</strong>
              </div>
              <span class="form-help" style="margin-bottom:8px; display:block;">D-R-17: Incomplete checklist never blocks status transition.</span>

              <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
                ${task.checklist.map(item => `
                  <label style="display:flex; align-items:flex-start; gap:8px; font-size:12.5px; cursor:pointer;">
                    <input type="checkbox" class="chk-item-toggle" data-chk-id="${item.id}" ${item.checked ? 'checked' : ''} style="margin-top:3px;">
                    <span style="${item.checked ? 'text-decoration:line-through; color:var(--text-dim);' : 'color:var(--text-main);'}">${item.text}</span>
                  </label>
                `).join("")}
              </div>

              <div style="display:flex; gap:6px;">
                <input type="text" id="new-chk-text" placeholder="Add checklist item..." style="font-size:12px; padding:4px 8px; flex:1;">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-add-chk">+ Add</button>
              </div>
            </div>

            <!-- Comments Thread (§3.14, D-R-30: append-only) -->
            <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
              <strong style="font-size:13px; color:#ffffff; margin-bottom:10px; display:block;">Comments (${task.comments.length})</strong>
              <div style="max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; margin-bottom:10px;">
                ${task.comments.map(c => {
                  const author = state.users.find(u => u.id === c.authorId);
                  return `
                    <div style="background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm); font-size:12px;">
                      <div style="display:flex; justify-content:space-between; color:var(--text-dim); font-size:11px; margin-bottom:2px;">
                        <strong>${author ? author.name : 'User'}</strong>
                        <span>${c.timestamp.replace("T", " ").substring(0, 16)}</span>
                      </div>
                      <div style="color:var(--text-main);">${c.text}</div>
                    </div>
                  `;
                }).join("")}
                ${task.comments.length === 0 ? `<p style="font-size:12px; color:var(--text-dim);">No comments yet.</p>` : ''}
              </div>

              <div style="display:flex; gap:6px;">
                <input type="text" id="new-comment-text" placeholder="Write a comment..." style="font-size:12px; padding:6px 8px; flex:1;">
                <button type="button" class="btn btn-primary btn-sm" id="btn-add-comment">Post</button>
              </div>
              <span class="form-help" style="margin-top:4px; display:block;">D-R-30: Comments are append-only.</span>
            </div>

            <!-- §3.16 Activity Log (Auto append-only) -->
            <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
              <strong style="font-size:13px; color:#ffffff; margin-bottom:8px; display:block;">Activity Log</strong>
              <div style="max-height:160px; overflow-y:auto; font-size:11.5px; color:var(--text-dim); display:flex; flex-direction:column; gap:6px;">
                ${task.activityHistory.map(act => {
                  const actor = state.users.find(u => u.id === act.actorId);
                  return `
                    <div>
                      <span>${act.timestamp.substring(0, 10)}:</span>
                      <strong>${actor ? actor.name.split(" ")[0] : 'System'}</strong> changed
                      <em>${act.field}</em> (${act.fromValue || 'start'} → ${act.toValue})
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="modal-close-footer">Close</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-close-footer")?.addEventListener("click", () => modalRoot.innerHTML = "");

  // Status transitions
  modalRoot.querySelectorAll(".btn-change-status").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetStatus = btn.getAttribute("data-target-status");
      if (targetStatus === "Blocked") {
        openHoldReasonModal(taskId);
      } else {
        try {
          store.updateTaskStatus(taskId, targetStatus);
          openTaskDetailModal(taskId);
          renderDrawingBoard(document.getElementById("main-content"), task.projectId);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });

  // Planning form submit
  document.getElementById("task-planning-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const assignedUserId = document.getElementById("task-assigned-user").value || null;
      const priority = document.getElementById("task-priority").value;
      const startDate = document.getElementById("task-start-date").value;
      const durationDays = Number(document.getElementById("task-duration").value);
      const dueDate = document.getElementById("task-due-date").value;
      const dependsOnTaskIds = Array.from(document.getElementById("task-depends-on").selectedOptions).map(o => o.value);

      store.updateTaskPlanning(taskId, {
        assignedUserId,
        priority,
        startDate,
        durationDays,
        dueDate,
        dependsOnTaskIds
      });

      openTaskDetailModal(taskId);
      renderDrawingBoard(document.getElementById("main-content"), task.projectId);
    } catch (err) {
      alert(err.message);
    }
  });

  // Revision GFC Approve & Return triggers
  modalRoot.querySelectorAll(".btn-approve-gfc").forEach(btn => {
    btn.addEventListener("click", () => {
      const revId = btn.getAttribute("data-rev-id");
      const comment = prompt("Enter GFC approval note:", "Approved as Final GFC");
      try {
        store.approveRevisionGFC(revId, comment);
        openTaskDetailModal(taskId);
        renderDrawingBoard(document.getElementById("main-content"), task.projectId);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  modalRoot.querySelectorAll(".btn-return-rev").forEach(btn => {
    btn.addEventListener("click", () => {
      const revId = btn.getAttribute("data-rev-id");
      const comment = prompt("Enter return feedback (mandatory for rework):");
      if (comment) {
        try {
          store.returnRevision(revId, comment);
          openTaskDetailModal(taskId);
          renderDrawingBoard(document.getElementById("main-content"), task.projectId);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });

  // Revision Upload Modal trigger
  document.getElementById("btn-upload-revision")?.addEventListener("click", () => {
    openUploadRevisionModal(taskId);
  });

  // Checklist items
  modalRoot.querySelectorAll(".chk-item-toggle").forEach(chk => {
    chk.addEventListener("change", () => {
      const chkId = chk.getAttribute("data-chk-id");
      store.toggleChecklistItem(taskId, chkId);
      openTaskDetailModal(taskId);
    });
  });

  document.getElementById("btn-add-chk")?.addEventListener("click", () => {
    const text = document.getElementById("new-chk-text").value;
    if (text) {
      store.addChecklistItem(taskId, text);
      openTaskDetailModal(taskId);
    }
  });

  // Comments
  document.getElementById("btn-add-comment")?.addEventListener("click", () => {
    const text = document.getElementById("new-comment-text").value;
    if (text) {
      store.addComment(taskId, text);
      openTaskDetailModal(taskId);
    }
  });
}

function renderRevisionStatusBadge(status) {
  if (status === "GFC") return `<span class="status-badge badge-task-final">✓ GFC (Approved)</span>`;
  if (status === "Under Review") return `<span class="status-badge badge-task-review">⏳ Under Review</span>`;
  if (status === "Returned") return `<span class="status-badge badge-task-blocked">✕ Returned for Rework</span>`;
  if (status === "Superseded") return `<span class="status-badge" style="background:var(--bg-elevated); color:var(--text-dim);">Superseded</span>`;
  return `<span class="status-badge">${status}</span>`;
}

// Hold Reason Modal (D-R-15: Moving to Blocked requires Hold reason + named owner)
export function openHoldReasonModal(taskId) {
  const modalRoot = document.getElementById("modal-root");
  const state = store.data;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">D-R-15 Guard: Move Task to Blocked</div>
          <button class="modal-close-btn" id="modal-close-hold">✕</button>
        </div>
        <form id="hold-reason-form">
          <div class="modal-body">
            <div class="alert-banner danger">
              D-R-15 Guard: A task moved to Blocked must carry a valid hold reason and a named owner.
            </div>

            <div class="form-group">
              <label class="form-label">Hold Reason (from Master §3.9) <span class="required">*</span></label>
              <select id="hold-reason-id" required>
                ${state.holdReasons.filter(h => h.active).map(h => `
                  <option value="${h.id}">${h.reason}</option>
                `).join("")}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Named Hold Owner <span class="required">*</span></label>
              <select id="hold-owner-id" required>
                ${state.users.map(u => `
                  <option value="${u.id}">${u.name} (${u.role})</option>
                `).join("")}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel-hold">Cancel</button>
            <button type="submit" class="btn btn-danger">Confirm Blocked Status</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close-hold")?.addEventListener("click", () => openTaskDetailModal(taskId));
  document.getElementById("modal-cancel-hold")?.addEventListener("click", () => openTaskDetailModal(taskId));
  document.getElementById("hold-reason-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    store.updateTaskStatus(
      taskId,
      "Blocked",
      document.getElementById("hold-reason-id").value,
      document.getElementById("hold-owner-id").value
    );
    openTaskDetailModal(taskId);
    const task = state.drawingTasks.find(t => t.id === taskId);
    if (task) renderDrawingBoard(document.getElementById("main-content"), task.projectId);
  });
}

// Upload Revision Modal (§3.11, D-R-19, D-R-20, D-R-24)
export function openUploadRevisionModal(taskId) {
  const modalRoot = document.getElementById("modal-root");
  const task = store.data.drawingTasks.find(t => t.id === taskId);
  const taskRevs = store.data.revisions.filter(r => r.taskId === taskId);
  const nextCode = `R${taskRevs.length}`;
  const isR1Plus = taskRevs.length > 0;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">Upload Revision ${nextCode} — ${task ? task.drawingName : ''}</div>
          <button class="modal-close-btn" id="modal-close-rev">✕</button>
        </div>
        <form id="upload-revision-form">
          <div class="modal-body">
            ${isR1Plus ? `
              <div class="alert-banner warning">
                D-R-20 Guard: Change description is MANDATORY for revision R1 and onward.
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label">File Name <span class="required">*</span></label>
              <input type="text" id="rev-filename" value="${task ? task.drawingName.replace(/\s+/g, '_') : 'Drawing'}_${nextCode}.dwg.pdf" required>
            </div>

            <div class="form-group">
              <label class="form-label">Change Description ${isR1Plus ? '<span class="required">* (Mandatory D-R-20)</span>' : ''}</label>
              <textarea id="rev-change-desc" rows="3" placeholder="Specific changes made compared to previous revision..." ${isR1Plus ? 'required' : ''}></textarea>
            </div>

            <div style="font-size:12px; color:var(--text-dim);">
              D-R-23: Submitting revision moves task to <strong>Under Review</strong> for HOD GFC approval.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel-rev">Cancel</button>
            <button type="submit" class="btn btn-primary">Upload & Submit for Review (D-EV-06)</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close-rev")?.addEventListener("click", () => openTaskDetailModal(taskId));
  document.getElementById("modal-cancel-rev")?.addEventListener("click", () => openTaskDetailModal(taskId));
  document.getElementById("upload-revision-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      store.uploadRevision(taskId, {
        fileName: document.getElementById("rev-filename").value,
        changeDescription: document.getElementById("rev-change-desc").value
      });
      openTaskDetailModal(taskId);
      if (task) renderDrawingBoard(document.getElementById("main-content"), task.projectId);
    } catch (err) {
      alert(err.message);
    }
  });
}

// §14 D-S-14 Project Timeline (Gantt Chart View)
export function renderProjectTimeline(container, projectId) {
  const state = store.data;
  const prj = state.projects.find(p => p.id === projectId);
  if (!prj) {
    container.innerHTML = `<div class="page-container"><p>Project not found.</p></div>`;
    return;
  }

  const sched = store.computeProjectSchedule(prj.id);
  const cpSet = new Set(sched.criticalPathIds);
  const tasks = sched.tasks;

  // Compute timeline date range
  let minDate = Infinity;
  let maxDate = -Infinity;
  tasks.forEach(t => {
    if (t.startDate) {
      const s = new Date(t.startDate).getTime();
      if (s < minDate) minDate = s;
    }
    if (t.dueDate) {
      const e = new Date(t.dueDate).getTime();
      if (e > maxDate) maxDate = e;
    }
  });

  if (minDate === Infinity) minDate = Date.now();
  if (maxDate === -Infinity || maxDate <= minDate) maxDate = minDate + 30 * 24 * 60 * 60 * 1000;

  const totalDays = Math.max(15, Math.round((maxDate - minDate) / (24 * 60 * 60 * 1000)));

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
          <a href="#/drawing-board/${prj.id}" class="btn btn-secondary btn-sm">← Drawing Board</a>
          <span style="font-family:var(--font-mono); color:var(--brand-gold); font-weight:700;">${prj.projectCode}</span>
        </div>
        <h1>D-S-14 · Project Timeline & Critical Path Gantt</h1>
        <p class="page-description">
          Task sequencing, dependencies, float days, and the connected zero-float critical path chain controlling finish date.
        </p>
      </div>
      <div class="page-actions">
        <span class="ribbon-critical-path">Derived Finish Date: ${sched.projectFinishDate || 'N/A'}</span>
      </div>
    </div>

    <div class="gantt-chart-wrapper">
      <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-dim); margin-bottom:14px; padding-left:240px;">
        <span>${new Date(minDate).toISOString().split("T")[0]}</span>
        <span>Timeline Span: ${totalDays} Days</span>
        <span>${new Date(maxDate).toISOString().split("T")[0]}</span>
      </div>

      ${tasks.map(t => {
        const isCP = cpSet.has(t.id);
        const float = sched.floatMap[t.id] ?? 0;
        const sTime = t.startDate ? new Date(t.startDate).getTime() : minDate;
        const eTime = t.dueDate ? new Date(t.dueDate).getTime() : sTime + (t.durationDays || 7) * 24 * 60 * 60 * 1000;

        const leftPct = Math.max(0, Math.min(95, ((sTime - minDate) / (maxDate - minDate)) * 100));
        const widthPct = Math.max(4, Math.min(100 - leftPct, ((eTime - sTime) / (maxDate - minDate)) * 100));

        let barClass = "";
        if (t.status === "Final") barClass = "final";
        else if (isCP) barClass = "critical";
        else if (t.deliveryRisk === "At Risk") barClass = "at-risk";

        return `
          <div class="gantt-task-row">
            <div style="padding-right:12px;">
              <strong style="font-size:13px; color:#ffffff; cursor:pointer;" onclick="window.openTaskDetail('${t.id}')">
                ${t.drawingName}
              </strong>
              <div style="font-size:11px; color:var(--text-dim); display:flex; gap:6px;">
                <span>${t.discipline}</span>
                <span>·</span>
                <span>${isCP ? '★ Critical (0d float)' : `${float}d float`}</span>
                ${t.dependsOnTaskIds && t.dependsOnTaskIds.length > 0 ? `<span>· Preds: ${t.dependsOnTaskIds.length}</span>` : ''}
              </div>
            </div>

            <div class="gantt-bar-track">
              <div class="gantt-bar ${barClass}" style="left:${leftPct}%; width:${widthPct}%; cursor:pointer;" onclick="window.openTaskDetail('${t.id}')">
                ${t.drawingName} (${t.durationDays}d)
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  window.openTaskDetail = (id) => openTaskDetailModal(id);
}
