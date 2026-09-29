// Seed Data for Crescent Design Module based on detailed.md Appendix A, B, and specification
export const initialSeedData = {
  // Actors / Users
  currentUser: {
    id: "usr_hod",
    name: "Ar. Vikramaditya Rao",
    role: "HOD", // "HOD" | "COO" | "Architect"
    title: "Head of Design",
    email: "vikram@crescentdesign.in",
    hasZoho: true
  },
  users: [
    { id: "usr_coo", name: "Mr. Rajesh Verma", role: "COO", title: "Chief Operating Officer", email: "rajesh@crescentdesign.in", hasZoho: true },
    { id: "usr_hod", name: "Ar. Vikramaditya Rao", role: "HOD", title: "Head of Design", email: "vikram@crescentdesign.in", hasZoho: true },
    { id: "usr_arch1", name: "Ar. Rohan Mehta", role: "Architect", title: "Senior Project Architect", email: "rohan@crescentdesign.in", hasZoho: true },
    { id: "usr_arch2", name: "Ar. Priya Sharma", role: "Architect", title: "Project Architect", email: "priya@crescentdesign.in", hasZoho: false },
    { id: "usr_arch3", name: "Ar. Ananya Iyer", role: "Architect", title: "Architectural Designer", email: "ananya@crescentdesign.in", hasZoho: true }
  ],

  // Master Data (D-S-20)
  // §3.17 Enquiry Stages (HOD configurable)
  enquiryStages: [
    { id: "stg_1", name: "Initial Contact", displayOrder: 1, active: true },
    { id: "stg_2", name: "Site Measurement & Survey", displayOrder: 2, active: true },
    { id: "stg_3", name: "Concept & Scheme Review", displayOrder: 3, active: true },
    { id: "stg_4", name: "Quotation & Commercials", displayOrder: 4, active: true },
    { id: "stg_5", name: "Confirmation & Onboarding", displayOrder: 5, active: true },
    { id: "stg_lost", name: "Lost", displayOrder: 6, active: true, isLost: true }
  ],

  // §3.18 Meeting Types (D-R-54: exactly one Budget Planning, exactly one Client Quotation)
  meetingTypes: [
    { id: "mt_disc", name: "Initial Discovery", specialRole: "None", active: true },
    { id: "mt_site", name: "Site Reconnaissance", specialRole: "None", active: true },
    { id: "mt_concept", name: "Mood & Concept Alignment", specialRole: "None", active: true },
    { id: "mt_budget", name: "Internal Budget & Scope Review", specialRole: "Budget Planning", active: true },
    { id: "mt_quote", name: "Client Proposal Presentation", specialRole: "Client Quotation", active: true },
    { id: "mt_tech", name: "Technical Coordination", specialRole: "None", active: true }
  ],

  // §3.19 Deliverable Types
  deliverableTypes: [
    { id: "dt_mood", name: "Mood Board", active: true },
    { id: "dt_scheme", name: "Scheme Plan", active: true },
    { id: "dt_3d", name: "3D Visualisation Render", active: true },
    { id: "dt_layout", name: "Furniture Layout", active: true },
    { id: "dt_material", name: "Material Palette Board", active: true }
  ],

  // §3.9 Hold Reasons
  holdReasons: [
    { id: "hr_1", reason: "Client decision pending", active: true },
    { id: "hr_2", reason: "Site condition mismatch", active: true },
    { id: "hr_3", reason: "Technical clarification needed", active: true },
    { id: "hr_4", reason: "Vendor or consultant input awaited", active: true },
    { id: "hr_5", reason: "Internal resourcing", active: true },
    { id: "hr_6", reason: "Other", active: true }
  ],

  // §3.7 Drawing Types (from Appendix A)
  drawingTypes: [
    // Architectural
    { id: "dt_site_lay", name: "Site Layout", discipline: "Architectural", active: true },
    { id: "dt_set_plan", name: "Setting-out Plan", discipline: "Architectural", active: true },
    { id: "dt_sch_lay", name: "Scheme layout", discipline: "Architectural", active: true },
    { id: "dt_furn_lay", name: "Furniture layout", discipline: "Architectural", active: true },
    { id: "dt_flr_plan", name: "Floor plan", discipline: "Architectural", active: true },
    { id: "dt_joinery", name: "Joinery Details", discipline: "Architectural", active: true },
    { id: "dt_elev", name: "Elevations", discipline: "Architectural", active: true },
    { id: "dt_sections", name: "Sections", discipline: "Architectural", active: true },
    { id: "dt_roof", name: "Roof drawings", discipline: "Architectural", active: true },

    // Structural
    { id: "dt_pile_lay", name: "Pile Layout", discipline: "Structural", active: true },
    { id: "dt_col_lay", name: "Column layout", discipline: "Structural", active: true },
    { id: "dt_plinth", name: "Plinth Beam Layout", discipline: "Structural", active: true },
    { id: "dt_slab_det", name: "Roof slab Details", discipline: "Structural", active: true },

    // Mechanical
    { id: "dt_hvac", name: "HVAC drawings", discipline: "Mechanical", active: true },
    { id: "dt_fire", name: "Fire safety layout", discipline: "Mechanical", active: true },

    // Electrical
    { id: "dt_el_overall", name: "Overall electrical layout", discipline: "Electrical", active: true },
    { id: "dt_el_ceiling", name: "False Ceiling Electrical Layout", discipline: "Electrical", active: true },
    { id: "dt_el_cctv", name: "CCTV layout", discipline: "Electrical", active: true },

    // Plumbing
    { id: "dt_pl_drainage", name: "External Drainage Layout", discipline: "Plumbing", active: true },
    { id: "dt_pl_water", name: "Water supply Layout", discipline: "Plumbing", active: true },

    // Landscape
    { id: "dt_ls_layout", name: "Landscape layout", discipline: "Landscape", active: true },
    { id: "dt_ls_hard", name: "Hardscape layout", discipline: "Landscape", active: true },

    // Interior Design
    { id: "dt_in_3d", name: "3D Renders", discipline: "Interior Design", active: true },
    { id: "dt_in_ceiling", name: "False Ceiling Layout", discipline: "Interior Design", active: true },
    { id: "dt_in_finishes", name: "Material finishes", discipline: "Interior Design", active: true },

    // As-Built
    { id: "dt_ab_flr", name: "Floor plan (As-Built)", discipline: "As-Built", active: true }
  ],

  // §3.8 Drawing Templates (from Appendix B)
  drawingTemplates: [
    {
      id: "tmpl_full",
      name: "Full Design & Build",
      active: true,
      drawingTypeIds: [
        "dt_site_lay", "dt_set_plan", "dt_flr_plan", "dt_elev", "dt_sections",
        "dt_pile_lay", "dt_col_lay", "dt_plinth", "dt_slab_det",
        "dt_hvac", "dt_fire", "dt_el_overall", "dt_el_ceiling",
        "dt_pl_drainage", "dt_pl_water", "dt_ls_layout", "dt_in_3d", "dt_in_ceiling"
      ]
    },
    {
      id: "tmpl_lighter",
      name: "Structural + MEP + Floor Plan",
      active: true,
      drawingTypeIds: [
        "dt_flr_plan", "dt_elev", "dt_sections",
        "dt_pile_lay", "dt_col_lay", "dt_plinth",
        "dt_el_overall", "dt_pl_water", "dt_pl_drainage"
      ]
    }
  ],

  // §3.1 Enquiries (Seed)
  enquiries: [
    {
      id: "enq-001",
      enquiryNumber: "ENQ-2026-081",
      clientName: "Sanjay & Meera Singhania",
      clientContact: "+91 98200 45678 · meera.singhania@estateventures.in",
      propertyAddress: "Villa 14, Whispering Palms Estate, Alibaug, MH",
      engagementType: "Luxury Villa Architecture & Turnkey Interior",
      assignedUserId: "usr_arch1",
      stageId: "stg_4",
      lostReason: null,
      createdDate: "2026-09-01",
      // Independent Status Badges (§3.1, D-R-55)
      quotation: {
        quotationNumber: "QT-2026-019",
        draftedBy: "usr_hod",
        pricedValue: 18500000,
        scopeSummary: "Comprehensive Architectural Engineering, Structural G+1 Villa, Bespoke Interiors & Infinity Pool Landscaping.",
        validityDays: 30,
        status: "Pending COO", // Draft / Pending COO / Approved / Sent / Signed
        cooApprovedBy: null,
        cooApprovedDate: null,
        sentDate: null
      },
      confirmationGate: {
        proposalFile: null,
        advanceAmount: 1850000,
        advanceReceiptRef: null,
        hodApproved: false,
        cooApproved: false,
        confirmedDate: null,
        status: "Pending" // Not started / Pending / Passed
      },
      projectSetup: {
        status: "N/A", // N/A / Pending COO / Approved
        projectId: null,
        cooApprovedBy: null,
        cooApprovedDate: null
      }
    },
    {
      id: "enq-002",
      enquiryNumber: "ENQ-2026-082",
      clientName: "Dr. Arvind Kejriwal & Sunita",
      clientContact: "+91 99101 23456 · arvind.k@delhiclinic.org",
      propertyAddress: "Penthouse 4201, Crescent Bay Tower B, Parel, Mumbai",
      engagementType: "Penthouse Interior & MEP Overhaul",
      assignedUserId: "usr_arch2",
      stageId: "stg_5",
      lostReason: null,
      createdDate: "2026-09-05",
      quotation: {
        quotationNumber: "QT-2026-020",
        draftedBy: "usr_arch2",
        pricedValue: 12400000,
        scopeSummary: "Complete luxury interior renovation, Italian marble detailing, smart home automation, false ceiling MEP.",
        validityDays: 30,
        status: "Signed",
        cooApprovedBy: "usr_coo",
        cooApprovedDate: "2026-09-12",
        sentDate: "2026-09-13"
      },
      confirmationGate: {
        proposalFile: "Signed_Proposal_Penthouse4201.pdf",
        advanceAmount: 2500000,
        advanceReceiptRef: "HDFC-NEFT-202609180042",
        hodApproved: true,
        cooApproved: true,
        confirmedDate: "2026-09-18",
        status: "Passed"
      },
      projectSetup: {
        status: "Pending COO", // Ready in COO queue D-S-08
        projectId: "prj-002",
        cooApprovedBy: null,
        cooApprovedDate: null
      }
    },
    {
      id: "enq-003",
      enquiryNumber: "ENQ-2026-083",
      clientName: "Mr. Kabir Oberoi",
      clientContact: "+91 98450 78910 · kabir@oberoicapital.com",
      propertyAddress: "Plot 88, Jubilee Hills Road No. 36, Hyderabad",
      engagementType: "Commercial Design Studio & Art Gallery",
      assignedUserId: "usr_arch3",
      stageId: "stg_1",
      lostReason: null,
      createdDate: "2026-09-20",
      quotation: null,
      confirmationGate: {
        status: "Not started"
      },
      projectSetup: {
        status: "N/A"
      }
    }
  ],

  // §3.2 Meetings (Seed)
  meetings: [
    {
      id: "mtg-001",
      meetingNumber: 1,
      enquiryId: "enq-001",
      projectId: null,
      typeId: "mt_disc",
      startTime: "2026-09-03T10:30",
      endTime: "2026-09-03T12:00",
      mode: "Office",
      videoLink: "",
      invitedUserIds: ["usr_hod", "usr_arch1"],
      clientAttendees: ["Sanjay Singhania", "Meera Singhania"],
      agenda: "Site brief, vastu requirements, budget appetite and spatial expectations for Alibaug villa.",
      minutesText: "Client confirmed interest in tropical modernism with basalt stone and teak wood accents. Demands 4 king suites and an infinity pool.",
      decisions: "Proceed to physical site reconnaissance and topographic survey.",
      actionItems: [
        { id: "act_1", text: "Organize total station survey team", ownerId: "usr_arch1", dueDate: "2026-09-06", status: "Completed" },
        { id: "act_2", text: "Prepare precedent study on tropical villas", ownerId: "usr_arch1", dueDate: "2026-09-08", status: "Completed" }
      ],
      scopeImpact: false,
      commercialImpactAmount: 0,
      linkedDeliverableIds: ["deliv-001"],
      linkedQuotationNumber: null,
      decision: null,
      rescheduleHistory: [],
      status: "Closed", // Scheduled / Held / Minutes drafted / Sent / Closed
      createdDate: "2026-09-01"
    },
    {
      id: "mtg-002",
      meetingNumber: 2,
      enquiryId: "enq-001",
      projectId: null,
      typeId: "mt_site",
      startTime: "2026-09-06T11:00",
      endTime: "2026-09-06T15:00",
      mode: "Site",
      videoLink: "",
      invitedUserIds: ["usr_arch1"],
      clientAttendees: ["Sanjay Singhania"],
      agenda: "Topography check, soil visual inspection, high-tide level verification.",
      minutesText: "Site boundaries verified with setback clearances. Identified slope gradient of 4% towards western creek.",
      decisions: "Basement parking not recommended due to water table. Ground plinth elevated by 1.2m.",
      actionItems: [
        { id: "act_3", text: "Complete room & boundary measurement entry", ownerId: "usr_arch1", dueDate: "2026-09-07", status: "Completed" }
      ],
      scopeImpact: true,
      commercialImpactAmount: 350000,
      linkedDeliverableIds: [],
      linkedQuotationNumber: null,
      decision: null,
      rescheduleHistory: [],
      status: "Closed",
      createdDate: "2026-09-04"
    },
    {
      id: "mtg-003",
      meetingNumber: 3,
      enquiryId: "enq-001",
      projectId: null,
      typeId: "mt_budget",
      startTime: "2026-09-26T15:00",
      endTime: "2026-09-26T16:00",
      mode: "Office",
      videoLink: "",
      invitedUserIds: ["usr_coo", "usr_hod"],
      clientAttendees: [],
      agenda: "Internal COO review of Quotation QT-2026-019 for Singhania Villa.",
      minutesText: "Reviewing bill of quantities, structural consultants fees and architect staffing allocations.",
      decisions: "Pending COO final review.",
      actionItems: [
        { id: "act_4", text: "Refine MEP consultant contingency budget", ownerId: "usr_hod", dueDate: "2026-09-26", status: "Pending" }
      ],
      scopeImpact: false,
      commercialImpactAmount: 0,
      linkedDeliverableIds: [],
      linkedQuotationNumber: "QT-2026-019",
      decision: null, // "Approved" | "Returned" | null
      rescheduleHistory: [],
      status: "Scheduled",
      createdDate: "2026-09-22"
    }
  ],

  // §3.3 Site Measurements
  measurements: [
    {
      id: "meas-001",
      enquiryId: "enq-001",
      projectId: null,
      meetingId: "mtg-002",
      measuredDate: "2026-09-06",
      measuredBy: "usr_arch1",
      rooms: [
        { name: "Ground Living & Dining Pavilion", lengthM: 14.5, widthM: 9.2, areaSqM: 133.4 },
        { name: "Master Suite 1 (East Wing)", lengthM: 7.8, widthM: 6.5, areaSqM: 50.7 },
        { name: "Guest Suites (x2)", lengthM: 9.0, widthM: 6.0, areaSqM: 54.0 },
        { name: "Kitchen & Utility Pantry", lengthM: 5.5, widthM: 4.8, areaSqM: 26.4 },
        { name: "Covered Verandah & Deck", lengthM: 18.0, widthM: 4.5, areaSqM: 81.0 },
        { name: "First Floor Family Lounge", lengthM: 8.5, widthM: 6.2, areaSqM: 52.7 },
        { name: "Master Suite 2 (Upper)", lengthM: 8.0, widthM: 6.5, areaSqM: 52.0 }
      ],
      totalAreaSqM: 450.2, // ~4,845 sq ft
      photos: ["site_photo_crest_1.jpg", "boundary_markers_west.jpg"],
      siteConditionNotes: "Rocky soil strata, lush palm cover on east quadrant. 15m legal setback from high tide water line confirmed."
    },
    {
      id: "meas-002",
      enquiryId: "enq-002",
      projectId: "prj-002",
      meetingId: null,
      measuredDate: "2026-09-08",
      measuredBy: "usr_arch2",
      rooms: [
        { name: "Grand Foyer & Gallery", lengthM: 6.2, widthM: 4.1, areaSqM: 25.42 },
        { name: "Double Height Living Salon", lengthM: 12.0, widthM: 8.5, areaSqM: 102.0 },
        { name: "Master Bedroom & Walk-in Wardrobe", lengthM: 9.2, widthM: 6.4, areaSqM: 58.88 },
        { name: "Kids & Guest Bedrooms (x3)", lengthM: 14.0, widthM: 6.0, areaSqM: 84.0 },
        { name: "Balcony Deck Overlooking Sea", lengthM: 15.0, widthM: 3.2, areaSqM: 48.0 }
      ],
      totalAreaSqM: 318.3,
      photos: ["penthouse_hall_elevation.jpg"],
      siteConditionNotes: "Bare shell handed over by developer. Slab level variations within 15mm tolerance."
    }
  ],

  // §3.4 Design Deliverables
  deliverables: [
    {
      id: "deliv-001",
      enquiryId: "enq-001",
      deliverableTypeId: "dt_mood",
      title: "Singhania Villa — Earthy Tropical Concept Mood Board",
      versionNumber: 1,
      preparedById: "usr_arch1",
      presentedAtMeetingId: "mtg-001",
      files: ["Singhania_Villa_MoodBoard_v1.pdf"],
      clientResponse: "Accepted with changes", // Accepted / Accepted with changes / Rejected
      clientComments: "Loved the raw sandstone and warm ambient lighting. Requested lighter wood stain for bedroom ceilings.",
      supersedesId: null,
      createdDate: "2026-09-02"
    },
    {
      id: "deliv-002",
      enquiryId: "enq-001",
      deliverableTypeId: "dt_mood",
      title: "Singhania Villa — Earthy Tropical Concept Mood Board",
      versionNumber: 2,
      preparedById: "usr_arch1",
      presentedAtMeetingId: null,
      files: ["Singhania_Villa_MoodBoard_v2.pdf"],
      clientResponse: "Accepted",
      clientComments: "Light teak stain approved.",
      supersedesId: "deliv-001",
      createdDate: "2026-09-08"
    },
    {
      id: "deliv-003",
      enquiryId: "enq-001",
      deliverableTypeId: "dt_scheme",
      title: "Singhania Villa — Preliminary Scheme Layout Plan",
      versionNumber: 1,
      preparedById: "usr_arch1",
      presentedAtMeetingId: null,
      files: ["Singhania_Villa_SchemePlan_R0.dwg.pdf"],
      clientResponse: null,
      clientComments: "",
      supersedesId: null,
      createdDate: "2026-09-15"
    }
  ],

  // §3.6 Projects
  projects: [
    {
      id: "prj-001",
      projectCode: "PRJ-CR-2026-01",
      projectName: "Aura Oceanfront Residences",
      projectTypeMasters: "Luxury Residential G+2",
      drawingTemplateId: "tmpl_full",
      clientName: "Aura Developers Consortium",
      areaSqM: 1450.0,
      enquiryId: null,
      quotationValue: 42000000,
      cooApprovedStatus: "Approved", // Approved -> Unlocked board
      cooApprovedBy: "usr_coo",
      cooApprovedDate: "2026-08-10",
      boardLocked: false,
      createdDate: "2026-08-10"
    },
    {
      id: "prj-002",
      projectCode: "PRJ-CR-2026-02",
      projectName: "The Crescent Penthouse 4201",
      projectTypeMasters: "High-end Penthouse Interior",
      drawingTemplateId: "tmpl_lighter",
      clientName: "Dr. Arvind Kejriwal & Sunita",
      areaSqM: 318.3,
      enquiryId: "enq-002",
      quotationValue: 12400000,
      cooApprovedStatus: "Pending COO", // Board is locked pending COO approval D-S-08
      cooApprovedBy: null,
      cooApprovedDate: null,
      boardLocked: true,
      createdDate: "2026-09-18"
    }
  ],

  // §3.10 Drawing Tasks (Seed for prj-001)
  drawingTasks: [
    {
      id: "tsk-001",
      projectId: "prj-001",
      drawingName: "Site Layout & Boundary Setting",
      discipline: "Architectural",
      assignedUserId: "usr_arch1",
      watchers: ["usr_hod"],
      status: "Final", // To Do / In Progress / Under Review / Blocked / Final (GFC)
      priority: "High", // Low / Medium / High / Urgent
      labels: ["Exterior", "Statutory"],
      startDate: "2026-08-12",
      durationDays: 8,
      dueDate: "2026-08-20",
      percentComplete: 100,
      dependsOnTaskIds: [],
      deliveryRisk: "Clear", // Clear / At Risk
      holdReasonId: null,
      holdOwnerId: null,
      checklist: [
        { id: "chk_1", text: "Verify coastal boundary setback markers", checked: true, checkedBy: "usr_arch1", checkedDate: "2026-08-14" },
        { id: "chk_2", text: "Coordinate entrance ramp with road datum", checked: true, checkedBy: "usr_arch1", checkedDate: "2026-08-18" }
      ],
      referenceAttachments: ["boundary_survey_official.dwg"],
      comments: [
        { id: "c_1", authorId: "usr_hod", timestamp: "2026-08-13T11:00", text: "Ensure 6m fire tender access path is marked clearly." },
        { id: "c_2", authorId: "usr_arch1", timestamp: "2026-08-14T16:30", text: "Fire tender pathway integrated and cross-verified with CFO norms." }
      ],
      activityHistory: [
        { id: "act_log_1", actorId: "usr_hod", timestamp: "2026-08-12T10:00", field: "status", fromValue: "To Do", toValue: "In Progress" },
        { id: "act_log_2", actorId: "usr_arch1", timestamp: "2026-08-19T14:00", field: "status", fromValue: "In Progress", toValue: "Under Review" },
        { id: "act_log_3", actorId: "usr_hod", timestamp: "2026-08-20T17:00", field: "status", fromValue: "Under Review", toValue: "Final" }
      ],
      createdDate: "2026-08-12"
    },
    {
      id: "tsk-002",
      projectId: "prj-001",
      drawingName: "Pile Layout & Foundation Grids",
      discipline: "Structural",
      assignedUserId: "usr_arch1",
      watchers: ["usr_hod"],
      status: "Final",
      priority: "Urgent",
      labels: ["Substructure", "Critical"],
      startDate: "2026-08-21",
      durationDays: 10,
      dueDate: "2026-08-31",
      percentComplete: 100,
      dependsOnTaskIds: ["tsk-001"],
      deliveryRisk: "Clear",
      holdReasonId: null,
      holdOwnerId: null,
      checklist: [
        { id: "chk_3", text: "Cross check geo-technical test load capacity", checked: true, checkedBy: "usr_arch1", checkedDate: "2026-08-25" },
        { id: "chk_4", text: "Structural peer review signoff", checked: true, checkedBy: "usr_hod", checkedDate: "2026-08-30" }
      ],
      referenceAttachments: ["soil_bearing_test_rep.pdf"],
      comments: [
        { id: "c_3", authorId: "usr_arch1", timestamp: "2026-08-22T09:00", text: "Piles designed at 600mm dia with 18m refusal depth." }
      ],
      activityHistory: [
        { id: "act_log_4", actorId: "usr_hod", timestamp: "2026-08-31T18:00", field: "status", fromValue: "Under Review", toValue: "Final" }
      ],
      createdDate: "2026-08-12"
    },
    {
      id: "tsk-003",
      projectId: "prj-001",
      drawingName: "Column layout & Plinth Beam Details",
      discipline: "Structural",
      assignedUserId: "usr_arch1",
      watchers: ["usr_hod"],
      status: "In Progress",
      priority: "High",
      labels: ["Substructure"],
      startDate: "2026-09-01",
      durationDays: 12,
      dueDate: "2026-09-13",
      percentComplete: 25,
      dependsOnTaskIds: ["tsk-002"],
      deliveryRisk: "At Risk", // Architect has multiple overlapping tasks
      holdReasonId: null,
      holdOwnerId: null,
      checklist: [
        { id: "chk_5", text: "Column schedule reinforcement table", checked: true, checkedBy: "usr_arch1", checkedDate: "2026-09-04" },
        { id: "chk_6", text: "Check water bar detailing at plinth beam joints", checked: false, checkedBy: null, checkedDate: null }
      ],
      referenceAttachments: ["grade_beam_moment_calc.xlsx"],
      comments: [
        { id: "c_4", authorId: "usr_hod", timestamp: "2026-09-05T12:00", text: "Rohan, please prioritize plinth beam water bar detailing. Due date passed." }
      ],
      activityHistory: [
        { id: "act_log_5", actorId: "usr_hod", timestamp: "2026-09-01T09:00", field: "status", fromValue: "To Do", toValue: "In Progress" }
      ],
      createdDate: "2026-08-12"
    },
    {
      id: "tsk-004",
      projectId: "prj-001",
      drawingName: "Ground Floor Plan & Working Drawings",
      discipline: "Architectural",
      assignedUserId: "usr_arch2",
      watchers: ["usr_hod", "usr_arch1"],
      status: "Under Review",
      priority: "Urgent",
      labels: ["Architecture", "Key Deliverable"],
      startDate: "2026-09-05",
      durationDays: 14,
      dueDate: "2026-09-19",
      percentComplete: 75,
      dependsOnTaskIds: ["tsk-003"],
      deliveryRisk: "Clear",
      holdReasonId: null,
      holdOwnerId: null,
      checklist: [
        { id: "chk_7", text: "All room internal clear dimensions verified", checked: true, checkedBy: "usr_arch2", checkedDate: "2026-09-17" },
        { id: "chk_8", text: "Window & door lintel heights annotated", checked: true, checkedBy: "usr_arch2", checkedDate: "2026-09-18" }
      ],
      referenceAttachments: ["arch_scheme_approved.pdf"],
      comments: [
        { id: "c_5", authorId: "usr_arch2", timestamp: "2026-09-19T17:15", text: "Revision R1 submitted with modified courtyard opening width. Ready for HOD GFC review." }
      ],
      activityHistory: [
        { id: "act_log_6", actorId: "usr_arch2", timestamp: "2026-09-19T17:15", field: "status", fromValue: "In Progress", toValue: "Under Review" }
      ],
      createdDate: "2026-08-12"
    },
    {
      id: "tsk-005",
      projectId: "prj-001",
      drawingName: "Overall Electrical & Conduit Looping Layout",
      discipline: "Electrical",
      assignedUserId: "usr_arch3",
      watchers: ["usr_hod"],
      status: "Blocked",
      priority: "Medium",
      labels: ["MEP", "Services"],
      startDate: "2026-09-20",
      durationDays: 8,
      dueDate: "2026-09-28",
      percentComplete: 25,
      dependsOnTaskIds: ["tsk-004"],
      deliveryRisk: "At Risk",
      holdReasonId: "hr_4", // Vendor or consultant input awaited
      holdOwnerId: "usr_arch3",
      checklist: [
        { id: "chk_9", text: "Main distribution board load summary", checked: false, checkedBy: null, checkedDate: null },
        { id: "chk_10", text: "HVAC condenser power points coordination", checked: false, checkedBy: null, checkedDate: null }
      ],
      referenceAttachments: [],
      comments: [
        { id: "c_6", authorId: "usr_arch3", timestamp: "2026-09-21T10:00", text: "Awaiting incoming power sanction capacity from local electricity utility before sizing feeder cables." }
      ],
      activityHistory: [
        { id: "act_log_7", actorId: "usr_arch3", timestamp: "2026-09-21T10:00", field: "status", fromValue: "To Do", toValue: "Blocked" }
      ],
      createdDate: "2026-08-12"
    },
    {
      id: "tsk-006",
      projectId: "prj-001",
      drawingName: "External Drainage & Rainwater Harvest Layout",
      discipline: "Plumbing",
      assignedUserId: "usr_arch3",
      watchers: [],
      status: "To Do",
      priority: "Medium",
      labels: ["Plumbing"],
      startDate: "2026-09-25",
      durationDays: 7,
      dueDate: "2026-10-02",
      percentComplete: 0,
      dependsOnTaskIds: ["tsk-004"],
      deliveryRisk: "Clear",
      holdReasonId: null,
      holdOwnerId: null,
      checklist: [
        { id: "chk_11", text: "Determine invert levels of storm drain", checked: false, checkedBy: null, checkedDate: null }
      ],
      referenceAttachments: [],
      comments: [],
      activityHistory: [],
      createdDate: "2026-08-12"
    },
    {
      id: "tsk-007",
      projectId: "prj-001",
      drawingName: "Roof slab Details & Parapet Construction",
      discipline: "Structural",
      assignedUserId: "usr_arch1",
      watchers: ["usr_hod"],
      status: "To Do",
      priority: "High",
      labels: ["Superstructure"],
      startDate: "2026-09-28",
      durationDays: 9,
      dueDate: "2026-10-07",
      percentComplete: 0,
      dependsOnTaskIds: ["tsk-004"],
      deliveryRisk: "Clear",
      holdReasonId: null,
      holdOwnerId: null,
      checklist: [],
      referenceAttachments: [],
      comments: [],
      activityHistory: [],
      createdDate: "2026-08-12"
    }
  ],

  // §3.11 Revisions
  revisions: [
    {
      id: "rev-001",
      taskId: "tsk-001",
      revisionCode: "R0",
      fileName: "CR_PRJ01_ARCH_SITE_R0.dwg.pdf",
      fileSize: "4.8 MB",
      uploadedById: "usr_arch1",
      uploadedDate: "2026-08-18",
      changeDescription: "Initial issue for statutory clearance review.",
      status: "GFC", // Draft / Under Review / GFC / Returned / Superseded
      reviewedById: "usr_hod",
      reviewedDate: "2026-08-20",
      reviewComment: "Approved as GFC for excavation layout."
    },
    {
      id: "rev-002",
      taskId: "tsk-002",
      revisionCode: "R0",
      fileName: "CR_PRJ01_STR_PILE_R0.dwg.pdf",
      fileSize: "6.2 MB",
      uploadedById: "usr_arch1",
      uploadedDate: "2026-08-29",
      changeDescription: "Preliminary pile layout based on soil report.",
      status: "Superseded",
      reviewedById: "usr_hod",
      reviewedDate: "2026-08-30",
      reviewComment: "Pile cap depth needs 100mm increase on grid 4."
    },
    {
      id: "rev-003",
      taskId: "tsk-002",
      revisionCode: "R1",
      fileName: "CR_PRJ01_STR_PILE_R1.dwg.pdf",
      fileSize: "6.4 MB",
      uploadedById: "usr_arch1",
      uploadedDate: "2026-08-31",
      changeDescription: "Increased pile cap depth to 750mm on grid 4 per HOD notes.",
      status: "GFC",
      reviewedById: "usr_hod",
      reviewedDate: "2026-08-31",
      reviewComment: "Approved as Final GFC."
    },
    {
      id: "rev-004",
      taskId: "tsk-004",
      revisionCode: "R0",
      fileName: "CR_PRJ01_ARCH_GF_PLAN_R0.dwg.pdf",
      fileSize: "8.1 MB",
      uploadedById: "usr_arch2",
      uploadedDate: "2026-09-14",
      changeDescription: "Initial release of working drawing plans.",
      status: "Returned",
      reviewedById: "usr_hod",
      reviewedDate: "2026-09-16",
      reviewComment: "Courtyard opening interferes with column C7. Please adjust."
    },
    {
      id: "rev-005",
      taskId: "tsk-004",
      revisionCode: "R1",
      fileName: "CR_PRJ01_ARCH_GF_PLAN_R1.dwg.pdf",
      fileSize: "8.3 MB",
      uploadedById: "usr_arch2",
      uploadedDate: "2026-09-19",
      changeDescription: "Recessed courtyard opening by 450mm to clear column C7 casing.",
      status: "Under Review",
      reviewedById: null,
      reviewedDate: null,
      reviewComment: ""
    }
  ],

  // §3.13 RFIs
  rfis: [
    {
      id: "rfi-001",
      rfiNumber: "RFI-PRJ01-001",
      projectId: "prj-001",
      drawingTaskId: "tsk-003",
      raisedById: "usr_arch1",
      raisedDate: "2026-09-10",
      question: "Plinth beam water-proofing sleeve: MEP contractor proposing 150mm core cuts through beam B12 for drainage header. Does structural permit this?",
      photos: ["beam_sleeve_site_photo.jpg"],
      blockingWork: true,
      idleManpowerEstimate: 45000, // INR or currency unit per day/duration
      assignedUserId: "usr_hod",
      slaDueDate: "2026-09-13", // 3 working days from raised date
      response: "Core cut through B12 is strictly prohibited due to mid-span shear stresses. Route drainage below ground slab through designated service trench.",
      respondedById: "usr_hod",
      outcome: "Clarified", // Clarified / New revision needed / Needs a meeting
      closedDate: "2026-09-12",
      status: "Closed"
    },
    {
      id: "rfi-002",
      rfiNumber: "RFI-PRJ01-002",
      projectId: "prj-001",
      drawingTaskId: "tsk-005",
      raisedById: "usr_arch3",
      raisedDate: "2026-09-21",
      question: "Transformer substation setback requirement on eastern road edge. Electrical utility inspector requesting 3.5m clearance instead of 2.5m.",
      photos: ["substation_clearance_sketch.jpg"],
      blockingWork: true,
      idleManpowerEstimate: 60000,
      assignedUserId: "usr_hod",
      slaDueDate: "2026-09-24", // Already past 2026-09-24 -> Breached SLA!
      response: "",
      respondedById: null,
      outcome: null,
      closedDate: null,
      status: "Open" // SLA Breached! (D-BP-01, D-R-29)
    }
  ]
};
