import { transporter, getBaseUrl } from '../config/email';
import { User, Employee, Leave } from '../models';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

// Send email helper
export const sendEmail = async (options: EmailOptions) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            console.warn('Email credentials not found. Email not sent:', options.subject);
            return false;
        }

        const info = await transporter.sendMail({
            from: `"${process.env.COMPANY_NAME || 'HR System'}" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });

        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// ==================== TEMPLATES ====================

const getBaseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4338ca; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4338ca; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .status-approved { color: #166534; font-weight: bold; }
        .status-rejected { color: #991b1b; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>HR Management System</h2>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
`;

// ==================== NOTIFICATION FUNCTIONS ====================

/**
 * Send welcome email to new employee
 */
export const sendWelcomeEmail = async (user: User, password: string) => {
    const loginUrl = `${getBaseUrl()}/login`;
    const content = `
        <h3>Welcome to the team, ${user.firstName}!</h3>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        <p>
            <strong>Email:</strong> ${user.email}<br>
            <strong>Password:</strong> ${password}
        </p>
        <p>Please login and change your password immediately.</p>
        <a href="${loginUrl}" class="button">Login to Dashboard</a>
    `;

    return sendEmail({
        to: user.email,
        subject: 'Welcome to HR Management System',
        html: getBaseTemplate(content)
    });
};

/**
 * Send notification for new leave application (to Manager/HR)
 */
export const sendLeaveApplicationNotification = async (
    applicant: User,
    leave: Leave,
    approverEmail: string
) => {
    const dashboardUrl = `${getBaseUrl()}/leaves`;
    const content = `
        <h3>New Leave Application</h3>
        <p><strong>${applicant.firstName} ${applicant.lastName}</strong> has applied for leave.</p>
        <p>
            <strong>Type:</strong> ${leave.leaveType}<br>
            <strong>Dates:</strong> ${leave.startDate} to ${leave.endDate}<br>
            <strong>Days:</strong> ${leave.totalDays}<br>
            <strong>Reason:</strong> ${leave.reason}
        </p>
        <p>Please review and take action.</p>
        <a href="${dashboardUrl}" class="button">View Application</a>
    `;

    return sendEmail({
        to: approverEmail,
        subject: `Leave Application: ${applicant.firstName} ${applicant.lastName}`,
        html: getBaseTemplate(content)
    });
};

/**
 * Send notification when leave is approved/rejected (to Applicant)
 */
export const sendLeaveStatusNotification = async (
    applicant: User,
    leave: Leave,
    status: string,
    approver: User
) => {
    const isApproved = status === 'approved';
    const statusClass = isApproved ? 'status-approved' : 'status-rejected';

    const content = `
        <h3>Leave Application Update</h3>
        <p>Your leave application has been <span class="${statusClass}">${status.toUpperCase()}</span>.</p>
        <p>
            <strong>Type:</strong> ${leave.leaveType}<br>
            <strong>Dates:</strong> ${leave.startDate} to ${leave.endDate}<br>
            <strong>Processed by:</strong> ${approver.firstName} ${approver.lastName}
        </p>
        ${!isApproved && leave.approverComments ? `<p><strong>Reason:</strong> ${leave.approverComments}</p>` : ''}
    `;

    return sendEmail({
        to: applicant.email,
        subject: `Leave Application ${status.toUpperCase()}`,
        html: getBaseTemplate(content)
    });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user: User, token: string) => {
    const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;
    const content = `
        <h3>Password Reset Request</h3>
        <p>Hello ${user.firstName},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
    `;

    return sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: getBaseTemplate(content)
    });
};
