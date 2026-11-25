// One set of labels / colours for the NC / CC progress state (open → responded → returned → closed),
// used by every list and detail screen so the same case never reads differently on two pages.
export const CASE_STATE = {
    open: { label: 'Awaiting reply', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' },
    responded: { label: 'Replied', badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700' },
    returned: { label: 'Returned', badge: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700' },
    closed: { label: 'Closed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' },
};

export const caseStateOf = (item) => CASE_STATE[item?.state] || CASE_STATE[item?.status === 'closed' ? 'closed' : 'open'];
