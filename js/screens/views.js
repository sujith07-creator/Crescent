// Screens D-S-17 (My Tasks), D-S-18 (Project Dashboard), D-S-19 (Studio Workload),
// and §15 Reports & KPIs Dashboard

import { store } from "../state.js";
import { openTaskDetailModal } from "./projects.js";

// §14 D-S-17 My Tasks (Architect Personal Cross-Project View)
export function renderMyTasks(container) {
  const state = store.data;
  const currentUserId = state.currentUser.id;

  // Upcoming meetings where current user is an invitee (D-BP-06)
  const myMeetings = state.meetings
    .filter(m => (m.invitedUserIds || []).includes(currentUserId) && m.status !== 'Closed')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // Drawing tasks assigned to current user
  const myTasks = state.drawingTasks.filter(t => t.assignedUserId === currentUserId);
  const activeTasks = myTasks.filter(t => t.status !== "Final");
  const blockedTasks = myTasks.filter(t => t.status === "Blocked");
  const underReviewTasks = myTasks.filter(t => t.status === "Under Review");

  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const dueThisWeekTasks = activeTasks.filter(t => t.dueDate && t.dueDate <= nextWeek);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>
          <span>D-S-17 · My Tasks</span>
        </h1>
        <p class="page-description">
          Personal cross-project workspace for ${state.currentUser.name} (${state.currentUser.title}).
          Upcoming meetings listed above task work streams.
        </p>
      </div>
      <div class="page-actions">
        <span class="status-badge" style="background:var(--primary-light); color:#818cf8; font-size:13px; padding:6px 12px;">
          ${activeTasks.length} Active Drawings · ${myMeetings.length} Upcoming Meetings
        </span>
      </div>
    </div>

    <!-- Pinned Upcoming Meetings Section (§14 D-S-17) -->
    <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:20px; margin-bottom:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="font-size:16px; font-weight:700; color:#ffffff; display:flex; align-items:center; gap:8px;">
          <span>📅 My Upcoming Meetings & Calendar Blocks (D-BP-06)</span>
        </h3>
        <span style="font-size:12px; color:var(--text-dim);">${myMeetings.length} Scheduled</span>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
        ${myMeetings.map(m => {
          const enq = state.enquiries.find(e => e.id === m.enquiryId);
          const prj = state.projects.find(p => p.id === m.projectId);
          const mType = state.meetingTypes.find(t => t.id === m.typeId);
          return `
            <div style="background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:14px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span class="status-badge" style="background:var(--primary-light); color:#818cf8;">${mType ? mType.name : 'Meeting'}</span>
                <span style="font-family:var(--font-mono); font-size:11.5px; color:var(--brand-gold);">${m.startTime.replace("T", " ")}</span>
              </div>
              <strong style="color:#ffffff; font-size:13.5px; display:block; margin-bottom:4px;">
                ${enq ? enq.clientName : prj ? prj.projectName : 'Project Meeting'}
              </strong>
              <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
                Mode: <strong>${m.mode}</strong> · Attendees: ${m.invitedUserIds ? m.invitedUserIds.length : 1}
              </div>
              <div style="font-size:12px; color:var(--text-dim);">
                Agenda: ${m.agenda || 'Discussion and review'}
              </div>
            </div>
          `;
        }).join("")}

        ${myMeetings.length === 0 ? `
          <div style="grid-column:1/-1; color:var(--text-dim); font-size:13px; padding:10px;">
            No meetings scheduled this week.
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Blocked Tasks Alert (if any) -->
    ${blockedTasks.length > 0 ? `
      <div class="alert-banner danger" style="margin-bottom:24px;">
        <strong>⚠ ${blockedTasks.length} Drawings Blocked:</strong> Requires external or client resolution before you can resume work.
      </div>
    ` : ''}

    <!-- Task Groups -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
      <!-- Due This Week & In Progress -->
      <div>
        <h3 style="font-size:16px; font-weight:700; color:#ffffff; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
          <span>⚡ Due This Week & In Progress (${dueThisWeekTasks.length})</span>
        </h3>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${dueThisWeekTasks.map(t => renderMyTaskItem(t, state)).join("")}
          ${dueThisWeekTasks.length === 0 ? `<p style="color:var(--text-dim); font-size:13px;">No tasks due this week.</p>` : ''}
        </div>
      </div>

      <!-- Under Review & Blocked -->
      <div>
        <h3 style="font-size:16px; font-weight:700; color:#ffffff; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
          <span>⏳ Under Review & Blocked (${underReviewTasks.length + blockedTasks.length})</span>
        </h3>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${[...underReviewTasks, ...blockedTasks].map(t => renderMyTaskItem(t, state)).join("")}
          ${(underReviewTasks.length + blockedTasks.length) === 0 ? `<p style="color:var(--text-dim); font-size:13px;">No tasks under review or blocked.</p>` : ''}
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll(".my-task-card").forEach(card => {
    card.addEventListener("click", () => {
      const taskId = card.getAttribute("data-task-id");
      openTaskDetailModal(taskId);
    });
  });
}

function renderMyTaskItem(task, state) {
  const prj = state.projects.find(p => p.id === task.projectId);
  return `
    <div class="kanban-card my-task-card" data-task-id="${task.id}" style="border-left:4px solid ${task.status === 'Blocked' ? 'var(--color-danger)' : task.status === 'Under Review' ? 'var(--color-warning)' : 'var(--primary)'};">
      <div class="card-top-row">
        <span style="font-size:11px; color:var(--brand-gold); font-family:var(--font-mono); font-weight:700;">${prj ? prj.projectCode : 'PRJ'}</span>
        <span class="status-badge" style="background:var(--bg-elevated); font-size:11px;">${task.status}</span>
      </div>
      <div class="card-title">${task.drawingName}</div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; color:var(--text-dim); margin-top:8px;">
        <span>Discipline: <strong>${task.discipline}</strong></span>
        <span>Due: <strong style="color:var(--text-main); font-family:var(--font-mono);">${task.dueDate}</strong></span>
      </div>
    </div>
  `;
}

// §14 D-S-18 Project Dashboard Screen
export function renderProjectDashboard(container, projectId) {
  const state = store.data;
  const prj = state.projects.find(p => p.id === projectId) || state.projects[0];
  if (!prj) {
    container.innerHTML = `<div class="page-container"><p>No projects available.</p></div>`;
    return;
  }

  const tasks = state.drawingTasks.filter(t => t.projectId === prj.id);
  const sched = store.computeProjectSchedule(prj.id);
  const cpSet = new Set(sched.criticalPathIds);

  const finalTasks = tasks.filter(t => t.status === "Final");
  const atRiskTasks = tasks.filter(t => t.status !== "Final" && t.deliveryRisk === "At Risk");
  const blockedTasks = tasks.filter(t => t.status === "Blocked");
  const progressPct = tasks.length > 0 ? Math.round((finalTasks.length / tasks.length) * 100) : 0;

  // Discipline breakdown
  const discMap = {};
  tasks.forEach(t => {
    if (!discMap[t.discipline]) discMap[t.discipline] = { total: 0, final: 0 };
    discMap[t.discipline].total++;
    if (t.status === "Final") discMap[t.discipline].final++;
  });

  // Final GFC Drawing Register
  const gfcRegister = [];
  tasks.forEach(t => {
    const revs = state.revisions.filter(r => r.taskId === t.id);
    const gfcRev = revs.find(r => r.status === "GFC");
    if (gfcRev) {
      gfcRegister.push({
        task: t,
        rev: gfcRev
      });
    }
  });

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
          <span class="status-badge" style="background:var(--primary-light); color:#818cf8; font-weight:700;">Executive Overview</span>
          <span style="font-family:var(--font-mono); color:var(--brand-gold); font-weight:700;">${prj.projectCode}</span>
          ${prj.boardLocked ? `<span class="status-badge badge-setup-pending">🔒 Board Locked (Pending COO Gate D-S-08)</span>` : `<span class="status-badge badge-setup-approved">✓ Unlocked</span>`}
        </div>
        <h1>D-S-18 · Project Dashboard</h1>
        <p class="page-description">Production progress, discipline breakdown, at-risk count, critical-path summary, and the official Final (GFC) drawing register.</p>
      </div>

      <div class="page-actions" style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="font-size:12px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Switch Project:</label>
          <select id="dash-project-switcher" style="padding:6px 12px; background:var(--bg-input); border:1px solid var(--border-strong); border-radius:var(--radius-sm); font-size:13px; font-weight:600; color:var(--text-main); cursor:pointer;">
            ${state.projects.map(p => `
              <option value="${p.id}" ${p.id === prj.id ? 'selected' : ''}>
                ${p.projectCode} · ${p.projectName}
              </option>
            `).join("")}
          </select>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/drawing-board/${prj.id}'">Drawing Board (D-S-12)</button>
        <button class="btn btn-outline btn-sm" onclick="window.location.hash='#/timeline/${prj.id}'">Gantt Timeline (D-S-14)</button>
      </div>
    </div>

    <!-- Progress & Overview KPI Grid -->
    <div class="kpi-grid">
      <div class="kpi-card accent-primary">
        <div class="kpi-label">Production Progress</div>
        <div class="kpi-value">${progressPct}%</div>
        <div class="kpi-subtext">${finalTasks.length} of ${tasks.length} Drawings at Final GFC</div>
      </div>

      <div class="kpi-card accent-danger">
        <div class="kpi-label">Critical Path Chain</div>
        <div class="kpi-value">${sched.criticalPathIds.length}</div>
        <div class="kpi-subtext">Finish Date: <strong style="font-family:var(--font-mono);">${sched.projectFinishDate || 'TBD'}</strong></div>
      </div>

      <div class="kpi-card accent-gold">
        <div class="kpi-label">Drawings At Risk</div>
        <div class="kpi-value" style="color:var(--brand-gold);">${atRiskTasks.length}</div>
        <div class="kpi-subtext">${blockedTasks.length} Blocked · ${tasks.filter(t=>t.isOverdue).length} Overdue</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 2fr; gap:24px; margin-bottom:32px;">
      <!-- Discipline Breakdown -->
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:20px;">
        <h3 style="font-size:15px; font-weight:700; color:#ffffff; margin-bottom:14px;">Discipline Breakdown</h3>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${Object.entries(discMap).map(([disc, stats]) => {
            const pct = Math.round((stats.final / stats.total) * 100);
            return `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:4px;">
                  <strong style="color:var(--text-main);">${disc}</strong>
                  <span style="font-family:var(--font-mono); color:var(--text-muted);">${stats.final}/${stats.total} (${pct}%)</span>
                </div>
                <div style="height:6px; background:var(--bg-elevated); border-radius:3px; overflow:hidden;">
                  <div style="height:100%; width:${pct}%; background:${pct === 100 ? 'var(--color-success)' : 'var(--primary)'};"></div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Critical Path Summary -->
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:20px;">
        <h3 style="font-size:15px; font-weight:700; color:#ffffff; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
          <span class="ribbon-critical-path">★ Critical Path Summary</span>
          <span style="font-size:12px; font-weight:normal; color:var(--text-dim);">(Controls project delivery date)</span>
        </h3>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${sched.criticalPathIds.map(id => {
            const t = tasks.find(tsk => tsk.id === id);
            if (!t) return '';
            const arch = state.users.find(u => u.id === t.assignedUserId);
            return `
              <div style="background:var(--bg-input); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong style="color:#ffffff; font-size:13px;">${t.drawingName}</strong>
                  <div style="font-size:11.5px; color:var(--text-dim);">
                    ${t.discipline} · Assigned: ${arch ? arch.name : 'Unassigned'}
                  </div>
                </div>
                <div style="text-align:right;">
                  <span class="status-badge" style="background:var(--bg-elevated);">${t.status}</span>
                  <div style="font-family:var(--font-mono); font-size:11px; color:var(--brand-gold); margin-top:2px;">Due: ${t.dueDate}</div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>

    <!-- Final (GFC) Drawing Register (§14 D-S-18) -->
    <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="font-size:16px; font-weight:700; color:#ffffff;">
          Final (GFC) Drawing Register (${gfcRegister.length})
        </h3>
        <span style="font-size:12px; color:var(--text-dim);">Official buildable drawing issue list for site & procurement</span>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Drawing Name</th>
              <th>Discipline</th>
              <th>Approved GFC Revision</th>
              <th>File Name</th>
              <th>Approved By (HOD)</th>
              <th>Approved Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${gfcRegister.map(({ task, rev }) => {
              const reviewer = state.users.find(u => u.id === rev.reviewedById);
              return `
                <tr class="gfc-register-row" data-task-id="${task.id}" style="cursor:pointer;" title="Click to view task detail">
                  <td><strong style="color:#ffffff;">${task.drawingName}</strong></td>
                  <td>${task.discipline}</td>
                  <td><strong style="font-family:var(--font-mono); color:var(--brand-gold);">${rev.revisionCode}</strong></td>
                  <td><span style="font-family:var(--font-mono); font-size:12px;">${rev.fileName}</span></td>
                  <td>${reviewer ? reviewer.name : 'HOD'}</td>
                  <td>${rev.reviewedDate}</td>
                  <td><span class="status-badge badge-task-final">✓ Good For Construction</span></td>
                </tr>
              `;
            }).join("")}
            ${gfcRegister.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align:center; padding:30px; color:var(--text-dim);">No drawings approved to Final (GFC) yet.</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("dash-project-switcher")?.addEventListener("change", (e) => {
    window.location.hash = `#/project-dashboard/${e.target.value}`;
  });

  container.querySelectorAll(".gfc-register-row").forEach(row => {
    row.addEventListener("click", () => {
      const taskId = row.getAttribute("data-task-id");
      openTaskDetailModal(taskId);
    });
  });
}

// §14 D-S-19 Studio Workload Screen
export function renderStudioWorkload(container) {
  const state = store.data;
  const architects = state.users.filter(u => u.role === "Architect" || u.role === "HOD");

  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Studio-wide At Risk tasks
  const atRiskTasks = state.drawingTasks.filter(t => t.status !== "Final" && t.deliveryRisk === "At Risk");

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>
          <span>D-S-19 · Studio Workload</span>
        </h1>
        <p class="page-description">
          Cross-project calendar showing drawing-task windows AND scheduled meeting blocks on the same calendar (D-BP-05, D-BP-06).
        </p>
      </div>
      <div class="page-actions">
        <span class="ribbon-at-risk">${atRiskTasks.length} Studio-wide At Risk Drawings</span>
      </div>
    </div>

    <!-- Architect Workload Cards -->
    <div style="display:flex; flex-direction:column; gap:24px; margin-bottom:32px;">
      ${architects.map(arch => {
        const load = store.computeArchitectWorkload(arch.id, today, nextWeek);
        const myTasks = state.drawingTasks.filter(t => t.assignedUserId === arch.id && t.status !== "Final");
        const myMeetings = state.meetings.filter(m => (m.invitedUserIds || []).includes(arch.id) && m.status !== "Closed");

        let badgeBg = "var(--color-success-bg)";
        let badgeColor = "var(--color-success)";
        if (load.loadStatus === "Overloaded") {
          badgeBg = "var(--color-danger-bg)";
          badgeColor = "var(--color-danger)";
        } else if (load.loadStatus === "Busy") {
          badgeBg = "var(--color-warning-bg)";
          badgeColor = "var(--color-warning)";
        }

        return `
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div class="user-avatar" style="width:40px; height:40px; font-size:16px;">${arch.name.charAt(0)}</div>
                <div>
                  <h3 style="font-size:16px; font-weight:700; color:#ffffff;">${arch.name}</h3>
                  <p style="font-size:12px; color:var(--text-dim);">${arch.title} · ${arch.email}</p>
                </div>
              </div>

              <div style="text-align:right;">
                <span class="status-badge" style="background:${badgeBg}; color:${badgeColor}; font-size:13px; font-weight:700; padding:4px 10px;">
                  Load: ${load.loadStatus} (${load.overlappingCount} overlapping tasks)
                </span>
                <div style="font-size:11px; color:var(--text-dim); margin-top:4px;">
                  ${arch.hasZoho ? '✓ Zoho Calendar Synced' : 'Standard In-app Calendar'}
                </div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <!-- Assigned Live Drawings -->
              <div style="background:var(--bg-input); padding:12px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                <strong style="font-size:12.5px; color:var(--brand-gold); text-transform:uppercase; display:block; margin-bottom:8px;">
                  Active Drawing Tasks (${myTasks.length})
                </strong>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${myTasks.map(t => {
                    const prj = state.projects.find(p => p.id === t.projectId);
                    return `
                      <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-main);">
                        <span>${t.drawingName} <small style="color:var(--text-dim);">(${prj ? prj.projectCode : ''})</small></span>
                        <span style="font-family:var(--font-mono); color:var(--text-muted);">${t.dueDate}</span>
                      </div>
                    `;
                  }).join("")}
                  ${myTasks.length === 0 ? `<span style="font-size:12px; color:var(--text-dim);">No active tasks assigned</span>` : ''}
                </div>
              </div>

              <!-- Scheduled Meetings & Calendar Blocks (D-BP-06) -->
              <div style="background:var(--bg-input); padding:12px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                <strong style="font-size:12.5px; color:#818cf8; text-transform:uppercase; display:block; margin-bottom:8px;">
                  Scheduled Meeting Blocks (${myMeetings.length})
                </strong>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${myMeetings.map(m => {
                    const mType = state.meetingTypes.find(t => t.id === m.typeId);
                    return `
                      <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-main);">
                        <span>📅 Meeting #${m.meetingNumber} (${mType ? mType.name : 'Meeting'})</span>
                        <span style="font-family:var(--font-mono); color:var(--text-muted);">${m.startTime.replace("T", " ")}</span>
                      </div>
                    `;
                  }).join("")}
                  ${myMeetings.length === 0 ? `<span style="font-size:12px; color:var(--text-dim);">No meeting blocks this week</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <!-- Firm-wide At Risk List -->
    <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:20px;">
      <h3 style="font-size:16px; font-weight:700; color:#ffffff; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
        <span class="ribbon-at-risk">⚠ Firm-Wide At Risk Drawing List (${atRiskTasks.length})</span>
      </h3>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Drawing Name</th>
              <th>Project</th>
              <th>Assigned Architect</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${atRiskTasks.map(t => {
              const prj = state.projects.find(p => p.id === t.projectId);
              const arch = state.users.find(u => u.id === t.assignedUserId);
              return `
                <tr>
                  <td><strong>${t.drawingName}</strong></td>
                  <td>${prj ? prj.projectCode : '—'}</td>
                  <td>${arch ? arch.name : 'Unassigned'}</td>
                  <td><span style="font-family:var(--font-mono);">${t.dueDate}</span></td>
                  <td><span class="priority-pill priority-${t.priority}">${t.priority}</span></td>
                  <td><span class="status-badge" style="background:var(--bg-elevated);">${t.status}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="window.openTaskDetailModal('${t.id}')">Resolve Task</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  window.openTaskDetailModal = (id) => openTaskDetailModal(id);
}

// §15 Reports & KPIs Screen
export function renderReportsDashboard(container) {
  const kpis = store.getKPIs();

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>
          <span>§15 · Reports & KPIs</span>
        </h1>
        <p class="page-description">
          The 7 Core Management Indicators specified in §15 for studio capacity, schedule adherence, and commercial velocity.
        </p>
      </div>
    </div>

    <div class="kpi-grid">
      <!-- 1. Drawings at risk -->
      <div class="kpi-card accent-danger">
        <div class="kpi-label">1. Drawings At Risk</div>
        <div class="kpi-value" style="color:var(--color-danger);">${kpis.atRiskCount}</div>
        <div class="kpi-subtext">The single number that answers "is the studio overcommitted right now" (Owner: HOD)</div>
      </div>

      <!-- 2. Critical-path adherence -->
      <div class="kpi-card accent-success">
        <div class="kpi-label">2. Critical-Path Adherence</div>
        <div class="kpi-value" style="color:var(--color-success);">${kpis.cpAdherencePct}%</div>
        <div class="kpi-subtext">CP tasks finished on/before due date ÷ total CP tasks closed (Owner: HOD)</div>
      </div>

      <!-- 3. Architect load distribution -->
      <div class="kpi-card accent-warning">
        <div class="kpi-label">3. Architect Load Distribution</div>
        <div class="kpi-value" style="color:var(--color-warning);">${kpis.busyOrOverloadedCount} / ${kpis.totalArchitects}</div>
        <div class="kpi-subtext">Architects currently Busy or Overloaded (Staffing/hiring signal)</div>
      </div>

      <!-- 4. RFI idle cost, open -->
      <div class="kpi-card accent-danger">
        <div class="kpi-label">4. RFI Idle Cost (Open)</div>
        <div class="kpi-value" style="color:var(--color-danger);">₹${kpis.openIdleCost.toLocaleString('en-IN')}</div>
        <div class="kpi-subtext">Sum of idle estimates on open blocking RFIs (Cost of slow design answers)</div>
      </div>

      <!-- 5. Revision churn -->
      <div class="kpi-card accent-primary">
        <div class="kpi-label">5. Revision Churn</div>
        <div class="kpi-value">${kpis.revChurn}</div>
        <div class="kpi-subtext">Average revisions per task before GFC approval</div>
      </div>

      <!-- 6. Cycle Time -->
      <div class="kpi-card accent-gold">
        <div class="kpi-label">6. Meeting-to-Confirmation</div>
        <div class="kpi-value" style="color:var(--brand-gold);">${kpis.cycleTimeDays} Days</div>
        <div class="kpi-subtext">Average days from first meeting to confirmed project (Sales efficiency)</div>
      </div>

      <!-- 7. GFC Throughput -->
      <div class="kpi-card accent-success">
        <div class="kpi-label">7. GFC Throughput</div>
        <div class="kpi-value" style="color:var(--color-success);">${kpis.gfcThroughput}</div>
        <div class="kpi-subtext">Drawings reaching Final per week across studio projects (Raw production rate)</div>
      </div>
    </div>
  `;
}
