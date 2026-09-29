// Screens D-S-15 (RFI Log) and D-S-16 (RFI Detail)
// Enforces D-R-27, D-R-28, D-R-29, D-BP-01

import { store } from "../state.js";

// §14 D-S-15 RFI Log Screen
export function renderRFILog(container) {
  const state = store.data;
  const rfis = state.rfis;

  const openRFIs = rfis.filter(r => r.status === "Open");
  const breachedRFIs = rfis.filter(r => r.status === "Open" && r.slaBreached);
  const totalIdleCost = openRFIs.filter(r => r.blockingWork).reduce((sum, r) => sum + (Number(r.idleManpowerEstimate) || 0), 0);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>
          <span>D-S-15 · Request For Information (RFI) Log</span>
        </h1>
        <p class="page-description">
          Site and architect queries to design, with continuous SLA monitoring and idle manpower cost tracking.
        </p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="btn-raise-rfi">+ Raise RFI</button>
      </div>
    </div>

    <!-- KPI / Stats Tile (§14 D-S-15 & §15) -->
    <div class="kpi-grid">
      <div class="kpi-card accent-danger">
        <div class="kpi-label">Open Blocking Idle Cost</div>
        <div class="kpi-value" style="color:var(--color-danger);">₹${totalIdleCost.toLocaleString('en-IN')}</div>
        <div class="kpi-subtext">Sum of idle manpower estimates on open blocking RFIs (D-R-27)</div>
      </div>

      <div class="kpi-card accent-warning">
        <div class="kpi-label">SLA Breached Escalations</div>
        <div class="kpi-value" style="color:var(--color-warning);">${breachedRFIs.length}</div>
        <div class="kpi-subtext">Escalated to HOD · Never auto-closes (D-R-29, D-BP-01)</div>
      </div>

      <div class="kpi-card accent-primary">
        <div class="kpi-label">Total Open RFIs</div>
        <div class="kpi-value">${openRFIs.length}</div>
        <div class="kpi-subtext">Across all active studio projects</div>
      </div>
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>RFI #</th>
            <th>Project</th>
            <th>Related Drawing</th>
            <th>Question Summary</th>
            <th>Blocking Work?</th>
            <th>Idle Cost</th>
            <th>SLA Due</th>
            <th>Status</th>
            <th>Outcome</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rfis.map(r => {
            const prj = state.projects.find(p => p.id === r.projectId);
            const task = state.drawingTasks.find(t => t.id === r.drawingTaskId);
            return `
              <tr>
                <td><strong style="font-family:var(--font-mono); color:var(--brand-gold);">${r.rfiNumber}</strong></td>
                <td><strong>${prj ? prj.projectCode : '—'}</strong></td>
                <td>${task ? task.drawingName : 'General'}</td>
                <td style="max-width:280px;">
                  <span style="font-size:13px; color:var(--text-main); line-height:1.3; display:inline-block;">${r.question}</span>
                </td>
                <td>
                  ${r.blockingWork ? `
                    <span class="status-badge" style="background:var(--color-danger-bg); color:var(--color-danger); font-weight:700;">⚠ BLOCKING</span>
                  ` : `
                    <span style="color:var(--text-dim); font-size:12px;">Non-blocking</span>
                  `}
                </td>
                <td>
                  ${r.blockingWork ? `<strong style="color:var(--color-danger); font-family:var(--font-mono);">₹${(r.idleManpowerEstimate || 0).toLocaleString('en-IN')}</strong>` : '—'}
                </td>
                <td>
                  <span style="font-family:var(--font-mono); font-size:12px; ${r.slaBreached ? 'color:var(--color-danger); font-weight:700;' : ''}">
                    ${r.slaDueDate} ${r.slaBreached ? '⚠ BREACH' : ''}
                  </span>
                </td>
                <td>
                  ${r.status === 'Closed' ? `
                    <span class="status-badge badge-conf-passed">✓ Closed</span>
                  ` : r.slaBreached ? `
                    <span class="status-badge" style="background:var(--color-danger-bg); color:var(--color-danger);">SLA Breached</span>
                  ` : `
                    <span class="status-badge badge-quot-pending">Open</span>
                  `}
                </td>
                <td>
                  ${r.outcome ? `<span class="status-badge" style="background:var(--bg-elevated);">${r.outcome}</span>` : '—'}
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="window.openRFIDetailModal('${r.id}')">
                    ${r.status === 'Open' ? 'Answer / Close (D-S-16)' : 'View Detail'}
                  </button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("btn-raise-rfi")?.addEventListener("click", openRaiseRFIModal);
  window.openRFIDetailModal = (id) => openRFIDetailModal(id);
}

// §14 D-S-16 RFI Detail Modal
export function openRFIDetailModal(rfiId) {
  const modalRoot = document.getElementById("modal-root");
  const state = store.data;
  const rfi = state.rfis.find(r => r.id === rfiId);
  if (!rfi) return;

  const prj = state.projects.find(p => p.id === rfi.projectId);
  const task = state.drawingTasks.find(t => t.id === rfi.drawingTaskId);
  const raiser = state.users.find(u => u.id === rfi.raisedById);
  const isClosed = rfi.status === "Closed";

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="modal-title">D-S-16 · ${rfi.rfiNumber}</div>
            ${rfi.blockingWork ? `<span class="status-badge" style="background:var(--color-danger-bg); color:var(--color-danger);">⚠ BLOCKING WORK</span>` : ''}
            ${rfi.slaBreached ? `<span class="status-badge" style="background:var(--color-danger-bg); color:var(--color-danger);">SLA BREACHED (D-R-29)</span>` : ''}
          </div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>

        <form id="rfi-close-form">
          <div class="modal-body">
            <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:16px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px; color:var(--text-dim);">
                <span>Project: <strong>${prj ? prj.projectName : 'N/A'}</strong></span>
                <span>Drawing Task: <strong>${task ? task.drawingName : 'General Project RFI'}</strong></span>
                <span>Raised By: <strong>${raiser ? raiser.name : 'Architect'}</strong> on ${rfi.raisedDate}</span>
              </div>
              <h3 style="font-size:15px; color:#ffffff; margin-bottom:8px;">Question:</h3>
              <p style="font-size:14px; line-height:1.5; color:var(--text-main);">${rfi.question}</p>

              ${rfi.blockingWork ? `
                <div style="margin-top:12px; padding:10px 14px; background:rgba(239, 68, 68, 0.1); border-left:4px solid var(--color-danger); border-radius:4px;">
                  <strong style="color:var(--color-danger); font-size:13px;">Estimated Idle Manpower Cost: ₹${(rfi.idleManpowerEstimate || 0).toLocaleString('en-IN')}</strong>
                  <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">Escalated to HOD attention due to site stoppage risk.</div>
                </div>
              ` : ''}
            </div>

            <!-- Design Response & Outcome (D-R-28 Guard) -->
            <div class="form-group">
              <label class="form-label">Design Response <span class="required">*</span></label>
              <textarea id="rfi-response" rows="4" placeholder="Clarification or instruction from design team..." ${isClosed ? 'readonly' : ''} required>${rfi.response || ''}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Outcome <span class="required">* (D-R-28 Guard: Required to close)</span></label>
              <select id="rfi-outcome" ${isClosed ? 'disabled' : ''} required>
                <option value="">-- Select Required Outcome --</option>
                <option value="Clarified" ${rfi.outcome === 'Clarified' ? 'selected' : ''}>Clarified (No drawing update needed)</option>
                <option value="New revision needed" ${rfi.outcome === 'New revision needed' ? 'selected' : ''}>New revision needed (Drawing update triggered)</option>
                <option value="Needs a meeting" ${rfi.outcome === 'Needs a meeting' ? 'selected' : ''}>Needs a meeting (Technical coordination required)</option>
              </select>
            </div>

            ${isClosed ? `
              <div class="alert-banner success" style="margin-bottom:0;">
                ✓ Closed on ${rfi.closedDate} by ${state.users.find(u=>u.id===rfi.respondedById)?.name || 'Design Lead'}. Outcome: <strong>${rfi.outcome}</strong>.
              </div>
            ` : ''}
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Close</button>
            ${!isClosed ? `
              <button type="submit" class="btn btn-success">Answer & Close RFI (D-R-28)</button>
            ` : ''}
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");

  document.getElementById("rfi-close-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      store.closeRFI(rfi.id, {
        response: document.getElementById("rfi-response").value,
        outcome: document.getElementById("rfi-outcome").value
      });
      modalRoot.innerHTML = "";
      renderRFILog(document.getElementById("main-content"));
    } catch (err) {
      alert(err.message);
    }
  });
}

// Raise RFI Modal (D-R-27)
export function openRaiseRFIModal() {
  const modalRoot = document.getElementById("modal-root");
  const state = store.data;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">+ Raise Request For Information (RFI)</div>
          <button class="modal-close-btn" id="modal-close">✕</button>
        </div>
        <form id="raise-rfi-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Project <span class="required">*</span></label>
              <select id="rfi-project-id" required>
                ${state.projects.map(p => `<option value="${p.id}">${p.projectCode} · ${p.projectName}</option>`).join("")}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Related Drawing Task (Optional)</label>
              <select id="rfi-task-id">
                <option value="">-- General / Non-drawing RFI --</option>
                ${state.drawingTasks.map(t => `<option value="${t.id}">${t.drawingName} (${t.discipline})</option>`).join("")}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Question / Technical Query <span class="required">*</span></label>
              <textarea id="rfi-question" rows="3" placeholder="State question clearly, including grid locations or dimensions..." required></textarea>
            </div>

            <!-- D-R-27: Blocking work guard -->
            <div style="background:var(--bg-input); padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:16px;">
              <label style="display:flex; align-items:center; gap:8px; font-weight:700; color:#ffffff; cursor:pointer;">
                <input type="checkbox" id="rfi-blocking-work">
                <span>Blocking Work on Site / Studio (D-R-27 Guard)</span>
              </label>

              <div id="idle-cost-group" style="display:none; margin-top:10px;">
                <label class="form-label">Idle Manpower Estimate (₹) <span class="required">* (Mandatory if blocking)</span></label>
                <input type="number" id="rfi-idle-cost" placeholder="e.g. 50000">
                <span class="form-help" style="color:var(--color-danger);">
                  D-R-27 Guard: A blocking RFI must carry an idle manpower estimate.
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Raise RFI (D-EV-11)</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("rfi-blocking-work")?.addEventListener("change", (e) => {
    document.getElementById("idle-cost-group").style.display = e.target.checked ? "block" : "none";
  });

  document.getElementById("modal-close")?.addEventListener("click", () => modalRoot.innerHTML = "");
  document.getElementById("modal-cancel")?.addEventListener("click", () => modalRoot.innerHTML = "");

  document.getElementById("raise-rfi-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      store.raiseRFI({
        projectId: document.getElementById("rfi-project-id").value,
        drawingTaskId: document.getElementById("rfi-task-id").value || null,
        question: document.getElementById("rfi-question").value,
        blockingWork: document.getElementById("rfi-blocking-work").checked,
        idleManpowerEstimate: document.getElementById("rfi-idle-cost")?.value || 0
      });
      modalRoot.innerHTML = "";
      renderRFILog(document.getElementById("main-content"));
    } catch (err) {
      alert(err.message);
    }
  });
}
