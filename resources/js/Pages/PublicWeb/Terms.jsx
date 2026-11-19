import React from 'react';
import LegalPage from './LegalPage';

const SECTIONS = [
    { h: 'Acceptance of Terms', p: [
        'By creating an account, accessing or using Safety Buddy (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of a company or organisation, you confirm that you have the authority to bind that organisation to these Terms.',
        'If you do not agree to these Terms, you must not use the Service.',
    ] },
    { h: 'Description of the Service', p: [
        'Safety Buddy is a web-based platform for safety control, performance measurement and reporting, including project and inspection management, incident reporting, manhour tracking, safety induction and compliance metrics for companies, contractors and training providers.',
        'We may add, change or remove features from time to time.',
    ] },
    { h: 'Accounts and Registration', ul: [
        'You must provide accurate, current and complete information when registering and keep it up to date.',
        'You are responsible for keeping your login credentials confidential and for all activity under your account.',
        'You must notify us immediately of any unauthorised use of your account.',
        'Company administrators are responsible for the staff and users they add and the access rights they assign.',
    ] },
    { h: 'Subscriptions, Fees and Payment', ul: [
        'Certain features require a paid subscription plan. Prices and plan details are shown at the time of purchase.',
        'Subscriptions are billed in advance for the selected period and renew or expire as described for your plan.',
        'Unless required by law or stated otherwise, fees are non-refundable.',
        'Access to paid modules may be suspended if your subscription expires or payment is not received.',
    ] },
    { h: 'Acceptable Use', p: ['You agree not to:'], ul: [
        'use the Service for any unlawful, fraudulent or harmful purpose;',
        'upload false, misleading or defamatory content, or content that infringes the rights of others;',
        'attempt to gain unauthorised access to the Service, other accounts, or our systems or networks;',
        'introduce viruses, malicious code, or interfere with or disrupt the Service;',
        'copy, resell, reverse engineer or exploit any part of the Service except as permitted by law or by us in writing.',
    ] },
    { h: 'Your Data and Content', p: [
        'You retain ownership of the data and content you submit to the Service ("Customer Data"). You grant us a limited licence to host, process and display Customer Data solely to provide and improve the Service.',
        'You are responsible for the accuracy and legality of Customer Data and for having the right to submit any personal data of your staff, contractors or other individuals.',
        'Our handling of personal data is described in our Privacy Policy.',
    ] },
    { h: 'Intellectual Property', p: [
        'The Service, including its software, design, text, graphics, logos and the CMERI framework, is owned by Safety Buddy or its licensors and is protected by intellectual property laws. These Terms do not transfer any ownership to you. You are granted a limited, non-exclusive, non-transferable right to use the Service for your internal business purposes while these Terms are in effect.',
    ] },
    { h: 'Third-Party Services', p: [
        'The Service may contain links to, or integrate with, third-party services such as payment processors, email and mapping providers. We are not responsible for the content, terms or practices of third parties.',
    ] },
    { h: 'Disclaimer of Warranties', p: [
        'The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including fitness for a particular purpose and non-infringement. We do not warrant that the Service will be uninterrupted or error-free.',
        'Safety Buddy is a management and reporting tool. It does not replace professional safety judgement, site supervision, or your obligations under applicable occupational safety and health laws and regulations.',
    ] },
    { h: 'Limitation of Liability', p: [
        'To the maximum extent permitted by law, Safety Buddy and its directors, employees and partners will not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits, data or business, arising from your use of or inability to use the Service.',
        'Our total liability for any claim relating to the Service will not exceed the amount you paid us for the Service in the twelve (12) months before the claim arose.',
    ] },
    { h: 'Suspension and Termination', p: [
        'You may stop using the Service at any time. We may suspend or terminate your access if you breach these Terms, if required by law, or if your subscription is not maintained.',
        'On termination your right to use the Service ends. We may retain or delete Customer Data in accordance with our Privacy Policy and applicable law.',
    ] },
    { h: 'Changes to These Terms', p: [
        'We may update these Terms from time to time. Material changes will be notified through the Service or by email. Continued use of the Service after changes take effect means you accept the updated Terms.',
    ] },
    { h: 'Governing Law', p: [
        'These Terms are governed by the laws of Malaysia. Any dispute will be subject to the exclusive jurisdiction of the courts of Malaysia.',
    ] },
    { h: 'Contact Us', p: [
        'If you have any questions about these Terms, please contact us at hello@sbcmeri.com or +60 16-886 5619.',
    ] },
];

export default function Terms() {
    return (
        <LegalPage
            title="Terms of Service"
            updated="19 November 2026"
            intro='Welcome to Safety Buddy. Please read these Terms of Service carefully before using our platform. They set out the rules for using the Service and form a legal agreement between you and Safety Buddy ("we", "us", "our").'
            sections={SECTIONS}
        />
    );
}
