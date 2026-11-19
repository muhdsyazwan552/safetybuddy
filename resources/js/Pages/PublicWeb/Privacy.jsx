import React from 'react';
import LegalPage from './LegalPage';

const SECTIONS = [
    { h: 'Information We Collect', p: ['We collect the following categories of information:'], ul: [
        'Account information: name, email address, phone number, company name and registration details, job role and password (stored in encrypted form).',
        'Company and project data: projects, inspections, incident reports, manhour records, safety induction records, staff and contractor details and uploaded files or photos that you or your users submit.',
        'Payment information: subscription and billing details. Card details are handled by our payment processor and are not stored on our servers.',
        'Usage and device information: IP address, browser type, pages visited, log data and cookies.',
    ] },
    { h: 'How We Use Your Information', ul: [
        'To provide, operate and maintain the Service and your account;',
        'to process subscriptions, payments and send order or expiry notices;',
        'to generate safety performance metrics and reports requested by you;',
        'to send service-related emails such as verification, password reset and security alerts;',
        'to provide support, respond to enquiries and improve the Service;',
        'to detect, prevent and investigate fraud, abuse and security incidents;',
        'to comply with legal obligations.',
    ] },
    { h: 'Legal Basis and Consent', p: [
        'We process personal data in accordance with the Personal Data Protection Act 2010 (Malaysia) and other applicable laws. By registering and using the Service you consent to the collection and use of your information as described in this Policy. Where you provide personal data of other individuals (for example staff or contractors), you confirm you have the right and consent to do so.',
    ] },
    { h: 'Sharing of Information', p: ['We do not sell your personal data. We may share information only:'], ul: [
        'with other users in your organisation, according to the roles and access rights set by your company administrator;',
        'with service providers who help us operate the Service (such as hosting, email delivery and payment processing), under confidentiality obligations;',
        'when required by law, regulation, court order or a lawful request from authorities;',
        'in connection with a merger, acquisition or sale of assets, with notice to you.',
    ] },
    { h: 'Cookies', p: [
        'We use cookies and similar technologies to keep you signed in, remember preferences, secure your session and understand how the Service is used. You can control cookies through your browser settings, but some features may not work without them.',
    ] },
    { h: 'Data Retention', p: [
        'We keep your information for as long as your account is active or as needed to provide the Service, and afterwards for as long as necessary to meet legal, accounting and dispute-resolution requirements. Safety and incident records may be retained for the periods required by occupational safety regulations.',
    ] },
    { h: 'Data Security', p: [
        'We use reasonable technical and organisational measures, including encryption in transit, access controls and regular backups, to protect your information. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
    ] },
    { h: 'Your Rights', p: ['Subject to applicable law, you may:'], ul: [
        'request access to the personal data we hold about you;',
        'request correction of inaccurate or incomplete data;',
        'withdraw your consent or request deletion of your data, which may affect your ability to use the Service;',
        'object to or limit certain processing.',
    ], },
    { h: 'International Transfers', p: [
        'Your information may be stored or processed on servers located outside Malaysia. Where this happens we take steps to ensure it is protected in line with applicable data protection laws.',
    ] },
    { h: "Children's Privacy", p: [
        'The Service is intended for business use and is not directed to individuals under 18. We do not knowingly collect personal data from children.',
    ] },
    { h: 'Changes to This Policy', p: [
        'We may update this Privacy Policy from time to time. The "Last updated" date shows when it was last revised, and material changes will be notified through the Service or by email.',
    ] },
    { h: 'Contact Us', p: [
        'For privacy questions or to exercise your rights, contact us at hello@sbcmeri.com or +60 16-886 5619, Kuala Lumpur, Malaysia.',
    ] },
];

export default function Privacy() {
    return (
        <LegalPage
            title="Privacy Policy"
            updated="19 November 2026"
            intro='Safety Buddy ("we", "us", "our") respects your privacy. This Privacy Policy explains what personal data we collect, how we use and protect it, and the choices you have when using our platform.'
            sections={SECTIONS}
        />
    );
}
