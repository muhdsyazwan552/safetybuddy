import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import InspectorLayout from '@/Layouts/InspectorLayout';

// ─── Reusable field components ─────────────────────────────────────────────

const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Error = ({ msg }) =>
  msg ? <p className="mt-1 text-xs text-red-500 font-medium">{msg}</p> : null;

const Input = ({ label, required, error, className = '', ...props }) => (
  <div className={className}>
    <Label required={required}>{label}</Label>
    <input
      {...props}
      className={`w-full border rounded-md px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'
        }`}
    />
    <Error msg={error} />
  </div>
);

const Select = ({ label, required, error, children, className = '', ...props }) => (
  <div className={className}>
    <Label required={required}>{label}</Label>
    <select
      {...props}
      className={`w-full border rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all bg-white shadow-sm appearance-none ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'
        }`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
    >
      {children}
    </select>
    <Error msg={error} />
  </div>
);

const Textarea = ({ label, required, error, className = '', ...props }) => (
  <div className={className}>
    <Label required={required}>{label}</Label>
    <textarea
      {...props}
      rows={3}
      className={`w-full border rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-none shadow-sm ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'
        }`}
    />
    <Error msg={error} />
  </div>
);

// ─── Section wrapper ────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 bg-slate-50/50 border-b border-slate-200">
      <div className="w-1 h-4 bg-blue-600 rounded-full" />
      <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ─── Step indicator ─────────────────────────────────────────────────────────

const steps = [
  { label: 'Basic Info' },
  { label: 'Classification' },
  { label: 'Case Details' },
  { label: 'Follow-up' },
  { label: 'Impact' },
];

// ─── Main Component ─────────────────────────────────────────────────────────

const IncidentCreate = ({
  title = 'Report Incident',
  portal = 'admin',
  selfStaffId = null,
  endpoints = { store: '/incident', assignments: '/incident/project-assignments/', staff: '/incident/subcon-staff/', back: '/incident-statistic' },
  userCompanyId,
  projects = [],
  companies = [],
  subconCompanies = [],
  incidentTypes = [],
  injuryTypes = [],
  bodyParts = [],
  staffList = [],
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [filteredSubconCompanies, setFilteredSubconCompanies] = useState([]);
  const [filteredStaffList, setFilteredStaffList] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [subconStaff, setSubconStaff] = useState([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const isInspector = portal === 'inspector';
  const Layout = isInspector ? InspectorLayout : AppLayout;

  const { data, setData, post, processing, errors, reset } = useForm({
    // Basic Information
    incident_date: '',
    company_id: userCompanyId || '', // Auto-set from auth user's company
    project_id: '',
    subcon_company_id: '',
    location: '',
    reported_by: '', // Will be auto-set on backend
    responsible_by: '',

    // Incident Classification
    incident_id: '',
    injury_id: '',
    body_part: '',

    // LTI fields
    lti_worker_count: '',
    lti_days_lost: '',
    lti_man_hours_lost: '',

    // Case Details
    incident_description: '',
    immediate_cause: '',
    underlying_cause: '',
    attachment_upload: null,

    // Follow-up & Actions
    immediate_action: '',
    corrective: '',

    // Impact & Recording
    manhours_lost: '',

    // Subcontractor staff involved
    staff_ids: [],
  });

  // Fetch project assignments when project changes
  useEffect(() => {
    if (data.project_id) {
      setIsLoadingAssignments(true);
      const url = `${endpoints.assignments}${data.project_id}`;
      console.log('[Incident] Fetching:', url);

      fetch(url)
        .then(res => {
          console.log('[Incident] Response status:', res.status, res.statusText);
          console.log('[Incident] Content-Type:', res.headers.get('content-type'));
          return res.text(); // read as text first so we can log raw body
        })
        .then(text => {
          console.log('[Incident] Raw response body:', text);
          const json = JSON.parse(text);
          console.log('[Incident] Parsed JSON:', json);
          console.log('[Incident] subconCompanies:', json.subconCompanies);
          console.log('[Incident] assignedStaff:', json.assignedStaff);
          setFilteredSubconCompanies(json.subconCompanies);
          setFilteredStaffList(json.assignedStaff);
          setData('subcon_company_id', '');
          setData('responsible_by', selfStaffId ? String(selfStaffId) : '');
          setData('review_by', '');
          setIsLoadingAssignments(false);
        })
        .catch(err => {
          console.error('[Incident] Fetch error:', err);
          setIsLoadingAssignments(false);
        });
    } else {
      setFilteredSubconCompanies([]);
      setFilteredStaffList([]);
    }
  }, [data.project_id]);

  // Staff of the chosen subcontractor can be ticked as involved in the incident
  useEffect(() => {
    setData('staff_ids', []);
    if (!data.subcon_company_id) {
      setSubconStaff([]);
      return;
    }
    setIsLoadingStaff(true);
    fetch(`${endpoints.staff}${data.subcon_company_id}`, { headers: { Accept: 'application/json' } })
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .then(json => setSubconStaff(json.staff || []))
      .catch(() => setSubconStaff([]))
      .finally(() => setIsLoadingStaff(false));
  }, [data.subcon_company_id]);

  const toggleInvolved = (id) =>
    setData('staff_ids', data.staff_ids.includes(id) ? data.staff_ids.filter(x => x !== id) : [...data.staff_ids, id]);

  const selectedType = incidentTypes.find(t => String(t.id) === String(data.incident_id));

  const handleSubmit = (e) => {
    e.preventDefault();
    post(endpoints.store, {
      forceFormData: true,
      onSuccess: () => reset(),
    });
  };

  const goNext = () => setCurrentStep(s => Math.min(s + 1, steps.length - 1));
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 0));

  // ── Immediate cause options
  const immediateCauses = [
    'Unsafe Act',
    'Unsafe Condition',
    'Equipment Failure',
    'Procedure Violation',
    'Other',
  ];

  // ── Immediate action options
  const immediateActions = [
    'Work stopped / activity suspended',
    'Area isolated / barricaded',
    'First aid given',
    'Injured person sent for medical treatment',
    'Equipment shut down / power isolated',
    'Hazard removed (spill cleaned, material secured, etc.)',
    'PPE provided/enforced',
    'Unsafe equipment tagged/removed',
    'Reported to supervisor/management',
    'Emergency services contacted',
    'Other',
  ];

  // ── Corrective action options
  const correctiveActions = [
    'Conduct safety briefing / re-induction',
    'Provide additional PPE / enforce correct use',
    'Repair / replace defective equipment',
    'Improve guarding / install safety devices',
    'Revise work procedure / method statement',
    'Conduct retraining for workers',
    'Increase supervision / monitoring',
    'Conduct risk assessment / HIRARC review',
    'Improve housekeeping / site organization',
    'Implement engineering controls (ventilation, barriers, etc.)',
    'Review and update safety policy / SOP',
    'Assign accountability and monitor compliance',
    'Other',
  ];

  // ── Underlying cause options
  const underlyingCauses = [
    'Inadequate training / lack of competency',
    'Poor supervision / insufficient monitoring',
    'Ineffective communication of safety procedures',
    'Lack of enforcement of safety rules',
    'Deficient risk assessment or job hazard analysis',
    'Inadequate work planning / rushed work schedule',
    'Insufficient resources (manpower, time, budget)',
    'Defective or poorly maintained equipment',
    'Inadequate PPE provision or enforcement',
    'Poor housekeeping practices / site layout issues',
    'Inadequate procedures or unclear work instructions',
    'Weak safety culture (low awareness, tolerance of risk)',
    'Failure to learn from past incidents / no follow-up on corrective actions',
    'Lack of management commitment to safety',
    'Subcontractor control failure (poor coordination, oversight)',
    'Fatigue / excessive working hours allowed by management',
    'Unsafe design or engineering controls not implemented',
    'Organizational pressure (cost/time over safety)',
    'Inadequate emergency preparedness',
    'Failure of inspection or audit systems',
    'Other',
  ];

  // ── Body part options
  const bodyPartOptions = bodyParts.length > 0 ? bodyParts : [
    'Head', 'Face', 'Neck', 'Eyes', 'Ears', 'Shoulder', 'Arm', 'Elbow',
    'Wrist', 'Hand', 'Fingers', 'Chest', 'Back', 'Abdomen', 'Hip / Pelvis',
    'Leg / Thigh', 'Knee', 'Ankle', 'Foot', 'Toes',
    'Respiratory System', 'Skin', 'Multiple Body Parts', 'Other (Specify)',
  ];

  return (
    <Layout>
      <Head title={title} />

      <div className={isInspector ? 'px-4 pt-5 pb-28 max-w-3xl mx-auto space-y-6' : 'px-12 max-w-7xl mx-auto space-y-8'}>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Provide incident details below. Mandatory fields are marked with <span className="text-red-500 font-bold">*</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.visit(endpoints.back)}
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest bg-slate-100 px-3 py-2 rounded-md"
          >
            {isInspector ? 'Back' : 'Back to Statistics'}
          </button>
        </div>

        {/* Step Indicator */}
        <nav className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
          {steps.map((s, i) => (
            <React.Fragment key={s.label}>
              <div
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${i === currentStep
                    ? 'bg-white shadow-sm ring-1 ring-slate-200'
                    : 'opacity-60'
                  }`}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${i === currentStep
                    ? 'bg-blue-600 text-white'
                    : i < currentStep ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                  {i + 1}
                </span>
                <span className={`text-[11px] font-bold uppercase tracking-wider hidden md:inline ${i === currentStep ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px bg-slate-200 mx-2 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </nav>

        <form onSubmit={handleSubmit} encType="multipart/form-data">

          {/* ── STEP 0: Basic Information ───────────────────────────────── */}
          {currentStep === 0 && (
            <Section title="Basic Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Date of Incident"
                  required
                  type="datetime-local"
                  value={data.incident_date}
                  onChange={e => setData('incident_date', e.target.value)}
                  error={errors.incident_date}
                />

                <Select
                  label="Company"
                  required
                  value={data.company_id}
                  onChange={e => setData('company_id', e.target.value)}
                  error={errors.company_id}
                  disabled
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>

                <Select
                  label="Project / Site Name"
                  required
                  value={data.project_id}
                  onChange={e => setData('project_id', e.target.value)}
                  error={errors.project_id}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>

                <Select
                  label="Contractor / Subcontractor"
                  value={data.subcon_company_id}
                  onChange={e => setData('subcon_company_id', e.target.value)}
                  error={errors.subcon_company_id}
                  disabled={isLoadingAssignments || !data.project_id}
                >
                  <option value="">Select Contractor</option>
                  {filteredSubconCompanies.map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </Select>

                <Input
                  label="Location"
                  required
                  type="text"
                  placeholder="e.g. Kuching, Level 3 Site Office"
                  value={data.location}
                  onChange={e => setData('location', e.target.value)}
                  error={errors.location}
                />

                <Select
                  label="Responsible Person"
                  required
                  value={data.responsible_by}
                  onChange={e => setData('responsible_by', e.target.value)}
                  error={errors.responsible_by}
                  disabled={isLoadingAssignments || !data.project_id || !!selfStaffId}
                >
                  <option value="">Select Person</option>
                  {filteredStaffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}{s.role_name ? ` — ${s.role_name}` : ''}</option>
                  ))}
                </Select>

                {/* Reported By field - hidden, auto-set on backend */}
                <div className="hidden">
                  <input type="hidden" name="reported_by" value={data.reported_by} />
                </div>
              </div>

              {isLoadingAssignments && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold animate-pulse">
                    Retrieving project assignments...
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* ── STEP 1: Incident Classification ────────────────────────── */}
          {currentStep === 1 && (
            <Section title="Incident Classification">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select
                  label="Incident Type"
                  required
                  value={data.incident_id}
                  onChange={e => setData('incident_id', e.target.value)}
                  error={errors.incident_id}
                >
                  <option value="">Select Incident Type</option>
                  {incidentTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>

                <Select
                  label="Injury Type"
                  value={data.injury_id}
                  onChange={e => setData('injury_id', e.target.value)}
                  error={errors.injury_id}
                >
                  <option value="">Select Injury Type</option>
                  {injuryTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>

                <Select
                  label="Body Part Affected"
                  value={data.body_part}
                  onChange={e => setData('body_part', e.target.value)}
                  error={errors.body_part}
                >
                  <option value="">Select Body Part</option>
                  {bodyPartOptions.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>
            </Section>
          )}

          {/* ── STEP 2: Case Details ────────────────────────────────────── */}
          {currentStep === 2 && (
            <Section title="Case Details">
              <div className="space-y-6">
                {/* Subcontractor staff involved */}
                <div>
                  <Label>Subcontractor staff involved</Label>
                  {!data.subcon_company_id ? (
                    <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                      Choose the contractor / subcontractor in Basic Info to list its staff.
                    </p>
                  ) : isLoadingStaff ? (
                    <p className="text-sm text-slate-500">Loading staff…</p>
                  ) : subconStaff.length === 0 ? (
                    <p className="text-sm text-amber-600">This subcontractor has no staff registered.</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100 bg-white">
                      {subconStaff.map(person => (
                        <label key={person.id} className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={data.staff_ids.includes(person.id)}
                            onChange={() => toggleInvolved(person.id)}
                            className="h-5 w-5 rounded border-slate-300 text-blue-600"
                          />
                          <span className="text-sm font-medium text-slate-800">{person.name}</span>
                          {person.role && <span className="text-xs text-slate-400">{person.role}</span>}
                        </label>
                      ))}
                    </div>
                  )}
                  {data.staff_ids.length > 0 && (
                    <p className="mt-1.5 text-xs font-semibold text-blue-700">{data.staff_ids.length} staff selected</p>
                  )}
                  <Error msg={errors.staff_ids} />
                </div>

                <Textarea
                  label="Incident Description"
                  required
                  placeholder="Provide a chronological description of the event..."
                  value={data.incident_description}
                  onChange={e => setData('incident_description', e.target.value)}
                  error={errors.incident_description}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Select
                    label="Immediate Cause"
                    required
                    value={data.immediate_cause}
                    onChange={e => setData('immediate_cause', e.target.value)}
                    error={errors.immediate_cause}
                  >
                    <option value="">Select Immediate Cause</option>
                    {immediateCauses.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>

                  <Select
                    label="Underlying Cause"
                    value={data.underlying_cause}
                    onChange={e => setData('underlying_cause', e.target.value)}
                    error={errors.underlying_cause}
                  >
                    <option value="">Select Underlying Cause (Optional)</option>
                    {underlyingCauses.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>

                {/* Attachment */}
                <div>
                  <Label>Evidence / Photo Upload</Label>
                  <label className="group flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                    <div className="text-center">
                      <div className="mx-auto w-10 h-10 mb-3 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        {data.attachment_upload ? data.attachment_upload.name : 'Choose file or drag and drop'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-tighter font-bold">PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => setData('attachment_upload', e.target.files[0])}
                    />
                  </label>
                  <Error msg={errors.attachment_upload} />
                </div>
              </div>
            </Section>
          )}

          {/* ── STEP 3: Follow-up & Actions ────────────────────────────── */}
          {currentStep === 3 && (
            <Section title="Follow-up & Actions">
              <div className="space-y-6">
                <Select
                  label="Immediate Action Taken"
                  required
                  value={data.immediate_action}
                  onChange={e => setData('immediate_action', e.target.value)}
                  error={errors.immediate_action}
                >
                  <option value="">Select Immediate Action</option>
                  {immediateActions.map(a => <option key={a} value={a}>{a}</option>)}
                </Select>

                <Select
                  label="Corrective / Preventive Action"
                  value={data.corrective}
                  onChange={e => setData('corrective', e.target.value)}
                  error={errors.corrective}
                >
                  <option value="">Select Corrective Action</option>
                  {correctiveActions.map(a => <option key={a} value={a}>{a}</option>)}
                </Select>
              </div>
            </Section>
          )}

          {/* ── STEP 4: Impact & Recording ─────────────────────────────── */}
          {currentStep === 4 && (
            <Section title="Impact & Recording">
              {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Manhours Lost"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={data.manhours_lost}
                  onChange={e => setData('manhours_lost', e.target.value)}
                  error={errors.manhours_lost}
                />
              </div> */}

              {/* Summary review before submit */}
              <div className="bg-slate-900 rounded-xl p-8 text-white shadow-xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Final Review Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                  {[
                    { label: 'Incident Date', val: data.incident_date },
                    { label: 'Site Location', val: data.location },
                    { label: 'Classification', val: selectedType?.name ?? data.incident_id },
                    { label: 'Filing Status', val: data.status || 'Draft / Open' },
                  ].map(f => (
                    <div key={f.label} className="border-l border-slate-700 pl-4">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{f.label}</p>
                      <p className="text-sm font-medium text-slate-100">{f.val || 'Not Specified'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* ── Navigation Buttons ──────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200 mt-8">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentStep === 0}
              className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all uppercase tracking-wider"
            >
              Previous
            </button>

            <div className="hidden sm:flex items-center gap-2">
              {steps.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentStep ? 'bg-blue-600' : 'bg-slate-200'}`} />
              ))}
            </div>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="w-full sm:w-auto px-8 py-2.5 bg-ink-900 text-brand-400 rounded-lg text-sm font-bold hover:bg-ink-800 transition-all shadow-md uppercase tracking-wider"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={processing}
                className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-60 flex items-center justify-center gap-3 uppercase tracking-wider"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Processing
                  </>
                ) : 'Submit Report'}
              </button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default IncidentCreate;